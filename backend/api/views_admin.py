from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db import models  # [Fix 1: Add this import]
from .permissions import IsAdminUser
from .serializers import UserSerializer

User = get_user_model()


class AdminUserListView(APIView):
    """
    Returns all users for admin dashboard.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # [Fix 2: Change 'date_joined' to 'created_at']
        users = User.objects.all().order_by('-created_at')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUpdateUserRoleView(APIView):
    """
    Allows admin to change a user's role.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, user_id):
        new_role = request.data.get("role")
        if not new_role:
            return Response({"error": "Role is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(user_id=user_id) # Note: Make sure to use user_id or pk if your model uses user_id as primary key
            user.role = new_role
            user.save()
            return Response({"message": f"{user.first_name}'s role updated to {new_role}"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class AdminToggleUserStatusView(APIView):
    """
    Enables or disables a user's account.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(user_id=user_id) # Note: Ensure this matches your model's PK
            user.is_active = not user.is_active
            user.save()
            status_label = "activated" if user.is_active else "deactivated"
            return Response({"message": f"User {user.email} has been {status_label}."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


class AdminDashboardStatsView(APIView):
    """
    Summary statistics for the admin dashboard.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()

        # This requires the 'from django.db import models' added above
        by_role = (
            User.objects.values('role')
            .order_by('role')
            .annotate(count=models.Count('user_id')) # Best practice to count PK
        )

        data = {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": inactive_users,
            "by_role": list(by_role),
        }
        return Response(data, status=status.HTTP_200_OK)