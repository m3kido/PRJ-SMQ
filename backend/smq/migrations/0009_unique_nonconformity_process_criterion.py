from django.db import migrations, models
from django.db.models import Count


def merge_duplicate_nonconformities(apps, schema_editor):
    NonConformity = apps.get_model("smq", "NonConformity")
    CorrectiveAction = apps.get_model("smq", "CorrectiveAction")

    duplicate_groups = (
        NonConformity.objects.exclude(criterion__isnull=True)
        .values("process_id", "criterion_id")
        .annotate(total=Count("id"))
        .filter(total__gt=1)
    )

    for group in duplicate_groups:
        items = list(
            NonConformity.objects.filter(
                process_id=group["process_id"],
                criterion_id=group["criterion_id"],
            ).order_by("-updated_at", "-created_at", "-id")
        )
        keeper = items[0]
        for duplicate in items[1:]:
            CorrectiveAction.objects.filter(non_conformity=duplicate).update(non_conformity=keeper)
            duplicate.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("smq", "0008_correctiveaction_process_body"),
    ]

    operations = [
        migrations.RunPython(merge_duplicate_nonconformities, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="nonconformity",
            constraint=models.UniqueConstraint(
                condition=models.Q(criterion__isnull=False),
                fields=("process", "criterion"),
                name="unique_nonconformity_process_criterion",
            ),
        ),
    ]
