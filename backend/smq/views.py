from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from decimal import Decimal

from .auth import IsAdmin, IsAuditeurInterne, IsAuditeurExterne, IsGestionnaire, ReadOnly

from .models import (
    Department,
    Process,
    ProcessDocument,
    Audit,
    NonConformity,
    CorrectiveAction,
    Document,
    Notification,
    Kpi,
    ProcessSheetTemplate,
    ManagedProcessSheet,
    IsoClause,
    IsoCriterion,
    AuditAssignment,
    AuditCriterionAssessment,
    AuditEvidence,
    DeadlineAlert,
    EvaluationScale,
    EvaluationScaleLevel,
    AuditComputedResult,
)
from .serializers import (
    DepartmentSerializer,
    ProcessSerializer,
    ProcessDocumentSerializer,
    AuditSerializer,
    NonConformitySerializer,
    CorrectiveActionSerializer,
    DocumentSerializer,
    NotificationSerializer,
    KpiSerializer,
    UserProfileSerializer,
    ProcessSheetTemplateSerializer,
    ManagedProcessSheetSerializer,
    IsoClauseSerializer,
    IsoCriterionSerializer,
    AuditAssignmentSerializer,
    AuditCriterionAssessmentSerializer,
    AuditEvidenceSerializer,
    DeadlineAlertSerializer,
    EvaluationScaleSerializer,
    EvaluationScaleLevelSerializer,
    AuditComputedResultSerializer,
    UserSerializer,
    UserManagementSerializer,
)
from django.contrib.auth import get_user_model

User = get_user_model()


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | ReadOnly)]


class ProcessViewSet(viewsets.ModelViewSet):
    queryset = Process.objects.all().select_related("owner", "department")
    serializer_class = ProcessSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsGestionnaire | ReadOnly)]

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, "profile", None)
        if profile and profile.role == "gestionnaire":
            assigned_process_ids = ManagedProcessSheet.objects.filter(
                assigned_manager=self.request.user
            ).values_list("process_id", flat=True)
            return qs.filter(Q(id__in=assigned_process_ids) | Q(owner=self.request.user)).distinct()
        return qs


class ProcessDocumentViewSet(viewsets.ModelViewSet):
    queryset = ProcessDocument.objects.all().select_related("process")
    serializer_class = ProcessDocumentSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsGestionnaire | ReadOnly)]


class AuditViewSet(viewsets.ModelViewSet):
    queryset = Audit.objects.all().select_related("department", "created_by").prefetch_related("processes", "team")
    serializer_class = AuditSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsAuditeurInterne | IsAuditeurExterne | ReadOnly)]


class NonConformityViewSet(viewsets.ModelViewSet):
    queryset = NonConformity.objects.all().select_related("process", "audit")
    serializer_class = NonConformitySerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsAuditeurInterne | ReadOnly)]

    def get_queryset(self):
        qs = super().get_queryset().select_related("process", "audit", "criterion")
        process_id = self.request.query_params.get("process")
        audit_id = self.request.query_params.get("audit")
        status_value = self.request.query_params.get("status")
        if process_id:
            qs = qs.filter(process_id=process_id)
        if audit_id:
            qs = qs.filter(audit_id=audit_id)
        if status_value:
            qs = qs.filter(status=status_value)
        return qs.order_by("-updated_at", "-created_at")


class CorrectiveActionViewSet(viewsets.ModelViewSet):
    queryset = CorrectiveAction.objects.all().select_related("non_conformity", "assignee")
    serializer_class = CorrectiveActionSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsAuditeurInterne | ReadOnly)]


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all().select_related("owner", "related_process")
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsGestionnaire | ReadOnly)]


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().select_related("recipient")
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]


class KpiViewSet(viewsets.ModelViewSet):
    queryset = Kpi.objects.all().select_related("related_process")
    serializer_class = KpiSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | ReadOnly)]


class ProcessSheetTemplateViewSet(viewsets.ModelViewSet):
    queryset = ProcessSheetTemplate.objects.all()
    serializer_class = ProcessSheetTemplateSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | ReadOnly)]


