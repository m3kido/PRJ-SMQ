from django.db import migrations


def make_blank_sheet_data(value):
    if isinstance(value, list):
        return [make_blank_sheet_data(value[0])] if value else []
    if isinstance(value, dict):
        return {key: make_blank_sheet_data(nested) for key, nested in value.items()}
    if isinstance(value, bool):
        return False
    if isinstance(value, (int, float)):
        return 0
    return ""


def looks_like_legacy_prefilled_sheet(sheet_data):
    if not isinstance(sheet_data, dict):
        return False

    general = sheet_data.get("informations_generales")
    elements = sheet_data.get("elements_cles")
    workflow = sheet_data.get("deroulement_et_modelisation")

    if isinstance(general, dict):
        legacy_general_values = [
            general.get("pilote_processus"),
            general.get("designation_processus"),
            general.get("objectif_processus"),
            general.get("type_processus"),
        ]
        if any(str(value or "").strip() for value in legacy_general_values):
            return True

    if isinstance(elements, dict):
        if str(elements.get("delai_global") or "").strip() or str(elements.get("cout_estime") or "").strip():
            return True
        kpis = elements.get("kpi")
        if isinstance(kpis, list) and any(str(item.get("indicateur") or "").strip() for item in kpis if isinstance(item, dict)):
            return True

    if isinstance(workflow, dict):
        steps = workflow.get("taches_chronologiques")
        if isinstance(steps, list) and any(str(item.get("etape") or "").strip() for item in steps if isinstance(item, dict)):
            return True

    return False


def blank_legacy_drafts(apps, schema_editor):
    ManagedProcessSheet = apps.get_model("smq", "ManagedProcessSheet")

    for sheet in ManagedProcessSheet.objects.select_related("template").filter(status="draft", submitted_at__isnull=True):
        if looks_like_legacy_prefilled_sheet(sheet.sheet_data):
            sheet.sheet_data = make_blank_sheet_data(sheet.template.structure)
            sheet.save(update_fields=["sheet_data"])


class Migration(migrations.Migration):
    dependencies = [
        ("smq", "0010_process_bpmn_xml_update_sheet_template"),
    ]

    operations = [
        migrations.RunPython(blank_legacy_drafts, migrations.RunPython.noop),
    ]
