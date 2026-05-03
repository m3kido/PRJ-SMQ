from django.contrib import admin

from .models import (
    Department,
    Process,
    ProcessDocument,
    Audit,
    NonConformity,
    CorrectiveAction,
    Notification,
    Kpi,
    UserProfile,
)


admin.site.register(Department)
admin.site.register(Process)
admin.site.register(ProcessDocument)
admin.site.register(Audit)
admin.site.register(NonConformity)
admin.site.register(CorrectiveAction)
admin.site.register(Notification)
admin.site.register(Kpi)
admin.site.register(UserProfile)