class ManagedProcessSheetViewSet(viewsets.ModelViewSet):
    queryset = ManagedProcessSheet.objects.all().select_related(
        "process", "template", "assigned_manager", "assigned_by"
    )
    serializer_class = ManagedProcessSheetSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsGestionnaire | ReadOnly)]

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, "profile", None)
        process_id = self.request.query_params.get("process")
        if process_id:
            qs = qs.filter(process_id=process_id)
        if profile and profile.role == "gestionnaire":
            qs = qs.filter(assigned_manager=self.request.user)
        return qs.order_by("due_date", "-created_at")

    def perform_update(self, serializer):
        previous_status = self.get_object().status
        sheet = serializer.save()
        updates = []
        if previous_status != "submitted" and sheet.status == "submitted" and not sheet.submitted_at:
            sheet.submitted_at = timezone.now()
            updates.append("submitted_at")
        if previous_status != "validated" and sheet.status == "validated" and not sheet.validated_at:
            sheet.validated_at = timezone.now()
            updates.append("validated_at")
        if updates:
            updates.append("updated_at")
            sheet.save(update_fields=updates)


class IsoClauseViewSet(viewsets.ModelViewSet):
    queryset = IsoClause.objects.all().prefetch_related("criteria")
    serializer_class = IsoClauseSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsAuditeurInterne | ReadOnly)]


class IsoCriterionViewSet(viewsets.ModelViewSet):
    queryset = IsoCriterion.objects.all().select_related("clause")
    serializer_class = IsoCriterionSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsAuditeurInterne | ReadOnly)]


