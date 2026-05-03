from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("smq", "0005_evaluationscale_auditcomputedresult_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="nonconformity",
            name="criterion",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name="non_conformities",
                to="smq.isocriterion",
            ),
        ),
    ]
