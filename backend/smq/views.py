from rest_framework import viewsets, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from decimal import Decimal

from .auth import (
    AdminDeleteOnly,
    IsAdmin,
    IsAdminOrResponsableQualite,
    IsAuditeurInterne,
    IsAuditeurExterne,
    IsGestionnaire,
    ReadOnly,
)

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


PROCESS_TYPE_LABELS = {
    "management": "Management",
    "operationnel": "Opérationnel",
    "support": "Support",
}


def compact_value(value):
    if value in [None, ""]:
        return "vide"
    if isinstance(value, list):
        return f"{len(value)} élément(s)"
    if isinstance(value, dict):
        return f"{len(value)} champ(s)"
    text = str(value).replace("\n", " ").strip()
    return text[:72] + "..." if len(text) > 72 else text


SHEET_HISTORY_LABELS = {
    "informations_generales": "Informations générales",
    "pilote_processus": "Pilote du processus",
    "designation_processus": "Désignation du processus",
    "objectif_processus": "Objectif du processus",
    "structures_concernees": "Structures concernées",
    "type_processus": "Type de processus",
    "elements_cles": "Éléments clés",
    "delai_global": "Délai global",
    "cout_estime": "Coût estimé",
    "entrees": "Entrées",
    "element_declencheur_ou_donnee": "Élément déclencheur ou donnée",
    "processus_source": "Processus source",
    "sorties": "Sorties",
    "livrable_ou_service": "Livrable ou service",
    "processus_destinataire": "Processus destinataire",
    "clients": "Clients",
    "effectifs_impliques": "Effectifs impliqués",
    "competences_cles": "Compétences clés",
    "kpi": "KPI",
    "indicateur": "Indicateur",
    "cible": "Cible",
    "frequence_mesure": "Fréquence de mesure",
    "contexte_et_environnement": "Contexte et environnement",
    "processus_voisins": "Processus voisins",
    "amont": "Amont",
    "aval": "Aval",
    "enjeux": "Enjeux",
    "moyens_alloues": "Moyens alloués",
    "contraintes": "Contraintes",
    "reglementaires": "Réglementaires",
    "temporelles": "Temporelles",
    "techniques": "Techniques",
    "risques": "Risques",
    "informations_documentees": "Informations documentées",
    "documents_de_reference": "Documents de référence",
    "enregistrements_preuves": "Enregistrements / preuves",
    "identification_description": "Identification et description",
    "format_support": "Format et support",
    "revue_approbation": "Revue et approbation",
    "dysfonctionnements_majeurs_connus": "Dysfonctionnements majeurs connus",
    "descriptions": "Descriptions",
    "consequences": "Conséquences",
    "causes": "Causes",
    "ameliorations": "Améliorations",
    "court_terme": "Court terme",
    "moyen_terme": "Moyen terme",
    "long_terme": "Long terme",
}


def labelize_key(value):
    labels = {
        "bpmn_xml": "Cartographie BPMN",
        "name": "Nom",
        "type": "Type",
        "owner": "Responsable",
        "department": "Département",
        "description": "Description",
        "completeness": "Complétude",
        "status": "Statut de fiche",
        "due_date": "Échéance",
        "sheet_data": "Fiche processus",
    }
    return labels.get(value) or SHEET_HISTORY_LABELS.get(value) or value.replace("_", " ").capitalize()


def flatten_sheet_data(value, path=None):
    path = path or []
    if isinstance(value, dict):
        items = []
        for key, nested in value.items():
            items.extend(flatten_sheet_data(nested, [*path, labelize_key(key)]))
        return items
    if isinstance(value, list):
        if not value:
            return [(" / ".join(path), "")]
        items = []
        for index, nested in enumerate(value, start=1):
            items.extend(flatten_sheet_data(nested, [*path, f"Élément {index}"]))
        return items
    return [(" / ".join(path), value)]


def summarize_sheet_changes(before, after):
    before_map = dict(flatten_sheet_data(before or {}))
    after_map = dict(flatten_sheet_data(after or {}))
    changes = []
    for path in sorted(set(before_map) | set(after_map)):
        before_value = compact_value(before_map.get(path))
        after_value = compact_value(after_map.get(path))
        if before_value == after_value:
            continue
        changes.append((path, before_value, after_value))

    if not changes:
        return ""

    snippets = [
        f"{path}: {before_value} → {after_value}"
        for path, before_value, after_value in changes
    ]
    return f"{len(changes)} champ(s): " + "; ".join(snippets)


