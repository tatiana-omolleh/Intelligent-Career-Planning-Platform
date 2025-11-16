from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Allows access to users with role='Admin' OR standard Django superusers.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and (
                getattr(request.user, "role", None) == "Admin"
                or request.user.is_superuser  # Add this check
            )
        )