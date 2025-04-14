from rest_framework.generics import ListCreateAPIView, CreateAPIView, UpdateAPIView, RetrieveUpdateAPIView,  ListAPIView, DestroyAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from .utils import generate_reset_token, generate_verification_token, send_verification_email, expiring_token_generator, verify_reset_token
from .permissions import IsCareersTeam
from django.utils.timezone import now
from .models import JobInternshipAssignedTo, Partner, PartnerInteraction, User, JobInternship, InternshipApplication, VerificationLog
from .serializers import AssignInternshipSerializer, CustomTokenObtainPairSerializer, PartnerInteractionSerializer, PartnerSerializer, UserSerializer, RegisterUserSerializer, ProfileUpdateSerializer, JobInternshipSerializer, InternshipApplicationSerializer
from django.http import JsonResponse
from django.views import View
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from django.db.models import OuterRef, Exists
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail, EmailMultiAlternatives
from django.views.decorators.csrf import csrf_exempt
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework.pagination import PageNumberPagination
from django.conf import settings

import json
import logging

logger = logging.getLogger(__name__)

from django.contrib.auth import get_user_model

User = get_user_model() 

class HomeView(View):
    def get(self, request):
        return JsonResponse({"message": "Welcome to the KenSAP Careers API!"})

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 25  # Default items per page
    page_size_query_param = 'page_size'
    max_page_size = 100