class AuditAssignmentViewSet(viewsets.ModelViewSet):
    queryset = AuditAssignment.objects.all().select_related(
        "audit", "process", "assigned_auditor", "assigned_by"
    )
    serializer_class = AuditAssignmentSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsAuditeurInterne | IsAuditeurExterne | ReadOnly)]

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, "profile", None)
        process_id = self.request.query_params.get("process")
        status_value = self.request.query_params.get("status")
        if process_id:
            qs = qs.filter(process_id=process_id)
        if status_value:
            qs = qs.filter(status=status_value)
        if profile and profile.role in ["auditeur_interne", "auditeur_externe"]:
            qs = qs.filter(assigned_auditor=self.request.user)
        return qs.order_by("due_date", "-created_at")

    def perform_update(self, serializer):
        current = self.get_object()
        previous_status = current.status
        assignment = serializer.save()
        if previous_status != "in_progress" and assignment.status == "in_progress" and not assignment.started_at:
            assignment.started_at = timezone.now()
            assignment.save(update_fields=["started_at", "updated_at"])
        if previous_status != "closed" and assignment.status == "closed":
            assignment.submitted_at = assignment.submitted_at or timezone.now()
            assignment.save(update_fields=["submitted_at", "updated_at"])

            assessments = assignment.criterion_assessments.exclude(conformity_rate__isnull=True)
            average = Decimal("0")
            matched_level = None
            scale = EvaluationScale.objects.prefetch_related("levels").first()

            def match_level(rate_value):
                if not scale:
                    return None
                for level in scale.levels.all():
                    if Decimal(level.min_average) <= rate_value <= Decimal(level.max_average):
                        return level
                return None

            def severity_for_level(level):
                if not level:
                    return "mineure"
                normalized = level.conformity_level.lower()
                if normalized == "insuffisant":
                    return "critique"
                if normalized == "informel":
                    return "majeure"
                return "mineure"

            if assessments.exists():
                total = sum((item.conformity_rate or Decimal("0")) for item in assessments)
                average = total / Decimal(assessments.count())
                matched_level = match_level(average)
                AuditComputedResult.objects.update_or_create(
                    assignment=assignment,
                    defaults={
                        "average_rate": average,
                        "conformity_level": matched_level.conformity_level if matched_level else "",
                        "conformity_label": matched_level.conformity_label if matched_level else "",
                    },
                )
                for item in assessments.select_related("criterion"):
                    criterion_level = match_level(item.conformity_rate or Decimal("0"))
                    nc, created = NonConformity.objects.get_or_create(
                        reference=f"AUTO-NC-P{assignment.process_id}-C{item.criterion_id}",
                        defaults={
                            "process": assignment.process,
                            "audit": assignment.audit,
                            "criterion": item.criterion,
                            "severity": severity_for_level(criterion_level),
                            "status": "ouverte",
                            "description": (
                                f"Critère {item.criterion.code} - {item.criterion.title} non conforme à "
                                f"{item.conformity_rate}% lors de l'audit AUD-{assignment.audit_id}."
                            ),
                            "detected_at": timezone.localdate(),
                        },
                    )
                    nc.process = assignment.process
                    nc.audit = assignment.audit
                    nc.criterion = item.criterion
                    nc.detected_at = timezone.localdate()
                    if criterion_level and criterion_level.conformity_level.lower() == "conforme":
                        if not created:
                            nc.status = "resolue"
                            nc.severity = "mineure"
                            nc.description = (
                                f"Critère {item.criterion.code} - {item.criterion.title} redevenu conforme "
                                f"({item.conformity_rate}%) lors de l'audit AUD-{assignment.audit_id}."
                            )
                            nc.save()
                    else:
                        nc.status = "ouverte"
                        nc.severity = severity_for_level(criterion_level)
                        nc.description = (
                            f"Critère {item.criterion.code} - {item.criterion.title} non conforme à "
                            f"{item.conformity_rate}% lors de l'audit AUD-{assignment.audit_id}."
                        )
                        nc.save()

            assignment.audit.status = "clos"
            assignment.audit.end_date = timezone.localdate()

            related_ncs = NonConformity.objects.filter(
                process=assignment.process,
                audit=assignment.audit,
            ).select_related("criterion").prefetch_related("actions__assignee")
            report_lines = [
                f"Rapport d'audit du {timezone.localdate().isoformat()}",
                f"Processus : {assignment.process.name}",
                f"Auditeur : {assignment.assigned_auditor.username}",
                f"Résultat moyen : {average}%",
                f"Niveau de conformité : {matched_level.conformity_level if matched_level else 'Non déterminé'}",
                f"Synthèse : {matched_level.conformity_label if matched_level else 'Aucun niveau de conformité calculé.'}",
                "",
                "Statistiques :",
                f"- Nombre de critères évalués : {assessments.count()}",
                f"- Critères conformes : {assessments.filter(conformity_rate__gte=Decimal('90')).count()}",
                f"- Non-conformités ouvertes : {related_ncs.exclude(status='resolue').count()}",
                "",
                "Valeurs par critère :",
            ]
            for item in assessments.select_related("criterion"):
                report_lines.append(
                    f"- {item.criterion.code} | {item.criterion.title} | {item.conformity_rate}% | {item.comment or 'Sans commentaire'}"
                )
            report_lines.extend([
                "",
                "Non-conformités et actions correctives :",
            ])
            if related_ncs.exists():
                for nc in related_ncs:
                    report_lines.append(
                        f"- {nc.reference} | {getattr(nc.criterion, 'code', 'Sans critère')} | {nc.severity} | {nc.status} | {nc.description}"
                    )
                    actions = list(nc.actions.all())
                    if actions:
                        for action in actions:
                            report_lines.append(
                                f"  • Action: {action.title} | Responsable: {action.assignee.username} | Échéance: {action.due_date or '-'} | Terminée: {'Oui' if action.completed else 'Non'}"
                            )
                    else:
                        report_lines.append("  • Aucune action corrective associée.")
            else:
                report_lines.append("- Aucune non-conformité liée à cet audit.")

            assignment.audit.report = "\n".join(report_lines)
            assignment.audit.save(update_fields=["status", "end_date", "report", "updated_at"])

            Notification.objects.create(
                recipient=assignment.assigned_by,
                message=(
                    f"L'audit assigné sur le processus '{assignment.process.name}' a été terminé par "
                    f"{assignment.assigned_auditor.username}."
                ),
            )