def build_auto_nonconformity_reference(process_id, criterion_id):
    base_reference = f"AUTO-NC-P{process_id}-C{criterion_id}"
    if not NonConformity.objects.filter(reference=base_reference).exists():
        return base_reference

    suffix = 2
    while NonConformity.objects.filter(reference=f"{base_reference}-{suffix}").exists():
        suffix += 1
    return f"{base_reference}-{suffix}"


def log_corrective_action(action, actor, event_type, message):
    CorrectiveActionHistory.objects.create(
        action=action,
        actor=actor if actor and actor.is_authenticated else None,
        event_type=event_type,
        message=message,
    )


def log_process_history(process, actor, event_type, message):
    if not process or not message:
        return
    ProcessHistory.objects.create(
        process=process,
        actor=actor if actor and actor.is_authenticated else None,
        event_type=event_type,
        message=message,
    )


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by("name")
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated & (IsAdmin | ReadOnly), AdminDeleteOnly]


class ProcessViewSet(viewsets.ModelViewSet):
    queryset = Process.objects.all().select_related("owner", "department").prefetch_related("history__actor")
    serializer_class = ProcessSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsGestionnaire | ReadOnly), AdminDeleteOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, "profile", None)
        if profile and profile.role == "gestionnaire":
            assigned_process_ids = ManagedProcessSheet.objects.filter(
                assigned_manager=self.request.user
            ).values_list("process_id", flat=True)
            return qs.filter(Q(id__in=assigned_process_ids) | Q(owner=self.request.user)).distinct()
        return qs

    def perform_create(self, serializer):
        process = serializer.save()
        log_process_history(
            process,
            self.request.user,
            "created",
            f"Processus créé: {process.name} ({PROCESS_TYPE_LABELS.get(process.type, process.type)}), responsable {process.owner.username}.",
        )

    def perform_update(self, serializer):
        current = self.get_object()
        before = {
            "name": current.name,
            "type": current.type,
            "owner_id": current.owner_id,
            "owner_username": current.owner.username,
            "department_id": current.department_id,
            "department_name": current.department.name,
            "description": current.description,
            "bpmn_xml": current.bpmn_xml,
            "completeness": current.completeness,
        }
        process = serializer.save()
        changes = []
        event_type = "updated"

        if before["name"] != process.name:
            changes.append(f"Nom: {compact_value(before['name'])} → {compact_value(process.name)}")
        if before["type"] != process.type:
            changes.append(
                f"Type: {PROCESS_TYPE_LABELS.get(before['type'], before['type'])} → {PROCESS_TYPE_LABELS.get(process.type, process.type)}"
            )
        if before["owner_id"] != process.owner_id:
            changes.append(f"Responsable: {before['owner_username']} → {process.owner.username}")
        if before["department_id"] != process.department_id:
            changes.append(f"Département: {before['department_name']} → {process.department.name}")
        if before["description"] != process.description:
            changes.append(f"Description: {compact_value(before['description'])} → {compact_value(process.description)}")
        if before["completeness"] != process.completeness:
            changes.append(f"Complétude: {before['completeness']}% → {process.completeness}%")
        if before["bpmn_xml"] != process.bpmn_xml:
            event_type = "bpmn_updated"
            changes.append("Cartographie BPMN mise à jour")

        if changes:
            log_process_history(process, self.request.user, event_type, "; ".join(changes))


class ProcessDocumentViewSet(viewsets.ModelViewSet):
    queryset = ProcessDocument.objects.all().select_related("process")
    serializer_class = ProcessDocumentSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsGestionnaire | ReadOnly), AdminDeleteOnly]


class AuditViewSet(viewsets.ModelViewSet):
    queryset = Audit.objects.all().select_related("department", "created_by").prefetch_related("processes", "team")
    serializer_class = AuditSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsAuditeurInterne | IsAuditeurExterne | ReadOnly), AdminDeleteOnly]


