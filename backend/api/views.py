from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView, UpdateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth import get_user_model
from django.db.models import Case, When, Value, IntegerField
from rest_framework import generics
from django.conf import settings
import os
import joblib
import pandas as pd
from .ml_models.recommender_engine import CareerRecommender

from .serializers import (
    ExperienceSerializer, ProfileSerializer, RegisterUserSerializer, CustomTokenObtainPairSerializer, ProfileUpdateSerializer,
    AssessmentSerializer, AssessmentCreateUpdateSerializer, JobSerializer, JobListSerializer
)
from .utils import generate_verification_token, send_verification_email
from .models import Experience, Profile, User, Assessment, Job

User = get_user_model()

# ---------------------------------------------------------
# ✅ GLOBAL MODEL LOADER (Singleton Pattern)
# ---------------------------------------------------------
recommender_engine = None

def get_recommender():
    """
    Loads the trained machine learning model only once when needed.
    """
    global recommender_engine
    if recommender_engine is None:
        # Adjust path to match your project structure
        model_path = os.path.join(settings.BASE_DIR, 'api/ml_models/career_recommender.pkl')
        try:
            if os.path.exists(model_path):
                print(f"📂 Loading pre-trained model from {model_path}...")
                recommender_engine = CareerRecommender.load_model(model_path)
                print("✅ Model loaded successfully.")
            else:
                print("⚠️ Model file not found. Training new model (fallback)...")
                recommender_engine = CareerRecommender()
                recommender_engine.train()
                # Optional: save it
                # recommender_engine.save_model(model_path)
                print("✅ New model trained.")
        except Exception as e:
            print(f"❌ Error loading recommender: {e}")
            # Fallback
            recommender_engine = CareerRecommender()
            recommender_engine.train()
            
    return recommender_engine


# ---------------------------------------------------------
# AUTH VIEWS
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# ASSESSMENT & PREDICTION VIEWS
# ---------------------------------------------------------

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
            serializer = AssessmentCreateUpdateSerializer(assessment, data=request.data, partial=True)
        except Assessment.DoesNotExist:
            serializer = AssessmentCreateUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            assessment = serializer.save(user=request.user)
            response_serializer = AssessmentSerializer(assessment)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# This can be removed if you strictly use the functional view 'predict_career'
# or kept as an alternative. I'm renaming it to avoid import confusion if both exist.
class AssessmentPredictView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        return predict_career(request) # Proxy to the function


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_career(request):
    """
    Generates career recommendations using the new ML Recommender Engine.
    It aggregates user Assessment data + Experiences into a format the model understands.
    """
    user = request.user

    # 1. Fetch Latest Assessment
    try:
        assessment = Assessment.objects.get(user=user)
    except Assessment.DoesNotExist:
        return Response({"error": "No assessment found. Please complete the form first."}, status=404)

    # 2. Fetch and Aggregate Experiences
    experiences = Experience.objects.filter(assessment=assessment)
    
    exp_counts = {
        "Extracurricular_Activities": 0,
        "Internships": 0,
        "Projects": 0,
        "Leadership_Positions": 0,
        "Research_Experience": 0,
    }
    
    for exp in experiences:
        t = exp.type 
        if t == "Extracurricular": exp_counts["Extracurricular_Activities"] += 1
        elif t == "Internship": exp_counts["Internships"] += 1
        elif t == "Project": exp_counts["Projects"] += 1
        elif t == "Leadership": exp_counts["Leadership_Positions"] += 1
        elif t == "Research": exp_counts["Research_Experience"] += 1

    # 3. Prepare Input Vector
    try:
        input_data = {
            'Field': assessment.other_field if assessment.field == 'Other' else assessment.field,
            'GPA': float(assessment.gpa),
            
            # Skills Mapping (x2 for scaling 1-5 to 0-10)
            'Coding_Skills': assessment.coding_skills * 2,
            'Communication_Skills': assessment.communication_skills * 2,
            'Problem_Solving_Skills': assessment.problem_solving_skills * 2,
            'Teamwork_Skills': assessment.teamwork_skills * 2,
            'Analytical_Skills': assessment.analytical_skills * 2,
            'Presentation_Skills': assessment.presentation_skills * 2,
            'Networking_Skills': assessment.networking_skills * 2,
            'Industry_Certifications': assessment.industry_certifications * 2,
            
            # Experience Counts
            **exp_counts,
            
            # Heuristic: Field courses boosted by internships
            'Field_Specific_Courses': 5 + (2 if exp_counts['Internships'] > 0 else 0)
        }

        # 4. Run Prediction
        engine = get_recommender()
        recommendations = engine.predict(input_data)
        
        if not recommendations:
             return Response({"error": "No recommendations could be generated."}, status=500)

        # 5. Save Best Match
        best_career = recommendations[0]['career']
        assessment.recommended_career = best_career
        assessment.save()

        # 6. Format Response for Frontend
        formatted_recs = []
        for rec in recommendations:
            formatted_recs.append({
                "career": rec['career'],
                "score": rec['score'], 
                "match_score": rec['match_rate'],
                "salary": "$60k - $120k", 
                "growth": "High",
                "location": "Hybrid"
            })

        return Response({
            "recommended_career": best_career,
            "recommendations": formatted_recs
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Prediction Error: {e}")
        return Response({"error": f"Prediction failed: {str(e)}"}, status=500)


# ---------------------------------------------------------
# EXPERIENCE MANAGEMENT VIEWS
# ---------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def experiences_view(request):
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


# ---------------------------------------------------------
# JOB & INTERNSHIP VIEWS
# ---------------------------------------------------------

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
        
        work_type = self.request.query_params.get('work_type', None)
        industry = self.request.query_params.get('industry', None)
        location = self.request.query_params.get('location', None)
        min_salary = self.request.query_params.get('min_salary', None)
        max_salary = self.request.query_params.get('max_salary', None)
        
        if work_type: queryset = queryset.filter(work_type=work_type)
        if industry: queryset = queryset.filter(industry__icontains=industry)
        if location: queryset = queryset.filter(location__icontains=location)
        if min_salary: queryset = queryset.filter(med_salary__gte=min_salary)
        if max_salary: queryset = queryset.filter(med_salary__lte=max_salary)
            
        return queryset


class JobDetailView(RetrieveAPIView):
    """Get job details by ID - no authentication required"""
    serializer_class = JobSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Job.objects.filter(is_active=True)


class RecommendedInternshipListView(generics.ListAPIView):
    """
    Lists all active internships, with jobs matching the user's
    recommended career industry appearing at the top.
    """
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Job.objects.filter(work_type='Internship', is_active=True)

        try:
            assessment = Assessment.objects.get(user=user)
            recommended_career_industry = assessment.field 
            
            if recommended_career_industry:
                queryset = queryset.annotate(
                    recommend_score=Case(
                        When(industry__icontains=recommended_career_industry, then=Value(1)),
                        default=Value(2),
                        output_field=IntegerField()
                    )
                )
                return queryset.order_by('recommend_score', '-created_at')

        except Assessment.DoesNotExist:
            pass

        return queryset.order_by('-created_at')