class AuditCriterionAssessmentViewSet(viewsets.ModelViewSet):
    queryset = AuditCriterionAssessment.objects.all().select_related("assignment", "criterion")
    serializer_class = AuditCriterionAssessmentSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsAuditeurInterne | IsAuditeurExterne | ReadOnly)]

    def get_queryset(self):
        qs = super().get_queryset()
        assignment_id = self.request.query_params.get("assignment")
        latest_for_process = self.request.query_params.get("latest_for_process")
        if assignment_id:
            qs = qs.filter(assignment_id=assignment_id)
        if latest_for_process:
            latest_assignment = (
                AuditAssignment.objects.filter(process_id=latest_for_process, status="closed")
                .order_by("-updated_at")
                .first()
            )
            if latest_assignment:
                qs = qs.filter(assignment=latest_assignment)
            else:
                qs = qs.none()
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        instance, _ = AuditCriterionAssessment.objects.update_or_create(
            assignment=validated["assignment"],
            criterion=validated["criterion"],
            defaults={
                "score": validated.get("score"),
                "conformity_rate": validated.get("conformity_rate"),
                "comment": validated.get("comment", ""),
            },
        )
        return Response(self.get_serializer(instance).data, status=status.HTTP_200_OK)


class AuditEvidenceViewSet(viewsets.ModelViewSet):
    queryset = AuditEvidence.objects.all().select_related("assessment", "created_by")
    serializer_class = AuditEvidenceSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsAuditeurInterne | IsAuditeurExterne | ReadOnly)]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        instance, _ = AuditEvidence.objects.update_or_create(
            assessment=validated["assessment"],
            title=validated.get("title") or "Preuve",
            defaults={
                "description": validated.get("description", ""),
                "file": validated.get("file"),
                "url": validated.get("url", ""),
                "created_by": validated.get("created_by") or request.user,
            },
        )
        return Response(self.get_serializer(instance).data, status=status.HTTP_200_OK)


class DeadlineAlertViewSet(viewsets.ModelViewSet):
    queryset = DeadlineAlert.objects.all().select_related("admin", "process_sheet", "audit_assignment")
    serializer_class = DeadlineAlertSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | ReadOnly)]

    def get_queryset(self):
        qs = super().get_queryset()
        today = timezone.localdate()

        overdue_sheets = ManagedProcessSheet.objects.filter(due_date__lt=today).exclude(status__in=["submitted", "validated"])
        for sheet in overdue_sheets:
            DeadlineAlert.objects.get_or_create(
                admin=sheet.assigned_by,
                alert_type="process_sheet",
                process_sheet=sheet,
                defaults={
                    "message": f"La fiche processus '{sheet.process.name}' assignée à {sheet.assigned_manager.username} a dépassé son échéance du {sheet.due_date}.",
                },
            )

        overdue_audits = AuditAssignment.objects.filter(due_date__lt=today).exclude(status="closed")
        for assignment in overdue_audits:
            DeadlineAlert.objects.get_or_create(
                admin=assignment.assigned_by,
                alert_type="audit_assignment",
                audit_assignment=assignment,
                defaults={
                    "message": f"L'audit du processus '{assignment.process.name}' assigné à {assignment.assigned_auditor.username} a dépassé son échéance du {assignment.due_date}.",
                },
            )

        return qs.select_related("admin", "process_sheet", "audit_assignment").order_by("-created_at")


class EvaluationScaleViewSet(viewsets.ModelViewSet):
    queryset = EvaluationScale.objects.all().prefetch_related("levels")
    serializer_class = EvaluationScaleSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsAuditeurInterne | IsAuditeurExterne | ReadOnly)]


class EvaluationScaleLevelViewSet(viewsets.ModelViewSet):
    queryset = EvaluationScaleLevel.objects.all().select_related("scale")
    serializer_class = EvaluationScaleLevelSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsAuditeurInterne | IsAuditeurExterne | ReadOnly)]

    http_method_names = ["get", "patch", "head", "options"]


class AuditComputedResultViewSet(viewsets.ModelViewSet):
    queryset = AuditComputedResult.objects.all().select_related("assignment")
    serializer_class = AuditComputedResultSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | IsAuditeurInterne | IsAuditeurExterne | ReadOnly)]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related("profile")
    permission_classes = [IsAuthenticated & (IsAdmin | ReadOnly)]

    def get_serializer_class(self):
        if self.request.method in ["POST", "PUT", "PATCH"]:
            return UserManagementSerializer
        return UserSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)
        data = {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "role": getattr(profile, "role", None),
            "department": profile.department.id if profile and profile.department else None,
            "department_name": profile.department.name if profile and profile.department else None,
            "avatar_url": getattr(profile, "avatar_url", "") if profile else "",
            "avatar": request.build_absolute_uri(profile.avatar.url) if profile and profile.avatar else None,
        }
        return Response(data)