class NonConformityViewSet(viewsets.ModelViewSet):
    queryset = NonConformity.objects.all().select_related("process", "audit")
    serializer_class = NonConformitySerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsAuditeurInterne | ReadOnly), AdminDeleteOnly]

    def get_queryset(self):
        qs = super().get_queryset().select_related("process", "audit", "criterion")
        process_id = self.request.query_params.get("process")
        audit_id = self.request.query_params.get("audit")
        status_value = self.request.query_params.get("status")
        active_only = self.request.query_params.get("active")
        if process_id:
            qs = qs.filter(process_id=process_id)
        if audit_id:
            qs = qs.filter(audit_id=audit_id)
        if status_value:
            qs = qs.filter(status=status_value)
        if active_only == "true":
            qs = qs.exclude(status="resolue")
        return qs.order_by("-updated_at", "-created_at")


class CorrectiveActionViewSet(viewsets.ModelViewSet):
    queryset = CorrectiveAction.objects.all().select_related(
        "process", "process__owner", "non_conformity", "assignee"
    ).prefetch_related("history__actor")
    serializer_class = CorrectiveActionSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsAuditeurInterne | IsGestionnaire | ReadOnly), AdminDeleteOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, "profile", None)
        if profile and profile.role == "gestionnaire":
            qs = qs.filter(process__owner=self.request.user)
        return qs.order_by("-updated_at", "-created_at")

    def create(self, request, *args, **kwargs):
        profile = getattr(request.user, "profile", None)
        if profile and profile.role == "gestionnaire":
            raise PermissionDenied("Le gestionnaire peut clôturer ses actions correctives, pas en créer.")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        profile = getattr(request.user, "profile", None)
        if profile and profile.role == "gestionnaire":
            allowed_fields = {"completed"}
            requested_fields = set(request.data.keys())
            completed_value = request.data.get("completed")
            closes_action = completed_value in [True, "true", "True", "1", 1]
            if requested_fields - allowed_fields or not closes_action:
                raise PermissionDenied("Le gestionnaire peut uniquement clôturer ses actions correctives.")
        return super().update(request, *args, **kwargs)

    def perform_create(self, serializer):
        action = serializer.save()
        assignee = action.assignee.username if action.assignee_id else "responsable du processus"
        process = action.process.name if action.process_id else "processus non défini"
        log_corrective_action(
            action,
            self.request.user,
            "created",
            f"Action créée pour {process} et assignée à {assignee}.",
        )

    def perform_update(self, serializer):
        current = self.get_object()
        before = {
            "title": current.title,
            "body": current.body,
            "process_id": current.process_id,
            "process_name": current.process.name if current.process_id else "",
            "assignee_id": current.assignee_id,
            "assignee_username": current.assignee.username if current.assignee_id else "",
            "completed": current.completed,
            "evidence": current.evidence.name if current.evidence else "",
        }
        action = serializer.save()
        changes = []

        if before["title"] != action.title:
            changes.append(f"Titre modifié : « {before['title']} » → « {action.title} »")
        if before["body"] != action.body:
            changes.append("Description mise à jour")
        if before["process_id"] != action.process_id:
            process_name = action.process.name if action.process_id else "processus non défini"
            changes.append(f"Processus modifié : {before['process_name'] or '-'} → {process_name}")
        if before["assignee_id"] != action.assignee_id:
            assignee = action.assignee.username if action.assignee_id else "responsable non défini"
            changes.append(f"Responsable modifié : {before['assignee_username'] or '-'} → {assignee}")
        if before["completed"] != action.completed:
            changes.append("Action clôturée" if action.completed else "Action rouverte")
        if before["evidence"] != (action.evidence.name if action.evidence else ""):
            changes.append("Preuve mise à jour")

        if changes:
            event_type = "updated"
            if before["completed"] is False and action.completed is True:
                event_type = "completed"
            elif before["completed"] is True and action.completed is False:
                event_type = "reopened"
            log_corrective_action(action, self.request.user, event_type, "; ".join(changes))


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().select_related("recipient")
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, AdminDeleteOnly]


class KpiViewSet(viewsets.ModelViewSet):
    queryset = Kpi.objects.all().select_related("related_process")
    serializer_class = KpiSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | ReadOnly), AdminDeleteOnly]


class ProcessSheetTemplateViewSet(viewsets.ModelViewSet):
    queryset = ProcessSheetTemplate.objects.all()
    serializer_class = ProcessSheetTemplateSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | ReadOnly), AdminDeleteOnly]


