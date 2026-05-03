from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from smq import views

router = routers.DefaultRouter()
router.register(r"departments", views.DepartmentViewSet)
router.register(r"processes", views.ProcessViewSet)
router.register(r"process-docs", views.ProcessDocumentViewSet)
router.register(r"audits", views.AuditViewSet)
router.register(r"non-conformities", views.NonConformityViewSet)
router.register(r"actions", views.CorrectiveActionViewSet)
router.register(r"notifications", views.NotificationViewSet)
router.register(r"kpis", views.KpiViewSet)
router.register(r"users", views.UserViewSet)
router.register(r"process-sheet-templates", views.ProcessSheetTemplateViewSet)
router.register(r"managed-process-sheets", views.ManagedProcessSheetViewSet)
router.register(r"iso-clauses", views.IsoClauseViewSet)
router.register(r"iso-criteria", views.IsoCriterionViewSet)
router.register(r"audit-assignments", views.AuditAssignmentViewSet)
router.register(r"audit-criterion-assessments", views.AuditCriterionAssessmentViewSet)
router.register(r"audit-evidence", views.AuditEvidenceViewSet)
router.register(r"deadline-alerts", views.DeadlineAlertViewSet)
router.register(r"evaluation-scales", views.EvaluationScaleViewSet)
router.register(r"evaluation-scale-levels", views.EvaluationScaleLevelViewSet)
router.register(r"audit-computed-results", views.AuditComputedResultViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/me", views.MeView.as_view()),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