class RegisterUserView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterUserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            try:
                if serializer.validated_data.get("role") == "CareerMember":
                    return Response({"error": "CareerMembers cannot self-register."}, status=status.HTTP_400_BAD_REQUEST)
                
                user = serializer.save()
                return Response({"message": "User registered successfully", "user_id": user.user_id}, status=status.HTTP_201_CREATED)
            except IntegrityError:
                logger.error("IntegrityError: Email already exists.")
                return Response({"error": "Email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            except ValidationError as e:
                logger.error(f"ValidationError: {e}")
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        logger.warning(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RequestPasswordResetView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        user = User.objects.filter(email=email).first()

        if not user:
            return Response({"message": "If the email exists, a reset link will be sent."}, status=status.HTTP_200_OK)

        # Generate reset token
        uid, token = generate_reset_token(user)

        # Create reset link for frontend
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

        # Send reset email
        subject = "Reset Your Password"
        html_message = render_to_string("emails/password_reset_email.html", {"reset_url": reset_url})
        plain_message = strip_tags(html_message)

        email = EmailMultiAlternatives(subject, plain_message, settings.EMAIL_HOST_USER, [user.email])
        email.attach_alternative(html_message, "text/html")
        email.send()

        return Response({"message": "Password reset link sent!"}, status=status.HTTP_200_OK)
    
class ResetPasswordConfirmView(APIView):

    permission_classes = [AllowAny]
    
    def post(self, request, uid, token):
        new_password = request.data.get("password")

        # Validate token
        user = verify_reset_token(uid, token, User)

        if not user:
            return Response({"error": "Invalid or expired reset token."}, status=status.HTTP_400_BAD_REQUEST)

        # Update password
        user.set_password(new_password)
        user.save()

        return Response({"message": "Password reset successful!"}, status=status.HTTP_200_OK)

    
class UserListCreateView(ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsCareersTeam]  # Restrict access to Careers Team only

# Example Django View
class UserListView(APIView):
    def get(self, request):
        role = request.query_params.get('role')
        if role:
            roles = role.split(",")
            users = User.objects.filter(role__in=roles)
        else:
            users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class ProfileUpdateView(RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = ProfileUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Ensures users can only update their own profile."""
        return self.request.user  

    def update(self, request, *args, **kwargs):
     user = self.get_object()
     data = request.data.copy()

     try:
         serializer = self.get_serializer(user, data=data, partial=True)
         if serializer.is_valid():
            self.perform_update(serializer)
            user.update_role()  # Ensure role transition is checked
            return Response(serializer.data, status=status.HTTP_200_OK)

         logger.warning(f"Profile update validation error: {serializer.errors}")
         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

     except Exception as e:
        logger.error(f"Unexpected Error in Profile Update: {e}", exc_info=True)
        return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
     
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]  # Ensure only logged-in users can access this

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)

class AvailableInternshipsView(ListAPIView):
    """Lists only active and unassigned internships."""
    serializer_class = JobInternshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Exclude expired and assigned internships."""
        assigned_subquery = JobInternshipAssignedTo.objects.filter(
            jobinternship_id=OuterRef("internship_id")
        )

        return JobInternship.objects.filter(
            deadline__gte=now().date()
        ).exclude(
            Exists(assigned_subquery)  # ✅ Exclude assigned internships
        )
    
class ApplyInternshipView(CreateAPIView):
    """Students apply for internships. Only active & unassigned ones are visible."""
    serializer_class = InternshipApplicationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Automatically assigns the logged-in student before saving."""
        internship_id = self.request.data.get("internship")

        if not internship_id:
            return Response({"error": "Internship ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Ensure internship is active and unassigned
        is_assigned = JobInternshipAssignedTo.objects.filter(jobinternship_id=OuterRef("internship_id"))

        internship = JobInternship.objects.filter(
            internship_id=internship_id,
            deadline__gte=now().date()
        ).exclude(
            Exists(is_assigned)  # ✅ Exclude assigned internships
        ).first()

        if not internship:
            return Response({"error": "Invalid or unavailable internship."}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Check for duplicate applications before saving
        if InternshipApplication.objects.filter(student=self.request.user, internship=internship).exists():
            return Response({"error": "You have already applied for this internship."}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Save with logged-in student (Fixes NULL `student_id` error)
        serializer.save(student=self.request.user, internship=internship, status="Applied")


class MyApplicationsView(ListAPIView):
    """Students can view their internship applications and their status."""
    serializer_class = InternshipApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Students only see their own applications."""
        return InternshipApplication.objects.filter(student=self.request.user)
    
class InternshipApplicationsView(ListAPIView, UpdateAPIView):
    """Career Members can view and manage internship applications."""
    serializer_class = InternshipApplicationSerializer
    permission_classes = [IsAuthenticated, IsCareersTeam]

    def get_queryset(self):
        """Career Members can see all applications."""
        return InternshipApplication.objects.all()

    def update(self, request, *args, **kwargs):
        """Approve or reject internship applications."""
        instance = self.get_object()
        new_status = request.data.get("status")

        if new_status == "Accepted":
            # Reject other applications for the same internship
            InternshipApplication.objects.filter(
                internship=instance.internship
            ).exclude(id=instance.id).update(status="Rejected")

        instance.status = new_status
        instance.save()
        return Response({"message": f"Application status updated to {new_status}"}, status=status.HTTP_200_OK)
    

class DeleteInternshipView(DestroyAPIView):
    """Career Members can delete internships."""
    queryset = JobInternship.objects.all()
    serializer_class = JobInternshipSerializer
    permission_classes = [IsAuthenticated, IsCareersTeam]

class CreateAssignInternshipView(CreateAPIView):
    queryset = JobInternship.objects.all()
    serializer_class = AssignInternshipSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """Ensure only Career Members can create internships."""
        if request.user.role != "CareerMember":
            return Response({"error": "Only Career Members can create and assign internships."}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

# ✅ View for Students to Withdraw Application
class WithdrawApplicationView(DestroyAPIView):
    queryset = InternshipApplication.objects.all()
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        """Allow withdrawal if the application is NOT accepted."""
        application = self.get_object()
        if application.student != request.user:
            return Response({"error": "You can only withdraw your own application."}, status=status.HTTP_403_FORBIDDEN)

        if application.status == "Accepted":
            return Response({"error": "Cannot withdraw an accepted application."}, status=status.HTTP_400_BAD_REQUEST)

        application.delete()
        return Response({"message": "Application withdrawn successfully."}, status=status.HTTP_200_OK)
    
class InternshipApplicationsByInternshipView(ListAPIView):
    """Fetch applications for a specific internship."""
    serializer_class = InternshipApplicationSerializer
    permission_classes = [IsAuthenticated, IsCareersTeam]

    def get_queryset(self):
        internship_id = self.kwargs.get("internship_id")
        return InternshipApplication.objects.filter(internship_id=internship_id)

class NonCareerMembersView(ListAPIView):
    """Fetch all users except Career Members"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.exclude(role="CareerMember")
    
class InternshipApplicationDetailView(RetrieveAPIView):
    """Fetch a specific internship application"""
    serializer_class = InternshipApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InternshipApplication.objects.all()
    
class PartnerListCreateView(ListCreateAPIView):
    """Career Members can list all partners and add new ones."""
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer
    permission_classes = [IsAuthenticated, IsCareersTeam]

    def perform_create(self, serializer):
        """Automatically assign relationship owner as the creator."""
        serializer.save(relationship_owner=self.request.user)

class PartnerDetailUpdateView(RetrieveUpdateAPIView):
    """Career Members can view or update a specific partner."""
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer
    permission_classes = [IsAuthenticated, IsCareersTeam]

    def patch(self, request, *args, **kwargs):
        """Handles partial updates for category, lead_type, and status."""
        return self.partial_update(request, *args, **kwargs)

class PartnerInteractionListCreateView(ListCreateAPIView):
    """Career Members can log interactions with partners and view all interactions for a specific partner."""
    serializer_class = PartnerInteractionSerializer
    permission_classes = [IsAuthenticated, IsCareersTeam]

    def get_queryset(self):
        """Retrieve only interactions related to a specific partner."""
        partner_id = self.kwargs.get("partner_id")
        if not partner_id:
            return PartnerInteraction.objects.none()
        return PartnerInteraction.objects.filter(partner_id=partner_id).select_related("career_member", "partner")

    def perform_create(self, serializer):
        """Ensure career_member is set automatically."""
        serializer.save(career_member=self.request.user)  # ✅ Assigns logged-in user


class PartnerDeleteView(DestroyAPIView):
    """Allows Career Members to delete a partner."""
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer
    permission_classes = [IsAuthenticated, IsCareersTeam]

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class VerifyEmailView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = get_object_or_404(User, pk=uid)

            # Validate stored token
            if user.email_verification_token == token and not user.is_verification_token_expired():
                user.is_active = True  # Activate account
                user.email_verification_token = None  # Clear token after successful verification
                user.save()

                VerificationLog.objects.create(user=user, status="Success")

                return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)

            VerificationLog.objects.create(user=user, status="Failed")
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        user = get_object_or_404(User, email=email)

        if user.is_active:
            return Response({"message": "User already verified!"}, status=status.HTTP_400_BAD_REQUEST)

        uid, token = generate_verification_token(user)
        send_verification_email(user, uid, token)

        return Response({"message": "Verification email resent!"}, status=status.HTTP_200_OK)

