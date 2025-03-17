from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import ApplyInternshipView, AvailableInternshipsView, CreateAssignInternshipView, DeleteInternshipView, InternshipApplicationDetailView, InternshipApplicationsByInternshipView, InternshipApplicationsView, MyApplicationsView, NonCareerMembersView, ProfileUpdateView, RegisterUserView, UserListCreateView, WithdrawApplicationView

urlpatterns = [
    path("users/", UserListCreateView.as_view(), name="user-list"),
    path("register/", RegisterUserView.as_view(), name="register"),
    path("profile/update/", ProfileUpdateView.as_view(), name="profile-update"),
    path("internships/", AvailableInternshipsView.as_view(), name="available-internships"),
    path("internships/apply/", ApplyInternshipView.as_view(), name="apply-internship"),
    path("internships/myapplications/", MyApplicationsView.as_view(), name="my-applications"),
    path("internships/application/<int:pk>/", InternshipApplicationsView.as_view(), name="manage-applications"),
    path("internships/create/", CreateAssignInternshipView.as_view(), name="create-assign-internship"),
    path("internships/applications/<int:pk>/withdraw/", WithdrawApplicationView.as_view(), name="withdraw-application"),
    path("internships/<int:pk>/delete/", DeleteInternshipView.as_view(), name="delete-internship"),
    path("internships/<int:internship_id>/applications/", InternshipApplicationsByInternshipView.as_view(), name="internship-applications"),
    path("internships/applications/<int:pk>/", InternshipApplicationDetailView.as_view(), name="application-detail"),
    path("users/non-career/", NonCareerMembersView.as_view(), name="non-career-users"),

]
