# api/views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import CreateAPIView, UpdateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from django.conf import settings
import os
import joblib
import pandas as pd

from .serializers import (
    ExperienceSerializer, ProfileSerializer, RegisterUserSerializer, CustomTokenObtainPairSerializer, ProfileUpdateSerializer,
    AssessmentSerializer, AssessmentCreateUpdateSerializer, JobSerializer, JobListSerializer
)
from .utils import generate_verification_token, send_verification_email
from .models import Experience, Profile, User, Assessment, Job

User = get_user_model()

class RegisterUserView(CreateAPIView):
    serializer_class = RegisterUserSerializer
    permission_classes = [AllowAny]

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = get_object_or_404(User, pk=uid)
            if user.email_verification_token == token and not user.is_verification_token_expired():
                user.is_active = True
                user.email_verification_token = None
                user.save()
                return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProfileUpdateView(UpdateAPIView):
    serializer_class = ProfileUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# Assessment Views
class AssessmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get the logged-in user's assessment"""
        try:
            assessment = Assessment.objects.get(user=request.user)
            serializer = AssessmentSerializer(assessment)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Assessment.DoesNotExist:
            return Response(
                {"message": "No assessment found for this user"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request):
        """Create or update user's assessment"""
        try:
            assessment = Assessment.objects.get(user=request.user)
            # Update existing assessment
            serializer = AssessmentCreateUpdateSerializer(assessment, data=request.data, partial=True)
        except Assessment.DoesNotExist:
            # Create new assessment
            serializer = AssessmentCreateUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            assessment = serializer.save(user=request.user)
            response_serializer = AssessmentSerializer(assessment)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AssessmentPredictView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Generate top 5 career recommendations using trained SVD model."""
        try:
            assessment = Assessment.objects.get(user=request.user)
        except Assessment.DoesNotExist:
            return Response({"error": "No assessment found for this user."}, status=status.HTTP_404_NOT_FOUND)

        # ✅ Load model + dataset
        model_path = os.path.join(settings.BASE_DIR, "api", "ml_models", "career_recommender.pkl")
        data_path = os.path.join(settings.BASE_DIR, "api", "ml_models", "career_path_in_all_field.csv")

        model = joblib.load(model_path)
        df = pd.read_csv(data_path)

        # Each student_id in the dataset corresponds to one student
        # We'll use user.id (or a synthetic ID if not found)
        student_id = request.user.pk

        # Predict top 5 careers for the user
        all_careers = df["Career"].unique()
        career_scores = []
        for career in all_careers:
            pred = model.predict(student_id, career)
            career_scores.append({
                "career": career,
                "score": round(pred.est, 3)
            })

        top_careers = sorted(career_scores, key=lambda x: x["score"], reverse=True)[:5]

        # ✅ Save best recommendation in DB
        best_career = top_careers[0]["career"]
        assessment.recommended_career = best_career
        assessment.save()

        # Include recommendations in response
        return Response({
            "recommended_career": best_career,
            "recommendations": top_careers
        }, status=status.HTTP_200_OK)


# Job Views
class JobPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class JobListView(ListAPIView):
    """List all jobs (paginated) - no authentication required"""
    serializer_class = JobListSerializer
    permission_classes = [AllowAny]
    pagination_class = JobPagination
    
    def get_queryset(self):
        queryset = Job.objects.filter(is_active=True)
        
        # Add filtering options
        work_type = self.request.query_params.get('work_type', None)
        industry = self.request.query_params.get('industry', None)
        location = self.request.query_params.get('location', None)
        min_salary = self.request.query_params.get('min_salary', None)
        max_salary = self.request.query_params.get('max_salary', None)
        
        if work_type:
            queryset = queryset.filter(work_type=work_type)
        if industry:
            queryset = queryset.filter(industry__icontains=industry)
        if location:
            queryset = queryset.filter(location__icontains=location)
        if min_salary:
            queryset = queryset.filter(med_salary__gte=min_salary)
        if max_salary:
            queryset = queryset.filter(med_salary__lte=max_salary)
            
        return queryset


class JobDetailView(RetrieveAPIView):
    """Get job details by ID - no authentication required"""
    serializer_class = JobSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Job.objects.filter(is_active=True)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def experiences_view(request):
    """
    GET  /api/assessment/experience/      → list all experiences for the logged-in user
    POST /api/assessment/experience/      → create a new experience for the logged-in user
    """
    try:
        assessment = Assessment.objects.get(user=request.user)
    except Assessment.DoesNotExist:
        return Response({"error": "Assessment not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        experiences = assessment.experiences.all()
        serializer = ExperienceSerializer(experiences, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = ExperienceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(assessment=assessment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_experience(request, experience_id):
    try:
        experience = Experience.objects.get(id=experience_id, assessment__user=request.user)
    except Experience.DoesNotExist:
        return Response({"error": "Experience not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = ExperienceSerializer(experience, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_experience(request, experience_id):
    try:
        experience = Experience.objects.get(id=experience_id, assessment__user=request.user)
    except Experience.DoesNotExist:
        return Response({"error": "Experience not found"}, status=status.HTTP_404_NOT_FOUND)
    
    experience.delete()
    return Response({"message": "Experience deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    experiences = assessment.experiences.all()
    serializer = ExperienceSerializer(experiences, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get the logged-in user's profile"""
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        """Update the logged-in user's profile"""
        profile, _ = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





