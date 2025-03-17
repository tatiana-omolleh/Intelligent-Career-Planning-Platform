from django.contrib import admin
from .models import (
    InternshipApplication, User, RoleTransition, Partner,
    PartnerInteraction, JobInternship, EventCalendar,
    Meeting, ELearningModule, ELearningContent, ProgressTable
)

admin.site.register(User)
# admin.site.register(StudentDetails)
# admin.site.register(CareerMemberDetails)
admin.site.register(RoleTransition)
admin.site.register(Partner)
admin.site.register(PartnerInteraction)
admin.site.register(JobInternship)
admin.site.register(InternshipApplication)
# admin.site.register(StudentOpportunity)
admin.site.register(EventCalendar)
admin.site.register(Meeting)
admin.site.register(ELearningModule)
admin.site.register(ELearningContent)
admin.site.register(ProgressTable)
