# backend/api/views_chatbot.py
import logging
import google.generativeai as genai
from google.api_core.exceptions import NotFound
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from .models import ChatConversation, ChatMessage, Assessment
from .serializers import ChatConversationSerializer, ChatMessageSerializer

logger = logging.getLogger(__name__)

# Initialize Gemini
GEMINI_API_KEY = getattr(settings, "GEMINI_API_KEY", None)
GEMINI_MODEL_NAME = getattr(settings, "GEMINI_MODEL_NAME", "gemini-2.5-flash")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# --- Rate Limiting Helpers ---
def _increment_user_message_count(user_id):
    key = f"chat_count_user_{user_id}_{timezone.now().date()}"
    count = cache.get(key, 0) + 1
    cache.set(key, count, 24 * 3600)
    return count

def _user_message_count(user_id):
    key = f"chat_count_user_{user_id}_{timezone.now().date()}"
    return cache.get(key, 0)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_with_ai(request):
    """
    POST /api/chatbot/ 
    body: { message: str, conversation_id?: int }
    Returns: {reply, conversation_id, message_id}
    """
    user = request.user
    message = (request.data.get("message") or "").strip()
    conv_id = request.data.get("conversation_id")

    if not message:
        return Response({"error": "No message provided"}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Rate Limiting
    count = _user_message_count(user.user_id)
    if count >= 500:  # Generous daily limit for free tier
        return Response({"error": "Daily message limit reached."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

    # 2. Get or Create Conversation
    conv = None
    if conv_id:
        conv = ChatConversation.objects.filter(pk=conv_id, user=user).first()
    
    if not conv:
        conv = ChatConversation.objects.create(user=user, title=None)

    # 3. Save User Message to DB
    ChatMessage.objects.create(conversation=conv, sender="user", text=message)

    # 4. Build Context from Assessment
    context_pieces = []
    try:
        # Use related_name 'assessment' from your User model
        if hasattr(user, 'assessment'):
            assessment = user.assessment
            context_pieces.append(f"Student Field: {assessment.field}")
            context_pieces.append(f"GPA: {assessment.gpa}")
            context_pieces.append(f"Coding Skills: {assessment.coding_skills}/10")
            context_pieces.append(f"Problem Solving: {assessment.problem_solving_skills}/10")
            if assessment.recommended_career:
                context_pieces.append(f"Target Career: {assessment.recommended_career}")
    except Exception as e:
        logger.warning(f"Could not fetch assessment for context: {e}")

    user_context = "; ".join(context_pieces) if context_pieces else "No specific academic profile data."

    # 5. Call Google Gemini API
    try:
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in settings.")

        # Use configurable Gemini model (defaults to flash)
        model = genai.GenerativeModel(model_name=GEMINI_MODEL_NAME)
        
        # Construct the prompt
        # Gemini works best when context and instructions are clear
        full_prompt = (
            "You are Kazini, a helpful and empathetic career mentor for university students. "
            "Keep your answers concise (under 100 words) and actionable.\n\n"
            f"CONTEXT ABOUT STUDENT: {user_context}\n\n"
            f"STUDENT MESSAGE: {message}"
        )

        response = model.generate_content(full_prompt)
        ai_text = getattr(response, "text", None) or "I'm having trouble thinking right now. Please try again."

        # 6. Save AI Response to DB
        ai_msg = ChatMessage.objects.create(conversation=conv, sender="ai", text=ai_text)

        # 7. Update Conversation Title (if new)
        if not conv.title:
            # Generate a short title based on the first interaction
            conv.title = (message[:30] + "...") if len(message) > 30 else message
        
        conv.last_activity = timezone.now()
        conv.save(update_fields=["title", "last_activity"])

        # Increment Usage
        _increment_user_message_count(user.user_id)

        return Response({
            "reply": ai_text,
            "conversation_id": conv.id,
            "message_id": ai_msg.id,
        }, status=status.HTTP_200_OK)

    except NotFound as e:
        logger.error("Gemini model not found (%s). Set GEMINI_MODEL_NAME to a valid model.", GEMINI_MODEL_NAME)
        fallback_text = "I'm currently offline because the AI model is unavailable. Please try again soon!"
        ai_msg = ChatMessage.objects.create(conversation=conv, sender="ai", text=fallback_text)
        return Response({
            "reply": fallback_text,
            "conversation_id": conv.id,
            "message_id": ai_msg.id,
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        logger.exception("Gemini AI call failed: %s", e)
        
        fallback_text = "I'm currently offline, but I recommend checking the 'Jobs' tab for opportunities matching your profile!"
        ai_msg = ChatMessage.objects.create(conversation=conv, sender="ai", text=fallback_text)
        
        return Response({
            "reply": fallback_text,
            "conversation_id": conv.id,
            "message_id": ai_msg.id,
        }, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    """GET /api/chatbot/history/"""
    user = request.user
    qs = ChatConversation.objects.filter(user=user).order_by("-last_activity")
    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(qs, request)
    serializer = ChatConversationSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_conversation_messages(request, conv_id):
    """GET /api/chatbot/conversations/<conv_id>/messages/"""
    user = request.user
    conv = ChatConversation.objects.filter(pk=conv_id, user=user).first()
    if not conv:
        return Response({"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND)
    msgs = conv.messages.all().order_by("created_at")
    serializer = ChatMessageSerializer(msgs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def message_feedback(request, conv_id, message_id):
    """POST feedback for a message"""
    user = request.user
    conv = ChatConversation.objects.filter(pk=conv_id, user=user).first()
    if not conv:
        return Response({"error": "Conversation not found"}, status=404)
    
    msg = conv.messages.filter(pk=message_id).first()
    if not msg:
        return Response({"error": "Message not found"}, status=404)
        
    msg.feedback = request.data.get("feedback")
    msg.save(update_fields=["feedback"])
    return Response({"status": "success"})

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_conversation(request, conv_id):
    conv = ChatConversation.objects.filter(pk=conv_id, user=request.user).first()
    if not conv:
        return Response({"error":"Not found"}, status=404)
    conv.delete()
    return Response({"message":"deleted"}, status=200)