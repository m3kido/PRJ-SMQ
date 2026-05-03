from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model


User = get_user_model()


class Department(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class Process(models.Model):
    PROCESS_TYPE_CHOICES = [
        ("management", "Management"),
        ("operationnel", "Opérationnel"),
        ("support", "Support"),
    ]

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=32, choices=PROCESS_TYPE_CHOICES)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="owned_processes")
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="processes")
    description = models.TextField(blank=True)
    bpmn_xml = models.TextField(blank=True)
    completeness = models.PositiveSmallIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("name", "department")

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class ProcessDocument(models.Model):
    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="process_documents/")
    version = models.CharField(max_length=32, default="1.0")
    status = models.CharField(max_length=32, default="brouillon")
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Audit(models.Model):
    AUDIT_TYPE_CHOICES = [("interne", "Interne"), ("externe", "Externe")]
    STATUS_CHOICES = [
        ("planifie", "Planifié"),
        ("en_cours", "En cours"),
        ("clos", "Clos"),
    ]

    type = models.CharField(max_length=16, choices=AUDIT_TYPE_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="planifie")
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="audits")
    processes = models.ManyToManyField(Process, related_name="audits")
    team = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="audit_missions")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    report = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_audits")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class NonConformity(models.Model):
    SEVERITY_CHOICES = [("critique", "Critique"), ("majeure", "Majeure"), ("mineure", "Mineure")]
    STATUS_CHOICES = [("ouverte", "Ouverte"), ("en_cours", "En cours"), ("resolue", "Résolue")]

    reference = models.CharField(max_length=64, unique=True)
    process = models.ForeignKey(Process, on_delete=models.PROTECT, related_name="non_conformities")
    audit = models.ForeignKey(Audit, on_delete=models.SET_NULL, null=True, blank=True, related_name="non_conformities")
    criterion = models.ForeignKey(
        "IsoCriterion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="non_conformities",
    )
    severity = models.CharField(max_length=16, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="ouverte")
    description = models.TextField()
    detected_at = models.DateField()
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["process", "criterion"],
                condition=models.Q(criterion__isnull=False),
                name="unique_nonconformity_process_criterion",
            )
        ]


class CorrectiveAction(models.Model):
    process = models.ForeignKey(Process, on_delete=models.PROTECT, related_name="corrective_actions", null=True, blank=True)
    non_conformity = models.ForeignKey(NonConformity, on_delete=models.SET_NULL, related_name="actions", null=True, blank=True)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="assigned_actions")
    due_date = models.DateField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    evidence = models.FileField(upload_to="actions_evidence/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Document(models.Model):
    FILE_STATUS_CHOICES = [
        ("brouillon", "Brouillon"),
        ("revision", "En révision"),
        ("approuve", "Approuvé"),
    ]

    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="documents/")
    version = models.CharField(max_length=32, default="1.0")
    status = models.CharField(max_length=32, choices=FILE_STATUS_CHOICES, default="brouillon")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="documents")
    related_process = models.ForeignKey(Process, on_delete=models.SET_NULL, null=True, blank=True, related_name="related_documents")
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)


class Kpi(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    value = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    related_process = models.ForeignKey(Process, on_delete=models.SET_NULL, null=True, blank=True, related_name="kpis")
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("admin", "Administrateur"),
        ("responsable_qualite", "Responsable qualité"),
        ("gestionnaire", "Gestionnaire de processus"),
        ("auditeur_interne", "Auditeur interne"),
        ("auditeur_externe", "Auditeur externe"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=32, choices=ROLE_CHOICES)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="members")
    avatar_url = models.URLField(blank=True)
    avatar = models.FileField(upload_to="avatars/", blank=True, null=True)

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.user.username} ({self.role})"


class ProcessSheetTemplate(models.Model):
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=64, unique=True)
    description = models.TextField(blank=True)
    structure = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class ManagedProcessSheet(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("submitted", "Submitted"),
        ("validated", "Validated"),
        ("late", "Late"),
    ]

    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name="managed_sheets")
    template = models.ForeignKey(ProcessSheetTemplate, on_delete=models.PROTECT, related_name="process_sheets")
    assigned_manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="assigned_process_sheets")
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_process_sheet_assignments")
    due_date = models.DateField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="draft")
    sheet_data = models.JSONField(default=dict)
    submitted_at = models.DateTimeField(null=True, blank=True)
    validated_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class IsoClause(models.Model):
    reference = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "reference"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.reference} - {self.title}"


class IsoCriterion(models.Model):
    clause = models.ForeignKey(IsoClause, on_delete=models.CASCADE, related_name="criteria")
    code = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    process_types = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["clause__order", "order", "code"]

    def __str__(self) -> str:  # pragma: no cover
        return self.code


class AuditAssignment(models.Model):
    STATUS_CHOICES = [
        ("assigned", "Assigned"),
        ("in_progress", "In progress"),
        ("submitted", "Submitted"),
        ("closed", "Closed"),
        ("late", "Late"),
    ]

    audit = models.ForeignKey(Audit, on_delete=models.CASCADE, related_name="assignments")
    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name="audit_assignments")
    assigned_auditor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="assigned_audits")
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_audit_assignments")
    due_date = models.DateField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="assigned")
    started_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class AuditCriterionAssessment(models.Model):
    assignment = models.ForeignKey(AuditAssignment, on_delete=models.CASCADE, related_name="criterion_assessments")
    criterion = models.ForeignKey(IsoCriterion, on_delete=models.CASCADE, related_name="assessments")
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    conformity_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("assignment", "criterion")


class AuditEvidence(models.Model):
    assessment = models.ForeignKey(AuditCriterionAssessment, on_delete=models.CASCADE, related_name="proofs")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to="audit_proofs/", null=True, blank=True)
    url = models.URLField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="uploaded_audit_proofs")
    created_at = models.DateTimeField(auto_now_add=True)


class DeadlineAlert(models.Model):
    ALERT_TYPE_CHOICES = [
        ("process_sheet", "Process sheet"),
        ("audit_assignment", "Audit assignment"),
    ]

    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="deadline_alerts")
    alert_type = models.CharField(max_length=32, choices=ALERT_TYPE_CHOICES)
    process_sheet = models.ForeignKey(ManagedProcessSheet, on_delete=models.CASCADE, null=True, blank=True, related_name="alerts")
    audit_assignment = models.ForeignKey(AuditAssignment, on_delete=models.CASCADE, null=True, blank=True, related_name="alerts")
    message = models.TextField()
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class EvaluationScale(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:  # pragma: no cover
        return self.name


class EvaluationScaleLevel(models.Model):
    scale = models.ForeignKey(EvaluationScale, on_delete=models.CASCADE, related_name="levels")
    order = models.PositiveIntegerField(default=0)
    truth_label = models.CharField(max_length=255)
    truth_choice = models.CharField(max_length=64)
    truth_rate = models.DecimalField(max_digits=5, decimal_places=2)
    min_average = models.DecimalField(max_digits=5, decimal_places=2)
    max_average = models.DecimalField(max_digits=5, decimal_places=2)
    conformity_level = models.CharField(max_length=64)
    conformity_label = models.TextField()

    class Meta:
        ordering = ["order"]


class AuditComputedResult(models.Model):
    assignment = models.OneToOneField(AuditAssignment, on_delete=models.CASCADE, related_name="computed_result")
    average_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    conformity_level = models.CharField(max_length=64, blank=True)
    conformity_label = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