class ManagedProcessSheetViewSet(viewsets.ModelViewSet):
    queryset = ManagedProcessSheet.objects.all().select_related(
        "process", "template", "assigned_manager", "assigned_by"
    )
    serializer_class = ManagedProcessSheetSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsGestionnaire | ReadOnly), AdminDeleteOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, "profile", None)
        process_id = self.request.query_params.get("process")
        if process_id:
            qs = qs.filter(process_id=process_id)
        if profile and profile.role == "gestionnaire":
            qs = qs.filter(assigned_manager=self.request.user)
        return qs.order_by("due_date", "-created_at")

    def perform_create(self, serializer):
        sheet = serializer.save()
        log_process_history(
            sheet.process,
            self.request.user,
            "created",
            (
                f"Fiche processus assignée à {sheet.assigned_manager.username} "
                f"avec échéance {sheet.due_date}."
            ),
        )

    def perform_update(self, serializer):
        current = self.get_object()
        before = {
            "status": current.status,
            "due_date": current.due_date,
            "manager_id": current.assigned_manager_id,
            "manager_username": current.assigned_manager.username,
            "sheet_data": current.sheet_data,
        }
        sheet = serializer.save()
        updates = []
        if before["status"] != "submitted" and sheet.status == "submitted" and not sheet.submitted_at:
            sheet.submitted_at = timezone.now()
            updates.append("submitted_at")
        if before["status"] != "validated" and sheet.status == "validated" and not sheet.validated_at:
            sheet.validated_at = timezone.now()
            updates.append("validated_at")
        if updates:
            updates.append("updated_at")
            sheet.save(update_fields=updates)

        changes = []
        event_type = "sheet_updated"
        if before["status"] != sheet.status:
            event_type = "status_changed"
            changes.append(f"Statut de fiche: {before['status']} → {sheet.status}")
        if before["due_date"] != sheet.due_date:
            changes.append(f"Échéance: {before['due_date'] or '-'} → {sheet.due_date or '-'}")
        if before["manager_id"] != sheet.assigned_manager_id:
            changes.append(f"Gestionnaire: {before['manager_username']} → {sheet.assigned_manager.username}")
        sheet_change_summary = summarize_sheet_changes(before["sheet_data"], sheet.sheet_data)
        if sheet_change_summary:
            changes.append(f"Champs modifiés: {sheet_change_summary}")

        if changes:
            log_process_history(sheet.process, self.request.user, event_type, "; ".join(changes))


class IsoClauseViewSet(viewsets.ModelViewSet):
    queryset = IsoClause.objects.all().prefetch_related("criteria")
    serializer_class = IsoClauseSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsAuditeurInterne | ReadOnly), AdminDeleteOnly]


class IsoCriterionViewSet(viewsets.ModelViewSet):
    queryset = IsoCriterion.objects.all().select_related("clause")
    serializer_class = IsoCriterionSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsAuditeurInterne | ReadOnly), AdminDeleteOnly]


