ISO_9001_EVALUATION_LABELS = [
    {"code": "insuffisant", "label": "Conformité de niveau 1 : Il est nécessaire de formaliser les activités", "rate": 0},
    {"code": "partiel", "label": "Conformité partielle : la pratique existe mais reste incomplète", "rate": 50},
    {"code": "satisfaisant", "label": "Conformité satisfaisante : la pratique est définie et appliquée", "rate": 75},
    {"code": "maitrise", "label": "Conformité maîtrisée : la pratique est pilotée et améliorée", "rate": 100},
]


ISO_9001_CRITERIA_CATALOG = [
    {
        "article": "Art. 4",
        "article_title": "Contexte de l'organisme",
        "sections": [
            {
                "reference": "4.1",
                "title": "Compréhension du contexte et des enjeux",
                "criteria": [
                    {"code": "cr1", "title": "Les enjeux internes et externes sont identifiés relativement à votre organisme et à vos activités"},
                    {"code": "cr2", "title": "Vous surveillez et revoyez les informations relatives à vos enjeux externes et internes"},
                    {"code": "cr3", "title": "Votre SMQ est lié aux évolutions de vos enjeux externes et internes"},
                ],
            },
            {
                "reference": "4.2",
                "title": "Besoins et attentes des parties intéressées",
                "criteria": [
                    {"code": "cr4", "title": "Les parties intéressées pertinentes sont identifiées dans le cadre du SMQ"},
                    {"code": "cr5", "title": "Les exigences des parties intéressées sont prises en considération dans votre SMQ"},
                    {"code": "cr6", "title": "Vous revoyez régulièrement les exigences des parties intéressées"},
                    {"code": "cr7", "title": "Votre SMQ évolue lors de l'évolution des exigences de la norme"},
                ],
            },
            {
                "reference": "4.3",
                "title": "Système de Management de la Qualité (SMQ)",
                "criteria": [
                    {"code": "cr8", "title": "Le domaine d'application de votre SMQ est défini en identifiant ses limites et son applicabilité"},
                    {"code": "cr9", "title": "Une documentation complète est disponible et tenue à jour pour expliquer le domaine d'application de votre SMQ"},
                ],
            },
            {
                "reference": "4.4",
                "title": "SMQ et processus associés",
                "criteria": [
                    {"code": "cr10", "title": "Vous établissez et mettez en œuvre un SMQ en accord avec les exigences de la norme"},
                    {"code": "cr11", "title": "Vous tenez à jour et améliorez de façon continue votre SMQ"},
                    {"code": "cr12", "title": "Vous avez déterminé les processus nécessaires au SMQ en tenant compte de tous les éléments nécessaires dans l'organisme"},
                    {"code": "cr13", "title": "Vous possédez les méthodes permettant de surveiller, mesurer, évaluer et améliorer en continu les processus"},
                    {"code": "cr14", "title": "Vous avez analysé les risques et opportunités de ces processus et proposé les actions appropriées pour les traiter"},
                    {"code": "cr15", "title": "Vous conservez et tenez à jour les informations nécessaires pour le bon fonctionnement des processus"},
                ],
            },
        ],
    },
    {
        "article": "Art. 5",
        "article_title": "Responsabilité de la direction",
        "sections": [
            {
                "reference": "5.1",
                "title": "Responsabilité et engagement de la direction",
                "criteria": [
                    {"code": "cr16", "title": "La direction démontre sa responsabilité et son engagement concernant votre SMQ"},
                    {"code": "cr17", "title": "La direction démontre son engagement relatif à l'orientation client"},
                ],
            },
            {
                "reference": "5.2",
                "title": "Politique qualité",
                "criteria": [
                    {"code": "cr18", "title": "La direction établit, revoit et met à jour périodiquement sa politique qualité"},
                    {"code": "cr19", "title": "Votre politique qualité est disponible, communiquée, comprise et appliquée"},
                ],
            },
            {
                "reference": "5.3",
                "title": "Rôles, responsabilités et autorités",
                "criteria": [
                    {"code": "cr20", "title": "Dans votre organisme, les responsabilités et autorités pertinentes sont attribuées, communiquées et comprises"},
                ],
            },
        ],
    },
    {
        "article": "Art. 6",
        "article_title": "Planification du système de management de la qualité",
        "sections": [
            {
                "reference": "6.1",
                "title": "Prise en compte des risques et opportunités",
                "criteria": [
                    {"code": "cr21", "title": "Les risques et opportunités pour votre organisation sont déterminés"},
                    {"code": "cr22", "title": "Les actions sont identifiées, intégrées et mises en œuvre au sein des processus du SMQ"},
                    {"code": "cr23", "title": "L'efficacité de ces actions est revue lors de la revue de direction"},
                    {"code": "cr24", "title": "Votre SMQ est adapté à l'évolution des risques et opportunités"},
                ],
            },
            {
                "reference": "6.2",
                "title": "Objectifs qualité et planification pour les atteindre",
                "criteria": [
                    {"code": "cr25", "title": "Vos objectifs qualité sont établis de façon mesurable et positionnés au niveau de l'organisation et des processus pertinents"},
                    {"code": "cr26", "title": "Vos objectifs sont cohérents avec votre politique qualité"},
                    {"code": "cr27", "title": "Vos objectifs qualité sont documentés, tenus à jour et communiqués"},
                    {"code": "cr28", "title": "Vous maîtrisez et évaluez la méthode pour atteindre vos objectifs qualité"},
                ],
            },
            {
                "reference": "6.3",
                "title": "Planification des modifications du SMQ",
                "criteria": [
                    {"code": "cr29", "title": "Vous prenez en compte l'objectif de toute modification du SMQ et de toutes ses conséquences possibles"},
                    {"code": "cr30", "title": "Les actions sont identifiées pour anticiper les impacts de modification"},
                    {"code": "cr31", "title": "Vous considérez l'intégrité du SMQ lors de sa planification"},
                    {"code": "cr32", "title": "Vous planifiez la disponibilité des ressources nécessaires au SMQ"},
                ],
            },
        ],
    },
    {
        "article": "Art. 7",
        "article_title": "Support",
        "sections": [
            {
                "reference": "7.1",
                "title": "Gestion des ressources",
                "criteria": [
                    {"code": "cr33", "title": "Vous vérifiez la disponibilité des ressources nécessaires de façon planifiée et périodique"},
                    {"code": "cr34", "title": "Vous fournissez les ressources humaines nécessaires au fonctionnement efficace du SMQ"},
                    {"code": "cr35", "title": "Vous déterminez, fournissez et maintenez l'infrastructure et l'environnement nécessaires à la mise en œuvre de vos processus"},
                    {"code": "cr36", "title": "Vous déterminez les ressources nécessaires pour assurer des résultats de surveillance et de mesure valables et fiables"},
                    {"code": "cr37", "title": "Vous maintenez la disponibilité des ressources nécessaires"},
                    {"code": "cr38", "title": "Vous conservez les informations documentées démontrant l'adéquation des ressources pour la surveillance et la mesure"},
                    {"code": "cr39", "title": "Vos instruments de mesure sont vérifiés ou étalonnés, identifiés et protégés"},
                    {"code": "cr40", "title": "Vous conservez la référence utilisée pour l'étalonnage ou la vérification lorsque de tels étalons n'existent pas"},
                    {"code": "cr41", "title": "Lorsqu'un instrument s'avère défectueux, vous déterminez si la validité des résultats de mesure antérieurs a été compromise"},
                    {"code": "cr42", "title": "Vous identifiez, tenez à jour et mettez à disposition les connaissances nécessaires"},
                    {"code": "cr43", "title": "Vous déterminez la façon d'acquérir ou d'accéder aux connaissances supplémentaires nécessaires"},
                ],
            },
            {
                "reference": "7.2",
                "title": "Gestion des compétences",
                "criteria": [
                    {"code": "cr44", "title": "Vous identifiez les compétences nécessaires du personnel dont le travail a une incidence sur la qualité"},
                    {"code": "cr45", "title": "Vous vérifiez les compétences sur la base d'une formation ou d'une expérience"},
                    {"code": "cr46", "title": "Vous menez des actions pour permettre au personnel d'acquérir les compétences nécessaires et vous évaluez l'efficacité"},
                    {"code": "cr47", "title": "Vous conservez des informations documentées appropriées comme preuves des compétences"},
                ],
            },
            {
                "reference": "7.3",
                "title": "Sensibilisation",
                "criteria": [{"code": "cr48", "title": "Le personnel est conscient de l'importance de ses activités et de sa contribution aux objectifs qualité"}],
            },
            {
                "reference": "7.4",
                "title": "Communication",
                "criteria": [{"code": "cr49", "title": "Vous déterminez les besoins de communication interne et externe pertinents pour le SMQ"}],
            },
            {
                "reference": "7.5",
                "title": "Informations documentées",
                "criteria": [
                    {"code": "cr50", "title": "Vous vous assurez que la création et la mise à jour des informations documentées se font de manière appropriée"},
                    {"code": "cr51", "title": "Les informations documentées exigées sont disponibles et conviennent à l'utilisation"},
                    {"code": "cr52", "title": "Vous maîtrisez les informations documentées et leur protection"},
                    {"code": "cr53", "title": "Les informations documentées d'origine externe nécessaires sont identifiées et maîtrisées"},
                ],
            },
        ],
    },
    {
        "article": "Art. 8",
        "article_title": "Réalisation des activités opérationnelles",
        "sections": [
            {
                "reference": "8.1",
                "title": "Planification et maîtrise opérationnelles",
                "criteria": [
                    {"code": "cr54", "title": "Vous avez planifié, mis en œuvre et maîtrisez les processus internes et externes relatifs à la fourniture des produits et services"},
                    {"code": "cr55", "title": "Vous avez planifié et maîtrisez les processus relatifs à la réalisation des actions pour traiter les risques ou valoriser les opportunités"},
                    {"code": "cr56", "title": "Vous conservez des enregistrements apportant la preuve de la réalisation des processus et de la conformité"},
                    {"code": "cr57", "title": "Les éléments de sortie de votre planification sont adaptés aux modes de fonctionnement de votre organisme"},
                    {"code": "cr58", "title": "Vous maîtrisez les modifications prévues et analysez les conséquences des modifications imprévues"},
                ],
            },
            {
                "reference": "8.2",
                "title": "Détermination des exigences relatives aux produits et services",
                "criteria": [
                    {"code": "cr59", "title": "Vous établissez les processus pour communiquer avec les clients"},
                    {"code": "cr60", "title": "Vous déterminez les exigences client formulées ou non et les exigences réglementaires et légales"},
                    {"code": "cr61", "title": "Lorsque les exigences du client ne sont pas fournies sous une forme documentée, vous les confirmez avant acceptation"},
                    {"code": "cr62", "title": "Vous réalisez régulièrement les revues des exigences relatives au produit et service"},
                    {"code": "cr63", "title": "Vous assurez que les écarts entre les exigences d'un contrat ou d'une commande et celles précédemment exprimées ont été résolus"},
                    {"code": "cr64", "title": "Il existe des enregistrements prouvant les résultats des revues et des actions qui en découlent"},
                    {"code": "cr65", "title": "En cas de modification des exigences, vous vous assurez que les informations documentées correspondantes sont amendées"},
                ],
            },
            {
                "reference": "8.3",
                "title": "Conception et développement de produits et services",
                "criteria": [
                    {"code": "cr66", "title": "Vous avez déterminé les étapes de la conception et du développement ainsi que les activités de revue et de vérification appropriées"},
                    {"code": "cr67", "title": "Vous maîtrisez les interfaces entre les personnes impliquées en conception et développement"},
                    {"code": "cr68", "title": "Vous avez déterminé les éléments d'entrée du processus de conception et de développement complètement"},
                    {"code": "cr69", "title": "Vous avez identifié les résultats attendus des activités du processus de conception et développement"},
                    {"code": "cr70", "title": "Vous évaluez l'aptitude des résultats à satisfaire aux exigences prévues et identifiez les problèmes et actions"},
                    {"code": "cr71", "title": "Vous conservez les documents décrivant les caractéristiques essentielles au bon déroulement du processus"},
                    {"code": "cr72", "title": "Vous révisez, maîtrisez et identifiez les modifications apportées aux éléments d'entrée et de sortie de la conception"},
                    {"code": "cr73", "title": "Vous vérifiez et validez les modifications avant leur mise en œuvre"},
                ],
            },
            {
                "reference": "8.4",
                "title": "Maîtrise des produits et services fournis par des prestataires externes",
                "criteria": [
                    {"code": "cr74", "title": "Vous avez établi des critères pour l'évaluation, la sélection, la surveillance et la réévaluation des prestataires externes"},
                    {"code": "cr75", "title": "Vous évaluez les risques de l'impact de l'externalisation des processus, produits et services"},
                    {"code": "cr76", "title": "Vous vérifiez la conformité et le retentissement des prestataires externes sur la conformité de vos produits et services"},
                    {"code": "cr77", "title": "Vous vous assurez de l'adéquation des exigences spécifiées et les communiquez aux prestataires externes"},
                    {"code": "cr78", "title": "Vous conservez les informations documentées sur les résultats du contrôle et de l'évaluation des prestataires externes"},
                ],
            },
            {
                "reference": "8.5",
                "title": "Production et prestation de service",
                "criteria": [
                    {"code": "cr79", "title": "Vous mettez en œuvre des conditions maîtrisées pour la production et la prestation de service"},
                    {"code": "cr80", "title": "Vous contrôlez l'aptitude du processus de préparation des services attendus à atteindre les résultats planifiés"},
                    {"code": "cr81", "title": "Vous identifiez les éléments de sortie tout au long de la réalisation et maîtrisez cette traçabilité"},
                    {"code": "cr82", "title": "Vous avez identifié les éléments de propriété du client ou du prestataire externe que vous vérifiez, protégez et sauvegardez"},
                    {"code": "cr83", "title": "Vous assurez la préservation des éléments de sortie des processus au cours de la production et de la prestation de service"},
                    {"code": "cr84", "title": "Vous déterminez l'étendue des activités requises après livraison"},
                    {"code": "cr85", "title": "Vous maîtrisez les modifications non planifiées essentielles à la production ou à la prestation de service"},
                ],
            },
            {
                "reference": "8.6",
                "title": "Libération des produits et services",
                "criteria": [
                    {"code": "cr86", "title": "Vous n'effectuez pas la libération des produits et services avant l'exécution satisfaisante de toutes les dispositions planifiées"},
                    {"code": "cr87", "title": "Vous conservez les informations documentées assurant la traçabilité jusqu'à la personne ayant autorisé la libération"},
                ],
            },
            {
                "reference": "8.7",
                "title": "Maîtrise des éléments de sortie non conformes",
                "criteria": [
                    {"code": "cr88", "title": "Vous identifiez et isolez les éléments de sortie des processus, produits et services non conformes"},
                    {"code": "cr89", "title": "Vous traitez les éléments de sortie, produits et services non conformes de manière appropriée"},
                    {"code": "cr90", "title": "Vous menez les actions correctives appropriées et revérifiez la conformité"},
                    {"code": "cr91", "title": "Vous conservez les informations documentées relatives aux actions menées"},
                ],
            },
        ],
    },
    {
        "article": "Art. 9",
        "article_title": "Évaluation des performances",
        "sections": [
            {
                "reference": "9.1",
                "title": "Surveillance, mesure, analyse et évaluation",
                "criteria": [
                    {"code": "cr92", "title": "Vous mettez en œuvre les activités de surveillance et de mesure et vous évaluez leurs performances"},
                    {"code": "cr93", "title": "Vous conservez les informations documentées pertinentes des activités de surveillance et de mesure"},
                    {"code": "cr94", "title": "Vous surveillez la perception du client sur le niveau de satisfaction de ses exigences"},
                    {"code": "cr95", "title": "Vous obtenez les informations relatives à l'avis et l'opinion du client"},
                    {"code": "cr96", "title": "Vous analysez et évaluez les données et informations appropriées issues de la surveillance, la mesure et autres sources"},
                    {"code": "cr97", "title": "Vous utilisez les résultats de ces analyses et évaluations comme données d'entrée à la revue de direction"},
                ],
            },
            {
                "reference": "9.2",
                "title": "Audit interne",
                "criteria": [
                    {"code": "cr98", "title": "Vous réalisez des audits internes à des intervalles planifiés"},
                    {"code": "cr99", "title": "Vous planifiez, établissez, mettez en œuvre et maintenez un ou des programmes d'audit"},
                    {"code": "cr100", "title": "Vous définissez les critères d'audit, le périmètre de chaque audit et sélectionnez des auditeurs impartiaux"},
                    {"code": "cr101", "title": "Les résultats des audits sont communiqués à la direction concernée et vous entreprenez les actions correctives nécessaires"},
                    {"code": "cr102", "title": "Vous conservez des informations documentées comme preuves du programme d'audit et des résultats"},
                ],
            },
            {
                "reference": "9.3",
                "title": "Revue de direction",
                "criteria": [
                    {"code": "cr103", "title": "La revue de direction est planifiée et réalisée en prenant en compte les éléments nécessaires"},
                    {"code": "cr104", "title": "Après la revue de direction, vous prenez les décisions et actions relatives aux opportunités d'amélioration continue"},
                    {"code": "cr105", "title": "Vous conservez des informations documentées comme preuves des conclusions des revues de direction"},
                ],
            },
        ],
    },
    {
        "article": "Art. 10",
        "article_title": "Amélioration",
        "sections": [
            {
                "reference": "10.1",
                "title": "Généralités",
                "criteria": [
                    {"code": "cr106", "title": "Vous avez mené des actions pour satisfaire aux exigences du client et accroître sa satisfaction"},
                ],
            },
            {
                "reference": "10.2",
                "title": "Non-conformité et actions correctives",
                "criteria": [
                    {"code": "cr107", "title": "Les parties intéressées pertinentes sont identifiées dans le cadre du SMQ"},
                    {"code": "cr108", "title": "Vos objectifs sont cohérents avec votre politique qualité et vous avez réagi aux conséquences de la non-conformité"},
                    {"code": "cr109", "title": "Vous analysez toujours la non-conformité"},
                    {"code": "cr110", "title": "Vous recherchez et analysez les causes de la non-conformité en temps opportun"},
                    {"code": "cr111", "title": "Vous avez recherché si des non-conformités similaires existent ou pourraient potentiellement se produire"},
                    {"code": "cr112", "title": "Vous avez conservé des informations documentées de la nature des non-conformités et de toute action menée ultérieurement"},
                    {"code": "cr113", "title": "Vous avez mis en œuvre toutes les actions correctives requises pour faire face à ces non-conformités"},
                    {"code": "cr114", "title": "Vous avez examiné l'efficacité de toute action corrective mise en œuvre"},
                    {"code": "cr115", "title": "Vous avez modifié, si nécessaire, le SMQ après la mise en place des actions correctives"},
                    {"code": "cr116", "title": "Vous avez conservé des informations documentées des résultats de toute action corrective"},
                ],
            },
            {
                "reference": "10.3",
                "title": "Amélioration continue",
                "criteria": [
                    {"code": "cr117", "title": "Vous améliorez en continu la pertinence, l'adéquation et l'efficacité du SMQ"},
                    {"code": "cr118", "title": "Un document complet est disponible et tenu à jour pour expliquer le domaine d'application de votre SMQ"},
                ],
            },
        ],
    },
]
