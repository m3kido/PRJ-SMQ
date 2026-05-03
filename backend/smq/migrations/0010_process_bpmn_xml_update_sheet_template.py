from copy import deepcopy

from django.db import migrations, models


PROCESS_SHEET_STRUCTURE = {
    "informations_generales": {
        "pilote_processus": "",
        "designation_processus": "",
        "objectif_processus": "",
        "structures_concernees": [""],
        "type_processus": "",
    },
    "elements_cles": {
        "delai_global": "",
        "cout_estime": "",
        "entrees": [
            {
                "element_declencheur_ou_donnee": "",
                "processus_source": "",
            }
        ],
        "sorties": [
            {
                "livrable_ou_service": "",
                "processus_destinataire": "",
            }
        ],
        "clients": "",
        "effectifs_impliques": "",
        "competences_cles": [""],
        "kpi": [
            {
                "indicateur": "",
                "cible": "",
                "frequence_mesure": "",
            }
        ],
    },
    "contexte_et_environnement": {
        "processus_voisins": {
            "amont": [""],
            "aval": [""],
        },
        "enjeux": [""],
        "moyens_alloues": [""],
        "contraintes": {
            "reglementaires": [""],
            "temporelles": [""],
            "techniques": [""],
        },
        "risques": [""],
    },
    "informations_documentees": {
        "documents_de_reference": [
            {
                "identification_description": "",
                "format_support": "",
                "revue_approbation": "",
            }
        ],
        "enregistrements_preuves": [
            {
                "identification_description": "",
                "format_support": "",
                "revue_approbation": "",
            }
        ],
    },
    "dysfonctionnements_majeurs_connus": {
        "descriptions": [""],
        "consequences": [""],
        "causes": [""],
        "ameliorations": {
            "court_terme": [""],
            "moyen_terme": [""],
            "long_terme": [""],
        },
    },
    "deroulement_et_modelisation": {
        "taches_chronologiques": [
            {
                "etape": "",
                "acteur": "",
                "entrees": "",
                "actions": "",
                "sorties": "",
            }
        ],
        "cartographie": {
            "swimlanes_acteurs": "",
            "evenements_timers": "",
            "passerelles_decision": "",
            "flux_messages": "",
        },
    },
    "validation": {
        "redacteur": "",
        "verificateur": "",
        "approbateur": "",
        "assistant": "",
    },
}


def list_to_kpi(items):
    return [
        {
            "indicateur": str(item),
            "cible": "",
            "frequence_mesure": "",
        }
        for item in items
        if str(item).strip()
    ] or deepcopy(PROCESS_SHEET_STRUCTURE["elements_cles"]["kpi"])


def list_to_table(items, first_key, second_key):
    return [
        {
            first_key: str(item),
            second_key: "",
        }
        for item in items
        if str(item).strip()
    ]


def migrate_old_sheet_data(old_data):
    if not isinstance(old_data, dict):
        return deepcopy(PROCESS_SHEET_STRUCTURE)

    migrated = deepcopy(PROCESS_SHEET_STRUCTURE)
    general = old_data.get("general_information") or {}
    elements = old_data.get("elements_cles") or {}
    context = old_data.get("context") or {}
    documented = old_data.get("documented_information") or {}
    workflow = old_data.get("workflow") or {}

    if isinstance(general, dict):
        migrated["informations_generales"]["pilote_processus"] = general.get("pilote", "")
        migrated["informations_generales"]["designation_processus"] = general.get("designation", "")
        migrated["informations_generales"]["objectif_processus"] = general.get("objectif", "")
        migrated["informations_generales"]["type_processus"] = general.get("type_processus", "")

    if isinstance(elements, dict):
        migrated["elements_cles"]["delai_global"] = elements.get("delai_global", "")
        migrated["elements_cles"]["cout_estime"] = elements.get("cout_estime", "")
        if isinstance(elements.get("kpi"), list):
            migrated["elements_cles"]["kpi"] = list_to_kpi(elements["kpi"])

    if isinstance(context, dict):
        for key in ["enjeux", "risques"]:
            if isinstance(context.get(key), list) and context[key]:
                migrated["contexte_et_environnement"][key] = context[key]

    if isinstance(documented, dict):
        references = documented.get("references")
        records = documented.get("records")
        if isinstance(references, list) and references:
            migrated["informations_documentees"]["documents_de_reference"] = list_to_table(
                references,
                "identification_description",
                "format_support",
            )
        if isinstance(records, list) and records:
            migrated["informations_documentees"]["enregistrements_preuves"] = list_to_table(
                records,
                "identification_description",
                "format_support",
            )

    if isinstance(workflow, dict) and isinstance(workflow.get("steps"), list) and workflow["steps"]:
        migrated["deroulement_et_modelisation"]["taches_chronologiques"] = [
            {
                "etape": str(step),
                "acteur": "",
                "entrees": "",
                "actions": "",
                "sorties": "",
            }
            for step in workflow["steps"]
            if str(step).strip()
        ]

    return migrated


def update_process_sheet_template(apps, schema_editor):
    ProcessSheetTemplate = apps.get_model("smq", "ProcessSheetTemplate")
    ManagedProcessSheet = apps.get_model("smq", "ManagedProcessSheet")

    template, _ = ProcessSheetTemplate.objects.update_or_create(
        code="soutenance-these-esi",
        defaults={
            "name": "Fiche Processus Soutenance de Thèse",
            "description": "Fiche processus structurée pour pilotage, audit et traçabilité ISO 9001.",
            "structure": PROCESS_SHEET_STRUCTURE,
        },
    )

    for sheet in ManagedProcessSheet.objects.filter(template=template):
        sheet.sheet_data = migrate_old_sheet_data(sheet.sheet_data)
        sheet.save(update_fields=["sheet_data"])


class Migration(migrations.Migration):
    dependencies = [
        ("smq", "0009_unique_nonconformity_process_criterion"),
    ]

    operations = [
        migrations.AddField(
            model_name="process",
            name="bpmn_xml",
            field=models.TextField(blank=True),
        ),
        migrations.RunPython(update_process_sheet_template, migrations.RunPython.noop),
    ]
