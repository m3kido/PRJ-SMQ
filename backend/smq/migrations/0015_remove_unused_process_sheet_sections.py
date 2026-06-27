from django.db import migrations


REMOVED_SECTIONS = ["deroulement_et_modelisation", "validation"]


def remove_sections(value):
    if not isinstance(value, dict):
        return value
    cleaned = dict(value)
    changed = False
    for section in REMOVED_SECTIONS:
        if section in cleaned:
            cleaned.pop(section, None)
            changed = True
    return cleaned if changed else value


def remove_process_sheet_sections(apps, schema_editor):
    ProcessSheetTemplate = apps.get_model("smq", "ProcessSheetTemplate")
    ManagedProcessSheet = apps.get_model("smq", "ManagedProcessSheet")

    for template in ProcessSheetTemplate.objects.all():
        cleaned = remove_sections(template.structure)
        if cleaned != template.structure:
            template.structure = cleaned
            template.save(update_fields=["structure", "updated_at"])

    for sheet in ManagedProcessSheet.objects.all():
        cleaned = remove_sections(sheet.sheet_data)
        if cleaned != sheet.sheet_data:
            sheet.sheet_data = cleaned
            sheet.save(update_fields=["sheet_data", "updated_at"])


class Migration(migrations.Migration):
    dependencies = [
        ("smq", "0014_processhistory"),
    ]

    operations = [
        migrations.RunPython(remove_process_sheet_sections, migrations.RunPython.noop),
    ]
