from django.db import migrations, models


PROCESS_TYPE_TAGS = ["operationnel", "support", "management"]

CLAUSE_PROCESS_TYPE_TAGS = {
    "4.1": ["management"],
    "4.2": ["management"],
    "4.3": ["management"],
    "4.4": PROCESS_TYPE_TAGS,
    "5.1": ["management"],
    "5.2": ["management"],
    "5.3": ["management"],
    "6.1": PROCESS_TYPE_TAGS,
    "6.2": PROCESS_TYPE_TAGS,
    "6.3": PROCESS_TYPE_TAGS,
    "7.1": ["support"],
    "7.2": ["support"],
    "7.3": ["support"],
    "7.4": ["support"],
    "7.5": ["support"],
    "8.1": ["operationnel"],
    "8.2": ["operationnel"],
    "8.3": ["operationnel"],
    "8.4": ["operationnel", "support"],
    "8.5": ["operationnel"],
    "8.6": ["operationnel"],
    "8.7": ["operationnel"],
    "9.1": PROCESS_TYPE_TAGS,
    "9.2": ["management", "support"],
    "9.3": ["management"],
    "10.1": PROCESS_TYPE_TAGS,
    "10.2": PROCESS_TYPE_TAGS,
    "10.3": PROCESS_TYPE_TAGS,
}


def tag_existing_criteria(apps, schema_editor):
    IsoCriterion = apps.get_model("smq", "IsoCriterion")
    for criterion in IsoCriterion.objects.select_related("clause"):
        criterion.process_types = list(CLAUSE_PROCESS_TYPE_TAGS.get(criterion.clause.reference, PROCESS_TYPE_TAGS))
        criterion.save(update_fields=["process_types"])


class Migration(migrations.Migration):
    dependencies = [
        ("smq", "0006_nonconformity_criterion"),
    ]

    operations = [
        migrations.AddField(
            model_name="isocriterion",
            name="process_types",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.RunPython(tag_existing_criteria, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="isocriterion",
            name="expected_evidence",
        ),
    ]
