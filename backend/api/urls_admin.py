from django.urls import path
from .views_admin import (
    AdminUserListView,
    AdminUpdateUserRoleView,
    AdminToggleUserStatusView,
    AdminDashboardStatsView,
    AdminJobListCreateView,
    AdminJobDetailView,
)

urlpatterns = [
    path("users/", AdminUserListView.as_view(), name="admin-users"),
    path("users/<int:user_id>/role/", AdminUpdateUserRoleView.as_view(), name="admin-update-user-role"),
    path("users/<int:user_id>/status/", AdminToggleUserStatusView.as_view(), name="admin-toggle-user-status"),
    path("stats/", AdminDashboardStatsView.as_view(), name="admin-dashboard-stats"),
    path("jobs/", AdminJobListCreateView.as_view(), name="admin-job-list-create"),
    path("jobs/<int:id>/", AdminJobDetailView.as_view(), name="admin-job-detail"),
]
