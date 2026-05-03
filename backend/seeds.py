"""Seed script for basic roles and demo data."""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.contrib.auth import get_user_model  # noqa: E402
from smq.iso9001_catalog import ISO_9001_CRITERIA_CATALOG  # noqa: E402
from smq.models import (  # noqa: E402
    Department,
    UserProfile,
    Process,
    Audit,
    ProcessSheetTemplate,
    ManagedProcessSheet,
    IsoClause,
    IsoCriterion,
    AuditAssignment,
    EvaluationScale,
    EvaluationScaleLevel,
)


def main():
    User = get_user_model()

    # Departments
    dep_names = ["Qualité", "Production", "Ressources Humaines", "IT"]
    departments = {}
    for name in dep_names:
        dept, _ = Department.objects.get_or_create(name=name)
        departments[name] = dept

    # Users
    users_def = [
        ("admin", "admin@example.com", "admin", "admin", "Qualité", "admin"),
        ("gestionnaire", "gestionnaire@example.com", "gestionnaire", "gestionnaire", "Production", "gestionnaire"),
        ("auditeur_interne", "ai@example.com", "auditeur_interne", "auditeur_interne", "Qualité", "auditeur_interne"),
        ("auditeur_externe", "ae@example.com", "auditeur_externe", "auditeur_externe", None, "auditeur_externe"),
    ]

    for username, email, password, first_name, dep_name, role in users_def:
        user, created = User.objects.get_or_create(username=username, defaults={"email": email, "first_name": first_name})
        if created:
            user.set_password(password)
            user.save()
        dept = departments.get(dep_name) if dep_name else None
        UserProfile.objects.get_or_create(user=user, defaults={"role": role, "department": dept})

    admin = User.objects.get(username="admin")
    gestionnaire = User.objects.get(username="gestionnaire")
    auditeur = User.objects.get(username="auditeur_interne")
    dpgr, _ = Department.objects.get_or_create(name="DPGR", defaults={"description": "Post-graduation et recherche"})

    process, _ = Process.objects.get_or_create(
        name="Soutenance de Thèse",
        department=dpgr,
        defaults={
            "type": "operationnel",
            "owner": gestionnaire,
            "description": "Processus de soutenance de thèse à l'ESI",
            "completeness": 0,
        },
    )

    template_defaults = {
        "description": "Fiche processus détaillée pour la soutenance de thèse",
        "structure": {
            "general_information": {
                "pilote": "DPGR",
                "designation": "Processus de Soutenance de Thèse – ESI",
                "objectif": "Organiser et encadrer la soutenance de thèse de la soumission au dossier jusqu'à l'archivage final.",
                "type_processus": "Réalisation",
            },
            "elements_cles": {
                "delai_global": "4 à 8 mois",
                "cout_estime": "Aucun coût direct pour le doctorant",
                "kpi": [
                    "Taux de conformité des dossiers au 1er dépôt",
                    "Respect délai évaluation experts (45j)",
                    "Respect délai rapports jury (45j)",
                    "Délai moyen global dépôt → soutenance",
                ],
            },
            "context": {
                "enjeux": [
                    "Qualité scientifique",
                    "Conformité réglementaire",
                    "Traçabilité ISO 9001",
                ],
                "risques": [
                    "Délai dépassé 45j experts/jury",
                    "Dossier incomplet au dépôt",
                    "Plagiat détecté",
                ],
            },
            "documented_information": {
                "references": [
                    "Arrêtés ministériels 2022",
                    "Grille de recevabilité 180 points",
                    "Guide doctorant procédure soutenance",
                ],
                "records": [
                    "Dossier complet doctorant",
                    "PV CFD",
                    "PV Conseil Scientifique",
                    "Rapports experts",
                ],
            },
            "workflow": {
                "steps": [
                    "Préparation du dossier de soutenance",
                    "Évaluation par le CFD",
                    "Décision du Conseil Scientifique",
                    "Expertise externe",
                    "Constitution du jury",
                    "Transmission des documents au jury",
                    "Réception des réserves et décision finale",
                    "Soutenance",
                    "Levée des réserves et dépôt final",
                    "Clôture et archivage",
                ]
            },
        },
    }
    template, _ = ProcessSheetTemplate.objects.get_or_create(
        code="soutenance-these-esi",
        defaults={"name": "Fiche Processus Soutenance de Thèse", **template_defaults},
    )

    ManagedProcessSheet.objects.get_or_create(
        process=process,
        template=template,
        assigned_manager=gestionnaire,
        assigned_by=admin,
        due_date="2026-05-30",
        defaults={
            "status": "draft",
            "sheet_data": template.structure,
        },
    )

    scale, _ = EvaluationScale.objects.get_or_create(
        name="Échelle ISO 9001 par défaut",
        defaults={
            "description": "Échelle par défaut de véracité et de conformité utilisée pour le calcul automatique des résultats d'audit.",
        },
    )
    default_levels = [
        {
            "order": 1,
            "truth_label": "Niveau 1 : L'action n'est pas réalisée ou alors de manière très aléatoire.",
            "truth_choice": "Faux",
            "truth_rate": 0,
            "min_average": 0,
            "max_average": 9,
            "conformity_level": "Insuffisant",
            "conformity_label": "Conformité de niveau 1 : Il est nécessaire de formaliser les activités",
        },
        {
            "order": 2,
            "truth_label": "Niveau 2 : L'action est réalisée quelques fois de manière informelle.",
            "truth_choice": "Plutôt Faux",
            "truth_rate": 30,
            "min_average": 10,
            "max_average": 49,
            "conformity_level": "Informel",
            "conformity_label": "Conformité de niveau 2 : Il est nécessaire de pérenniser la bonne exécution des activités",
        },
        {
            "order": 3,
            "truth_label": "Niveau 3 : L'action est formalisée et réalisée de manière assez convaincante.",
            "truth_choice": "Plutôt Vrai",
            "truth_rate": 70,
            "min_average": 50,
            "max_average": 89,
            "conformity_level": "Convaincant",
            "conformity_label": "Conformité de niveau 3 : Il est nécessaire de tracer et d'améliorer les activités",
        },
        {
            "order": 4,
            "truth_label": "Niveau 4 : L'action formalisée est réalisée, améliorée et tracée.",
            "truth_choice": "Vrai",
            "truth_rate": 100,
            "min_average": 90,
            "max_average": 100,
            "conformity_level": "Conforme",
            "conformity_label": "Conformité de niveau 4 : BRAVO ! Maintenez et communiquez vos résultats",
        },
    ]
    for level_data in default_levels:
        EvaluationScaleLevel.objects.update_or_create(
            scale=scale,
            order=level_data["order"],
            defaults=level_data,
        )

    clause_lookup = {}
    section_order = 1
    for article_index, article in enumerate(ISO_9001_CRITERIA_CATALOG, start=1):
        for section in article["sections"]:
            clause, _ = IsoClause.objects.get_or_create(
                reference=section["reference"],
                defaults={
                    "title": section["title"],
                    "description": article["article_title"],
                    "order": section_order,
                },
            )
            clause_lookup[section["reference"]] = clause
            for criterion_order, criterion in enumerate(section["criteria"], start=1):
                IsoCriterion.objects.get_or_create(
                    code=criterion["code"],
                    defaults={
                        "clause": clause,
                        "title": criterion["title"],
                        "description": article["article"],
                        "expected_evidence": "Choix de véracité, preuve et commentaire à renseigner lors de l'audit.",
                        "order": criterion_order,
                    },
                )
            section_order += 1

    audit, _ = Audit.objects.get_or_create(
        type="interne",
        department=dpgr,
        created_by=admin,
        defaults={
            "status": "planifie",
            "start_date": "2026-05-15",
            "end_date": "2026-05-25",
            "report": "",
        },
    )
    audit.processes.add(process)
    audit.team.add(auditeur)

    AuditAssignment.objects.get_or_create(
        audit=audit,
        process=process,
        assigned_auditor=auditeur,
        assigned_by=admin,
        due_date="2026-05-25",
        defaults={"status": "assigned"},
    )

    print("Seed data created/updated.")


if __name__ == "__main__":
    main()
