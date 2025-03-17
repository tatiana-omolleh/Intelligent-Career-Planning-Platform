from rest_framework import permissions

class IsCareersTeam(permissions.BasePermission):
    """
    Custom permission to allow only Careers Team members to access certain endpoints.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "CareerMember"

class IsStudentOrAlumni(permissions.BasePermission):
    """
    Custom permission to allow only students and alumni to access student-related features.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["KenSAP", "Undergrad", "Alumni"]
    

