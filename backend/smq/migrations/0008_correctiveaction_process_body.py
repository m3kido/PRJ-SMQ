from django.db import migrations, models
import django.db.models.deletion


def copy_action_processes(apps, schema_editor):
    CorrectiveAction = apps.get_model("smq", "CorrectiveAction")
    for action in CorrectiveAction.objects.select_related("non_conformity__process"):
        if action.process_id or not action.non_conformity_id:
            continue
        action.process_id = action.non_conformity.process_id
        action.save(update_fields=["process"])


class Migration(migrations.Migration):
    dependencies = [
        ("smq", "0007_isocriterion_process_types"),
    ]

    operations = [
        migrations.AddField(
            model_name="correctiveaction",
            name="body",
            field=models.TextField(blank=True, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="correctiveaction",
            name="process",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="corrective_actions",
                to="smq.process",
            ),
        ),
        migrations.RunPython(copy_action_processes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="correctiveaction",
            name="non_conformity",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="actions",
                to="smq.nonconformity",
            ),
        ),
    ]
