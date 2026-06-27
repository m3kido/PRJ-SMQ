from django.contrib import admin

from .models import (
    Department,
    Process,
    ProcessHistory,
    ProcessDocument,
    Audit,
    NonConformity,
    CorrectiveAction,
    CorrectiveActionHistory,
    Notification,
    Kpi,
    UserProfile,
)


admin.site.register(Department)
admin.site.register(Process)
admin.site.register(ProcessHistory)
admin.site.register(ProcessDocument)
admin.site.register(Audit)
admin.site.register(NonConformity)
admin.site.register(CorrectiveAction)
admin.site.register(CorrectiveActionHistory)
admin.site.register(Notification)
admin.site.register(Kpi)
admin.site.register(UserProfile)
