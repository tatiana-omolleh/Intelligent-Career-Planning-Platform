# api/urls.py
from .views_chatbot import chat_with_ai, get_conversation_messages, list_conversations, message_feedback
from django.urls import path, include
from .views import (
    ProfileView,
    RecommendedInternshipListView,
    RegisterUserView,
    CustomTokenObtainPairView,
    VerifyEmailView,
    ProfileUpdateView,
    AssessmentView,
    JobListView,
    JobDetailView,
    delete_experience,
    experiences_view,
    update_experience,
    predict_career,
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("register/", RegisterUserView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    # path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("verify-email/<uidb64>/<token>/", VerifyEmailView.as_view(), name="verify-email"),
    path("profile/update/", ProfileUpdateView.as_view(), name="profile-update"),

    # Assessment endpoints (JWT protected)
    path("assessment/", AssessmentView.as_view(), name="assessment"),
    path('assessment/predict/', predict_career, name='predict-career'),
        
    # Profile
    path("profile/", ProfileView.as_view(), name="profile"),

    # Experience management
    path("assessment/experience/", experiences_view, name="experiences"),
    path("assessment/experience/<int:experience_id>/", update_experience, name="update_experience"),
    path("assessment/experience/<int:experience_id>/delete/", delete_experience, name="delete_experience"),


    # Job endpoints (no authentication required)
    path("jobs/", JobListView.as_view(), name="job-list"),
    path("jobs/<int:id>/", JobDetailView.as_view(), name="job-detail"),

    # Recommended internships
    path("internships/", RecommendedInternshipListView.as_view(), name="internships-list"),

    path("admin/", include("api.urls_admin")),
    path("", include("api.urls_chatbot")),
]