class AuditAssignmentViewSet(viewsets.ModelViewSet):
    queryset = AuditAssignment.objects.all().select_related(
        "audit", "process", "assigned_auditor", "assigned_by"
    )
    serializer_class = AuditAssignmentSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsAuditeurInterne | IsAuditeurExterne | ReadOnly), AdminDeleteOnly]

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
            conforming_count = 0
            scale = EvaluationScale.objects.prefetch_related("levels").first()

            def match_level(rate_value):
                if not scale:
                    return None
                for level in scale.levels.all():
                    if Decimal(level.min_average) <= rate_value <= Decimal(level.max_average):
                        return level
                return None

            def is_conforming_level(level, rate_value):
                if level:
                    return level.conformity_level.lower() == "conforme"
                return not scale and rate_value >= Decimal("90")

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
                weighted_total = Decimal("0")
                total_weight = Decimal("0")
                for item in assessments.select_related("criterion"):
                    weight = item.criterion.weight or Decimal("1")
                    rate = item.conformity_rate or Decimal("0")
                    weighted_total += rate * weight
                    total_weight += weight
                average = (weighted_total / total_weight).quantize(Decimal("0.01")) if total_weight else Decimal("0")
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
                    rate_value = item.conformity_rate or Decimal("0")
                    criterion_level = match_level(rate_value)
                    is_conforming = is_conforming_level(criterion_level, rate_value)
                    if is_conforming:
                        conforming_count += 1
                    nc = NonConformity.objects.filter(
                        process=assignment.process,
                        criterion=item.criterion,
                    ).order_by("-updated_at", "-created_at").first()

                    if is_conforming:
                        if nc:
                            nc.audit = assignment.audit
                            nc.status = "resolue"
                            nc.severity = "mineure"
                            nc.description = (
                                f"Critère {item.criterion.code} - {item.criterion.title} redevenu conforme "
                                f"({item.conformity_rate}%) lors de l'audit AUD-{assignment.audit_id}."
                            )
                            nc.detected_at = timezone.localdate()
                            nc.save(update_fields=["audit", "status", "severity", "description", "detected_at", "updated_at"])
                        continue

                    description = (
                        f"Critère {item.criterion.code} - {item.criterion.title} non conforme à "
                        f"{item.conformity_rate}% lors de l'audit AUD-{assignment.audit_id}."
                    )
                    if nc is None:
                        nc = NonConformity.objects.create(
                            reference=build_auto_nonconformity_reference(assignment.process_id, item.criterion_id),
                            process=assignment.process,
                            audit=assignment.audit,
                            criterion=item.criterion,
                            severity=severity_for_level(criterion_level),
                            status="ouverte",
                            description=description,
                            detected_at=timezone.localdate(),
                        )
                    else:
                        nc.audit = assignment.audit
                        nc.status = "ouverte"
                        nc.severity = severity_for_level(criterion_level)
                        nc.description = description
                        nc.detected_at = timezone.localdate()
                        nc.save(update_fields=["audit", "status", "severity", "description", "detected_at", "updated_at"])

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
                f"Résultat moyen pondéré : {average}%",
                f"Niveau de conformité : {matched_level.conformity_level if matched_level else 'Non déterminé'}",
                f"Synthèse : {matched_level.conformity_label if matched_level else 'Aucun niveau de conformité calculé.'}",
                "",
                "Statistiques :",
                f"- Nombre de critères évalués : {assessments.count()}",
                f"- Critères conformes : {conforming_count}",
                f"- Non-conformités ouvertes : {related_ncs.exclude(status='resolue').count()}",
                "",
                "Valeurs par critère :",
            ]
            for item in assessments.select_related("criterion"):
                report_lines.append(
                    f"- {item.criterion.code} | {item.criterion.title} | Poids {item.criterion.weight} | {item.conformity_rate}% | {item.comment or 'Sans commentaire'}"
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
                                f"  • Action: {action.title} | Responsable: {action.assignee.username} | Terminée: {'Oui' if action.completed else 'Non'}"
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
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsAuditeurInterne | IsAuditeurExterne | ReadOnly), AdminDeleteOnly]

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
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsAuditeurInterne | IsAuditeurExterne | ReadOnly), AdminDeleteOnly]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        defaults = {
            "description": validated.get("description", ""),
            "url": validated.get("url", ""),
            "created_by": request.user,
        }
        if validated.get("file"):
            defaults["file"] = validated["file"]
        instance, _ = AuditEvidence.objects.update_or_create(
            assessment=validated["assessment"],
            title=validated.get("title") or "Preuve",
            defaults=defaults,
        )
        return Response(self.get_serializer(instance).data, status=status.HTTP_200_OK)


class DeadlineAlertViewSet(viewsets.ModelViewSet):
    queryset = DeadlineAlert.objects.all().select_related("admin", "process_sheet", "audit_assignment")
    serializer_class = DeadlineAlertSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | ReadOnly), AdminDeleteOnly]

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
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsAuditeurInterne | IsAuditeurExterne | ReadOnly), AdminDeleteOnly]


class EvaluationScaleLevelViewSet(viewsets.ModelViewSet):
    queryset = EvaluationScaleLevel.objects.all().select_related("scale")
    serializer_class = EvaluationScaleLevelSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsAuditeurInterne | IsAuditeurExterne | ReadOnly), AdminDeleteOnly]

    http_method_names = ["get", "patch", "head", "options"]


class AuditComputedResultViewSet(viewsets.ModelViewSet):
    queryset = AuditComputedResult.objects.all().select_related("assignment")
    serializer_class = AuditComputedResultSerializer
    permission_classes = [IsAuthenticated & (IsAdminOrResponsableQualite | IsAuditeurInterne | IsAuditeurExterne | ReadOnly), AdminDeleteOnly]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related("profile", "profile__department").order_by("username")
    permission_classes = [IsAuthenticated & (IsAdmin | ReadOnly), AdminDeleteOnly]

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
