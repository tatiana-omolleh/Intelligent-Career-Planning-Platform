from rest_framework.generics import ListCreateAPIView, CreateAPIView, UpdateAPIView, RetrieveUpdateAPIView,  ListAPIView, DestroyAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsCareersTeam
from django.utils.timezone import now
from .models import JobInternshipAssignedTo, University, User, JobInternship, InternshipApplication
from .serializers import AssignInternshipSerializer, UserSerializer, RegisterUserSerializer, ProfileUpdateSerializer, JobInternshipSerializer, InternshipApplicationSerializer
from django.http import JsonResponse
from django.views import View
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from django.db.models import OuterRef, Exists
import logging

logger = logging.getLogger(__name__)

class HomeView(View):
    def get(self, request):
        return JsonResponse({"message": "Welcome to the KenSAP Careers API!"})

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

class UserListCreateView(ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsCareersTeam]  # Restrict access to Careers Team only

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
