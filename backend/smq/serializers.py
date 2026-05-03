from rest_framework import serializers

from django.contrib.auth import get_user_model
from django.utils import timezone
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
    UserProfile,
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

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class ProcessDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessDocument
        fields = "__all__"


class ProcessSerializer(serializers.ModelSerializer):
    documents = ProcessDocumentSerializer(many=True, read_only=True)
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Process
        fields = [
            "id",
            "name",
            "type",
            "owner",
            "owner_username",
            "department",
            "department_name",
            "description",
            "completeness",
            "updated_at",
            "created_at",
            "documents",
        ]


class AuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Audit
        fields = "__all__"


class NonConformitySerializer(serializers.ModelSerializer):
    process_name = serializers.CharField(source="process.name", read_only=True)
    criterion_code = serializers.CharField(source="criterion.code", read_only=True)
    criterion_title = serializers.CharField(source="criterion.title", read_only=True)
    audit_reference = serializers.SerializerMethodField()

    def get_audit_reference(self, obj):
        return f"AUD-{obj.audit_id}" if obj.audit_id else ""

    class Meta:
        model = NonConformity
        fields = [
            "id",
            "reference",
            "process",
            "process_name",
            "audit",
            "audit_reference",
            "criterion",
            "criterion_code",
            "criterion_title",
            "severity",
            "status",
            "description",
            "detected_at",
            "updated_at",
            "created_at",
        ]


class CorrectiveActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CorrectiveAction
        fields = "__all__"


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = "__all__"


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"


class KpiSerializer(serializers.ModelSerializer):
    class Meta:
        model = Kpi
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="profile.role", read_only=True)
    avatar_url = serializers.CharField(source="profile.avatar_url", read_only=True)
    avatar = serializers.SerializerMethodField()
    department = serializers.IntegerField(source="profile.department_id", read_only=True)
    department_name = serializers.CharField(source="profile.department.name", read_only=True)

    def get_avatar(self, obj):
        request = self.context.get("request")
        profile = getattr(obj, "profile", None)
        if not profile or not profile.avatar:
            return None
        if request:
            return request.build_absolute_uri(profile.avatar.url)
        return profile.avatar.url

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "department",
            "department_name",
            "avatar_url",
            "avatar",
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = UserProfile
        fields = ["id", "user", "role", "department", "avatar_url", "avatar"]


class UserManagementSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, write_only=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=False, allow_null=True, write_only=True)
    avatar_url = serializers.URLField(required=False, allow_blank=True, write_only=True)
    avatar = serializers.FileField(required=False, allow_null=True, write_only=True)
    profile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "role",
            "department",
            "avatar_url",
            "avatar",
            "profile",
        ]

    def create(self, validated_data):
        role = validated_data.pop("role")
        department = validated_data.pop("department", None)
        avatar_url = validated_data.pop("avatar_url", "")
        avatar = validated_data.pop("avatar", None)
        password = validated_data.pop("password", None) or validated_data["username"]
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        UserProfile.objects.update_or_create(
            user=user,
            defaults={"role": role, "department": department, "avatar_url": avatar_url, "avatar": avatar},
        )
        return user

    def update(self, instance, validated_data):
        role = validated_data.pop("role", None)
        department = validated_data.pop("department", None)
        avatar_url = validated_data.pop("avatar_url", None)
        avatar = validated_data.pop("avatar", None)
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()

        profile, _ = UserProfile.objects.get_or_create(user=instance, defaults={"role": "gestionnaire"})
        if role is not None:
            profile.role = role
        profile.department = department
        if avatar_url is not None:
            profile.avatar_url = avatar_url
        if avatar is not None:
            profile.avatar = avatar
        profile.save()
        return instance


class IsoCriterionSerializer(serializers.ModelSerializer):
    clause_reference = serializers.CharField(source="clause.reference", read_only=True)
    clause_title = serializers.CharField(source="clause.title", read_only=True)

    class Meta:
        model = IsoCriterion
        fields = "__all__"


class IsoClauseSerializer(serializers.ModelSerializer):
    criteria = IsoCriterionSerializer(many=True, read_only=True)

    class Meta:
        model = IsoClause
        fields = "__all__"


class ProcessSheetTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessSheetTemplate
        fields = "__all__"


class ManagedProcessSheetSerializer(serializers.ModelSerializer):
    process_name = serializers.CharField(source="process.name", read_only=True)
    manager_username = serializers.CharField(source="assigned_manager.username", read_only=True)
    process_department_name = serializers.CharField(source="process.department.name", read_only=True)
    process_title = serializers.CharField(write_only=True, required=False, allow_blank=False)
    process_department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), write_only=True, required=False, allow_null=True
    )
    process_type = serializers.ChoiceField(choices=Process.PROCESS_TYPE_CHOICES, write_only=True, required=False)
    template = serializers.PrimaryKeyRelatedField(
        queryset=ProcessSheetTemplate.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = ManagedProcessSheet
        fields = "__all__"
        read_only_fields = ["assigned_by", "submitted_at", "validated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        process_title = validated_data.pop("process_title", None)
        process_department = validated_data.pop("process_department", None)
        process_type = validated_data.pop("process_type", "operationnel")

        if process_title and not validated_data.get("process"):
            assigned_manager = validated_data["assigned_manager"]
            department = process_department or getattr(getattr(assigned_manager, "profile", None), "department", None) or Department.objects.order_by("id").first()
            if department is None:
                raise serializers.ValidationError({"process_title": "Aucun département n'est disponible pour créer ce processus."})
            process, _ = Process.objects.get_or_create(
                name=process_title,
                department=department,
                defaults={
                    "type": process_type,
                    "owner": assigned_manager,
                    "description": "",
                    "completeness": 0,
                },
            )
            validated_data["process"] = process

        template = validated_data.get("template") or ProcessSheetTemplate.objects.order_by("id").first()
        if template is None:
            raise serializers.ValidationError({"template": "Aucun modèle de fiche processus n'est disponible."})

        validated_data["template"] = template
        validated_data["sheet_data"] = validated_data.get("sheet_data") or template.structure
        if request and request.user.is_authenticated:
            validated_data["assigned_by"] = request.user
        return super().create(validated_data)


class AuditAssignmentSerializer(serializers.ModelSerializer):
    process_name = serializers.CharField(source="process.name", read_only=True)
    auditor_username = serializers.CharField(source="assigned_auditor.username", read_only=True)
    process_department_name = serializers.CharField(source="process.department.name", read_only=True)
    audit = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = AuditAssignment
        fields = "__all__"
        read_only_fields = ["audit", "assigned_by", "started_at", "submitted_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        process = validated_data["process"]
        auditor = validated_data["assigned_auditor"]
        auditor_role = getattr(getattr(auditor, "profile", None), "role", "auditeur_interne")
        audit_type = "externe" if auditor_role == "auditeur_externe" else "interne"

        audit = Audit.objects.create(
            type=audit_type,
            status="planifie",
            department=process.department,
            start_date=timezone.localdate(),
            end_date=validated_data["due_date"],
            created_by=request.user if request and request.user.is_authenticated else auditor,
            report="",
        )
        audit.processes.add(process)
        audit.team.add(auditor)

        validated_data["audit"] = audit
        if request and request.user.is_authenticated:
            validated_data["assigned_by"] = request.user
        return super().create(validated_data)


class AuditEvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEvidence
        fields = "__all__"


class AuditCriterionAssessmentSerializer(serializers.ModelSerializer):
    proofs = AuditEvidenceSerializer(many=True, read_only=True)

    class Meta:
        model = AuditCriterionAssessment
        fields = "__all__"


class DeadlineAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeadlineAlert
        fields = "__all__"


class EvaluationScaleLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationScaleLevel
        fields = "__all__"


class EvaluationScaleSerializer(serializers.ModelSerializer):
    levels = EvaluationScaleLevelSerializer(many=True, read_only=True)

    class Meta:
        model = EvaluationScale
        fields = "__all__"


class AuditComputedResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditComputedResult
        fields = "__all__"
