const SHEET_LABELS: Record<string, string> = {
  informations_generales: "Informations générales",
  pilote_processus: "Pilote du processus",
  designation_processus: "Désignation du processus",
  objectif_processus: "Objectif du processus",
  structures_concernees: "Structures concernées",
  type_processus: "Type de processus",
  elements_cles: "Éléments clés",
  delai_global: "Délai global",
  cout_estime: "Coût estimé",
  entrees: "Entrées",
  element_declencheur_ou_donnee: "Élément déclencheur ou donnée",
  processus_source: "Processus source",
  sorties: "Sorties",
  livrable_ou_service: "Livrable ou service",
  processus_destinataire: "Processus destinataire",
  clients: "Clients",
  effectifs_impliques: "Effectifs impliqués",
  competences_cles: "Compétences clés",
  kpi: "KPI",
  indicateur: "Indicateur",
  cible: "Cible",
  frequence_mesure: "Fréquence de mesure",
  contexte_et_environnement: "Contexte et environnement",
  processus_voisins: "Processus voisins",
  amont: "Amont",
  aval: "Aval",
  enjeux: "Enjeux",
  moyens_alloues: "Moyens alloués",
  contraintes: "Contraintes",
  reglementaires: "Réglementaires",
  temporelles: "Temporelles",
  techniques: "Techniques",
  risques: "Risques",
  informations_documentees: "Informations documentées",
  documents_de_reference: "Documents de référence",
  enregistrements_preuves: "Enregistrements / preuves",
  identification_description: "Identification et description",
  format_support: "Format et support",
  revue_approbation: "Revue et approbation",
  dysfonctionnements_majeurs_connus: "Dysfonctionnements majeurs connus",
  descriptions: "Descriptions",
  consequences: "Conséquences",
  causes: "Causes",
  ameliorations: "Améliorations",
  court_terme: "Court terme",
  moyen_terme: "Moyen terme",
  long_terme: "Long terme",
  deroulement_et_modelisation: "Déroulement et modélisation",
  taches_chronologiques: "Tâches chronologiques",
  etape: "Étape",
  acteur: "Acteur",
  actions: "Actions",
  cartographie: "Cartographie",
  swimlanes_acteurs: "Swimlanes / acteurs",
  evenements_timers: "Événements timers",
  passerelles_decision: "Passerelles de décision",
  flux_messages: "Flux de messages",
  validation: "Validation",
  redacteur: "Rédacteur",
  verificateur: "Vérificateur",
  approbateur: "Approbateur",
  assistant: "Assistant(e)",
};

const SHEET_ORDER = [
  "informations_generales",
  "elements_cles",
  "contexte_et_environnement",
  "informations_documentees",
  "dysfonctionnements_majeurs_connus",
];

const HIDDEN_SHEET_SECTIONS = new Set([
  "deroulement_et_modelisation",
  "validation",
]);

export function labelizeSheetKey(value: string) {
  return SHEET_LABELS[value] ?? value.replace(/_/g, " ");
}

export function isHiddenSheetSection(value: string) {
  return HIDDEN_SHEET_SECTIONS.has(value);
}

export function sortSheetEntries<T>(entries: [string, T][]) {
  return entries.filter(([key]) => !isHiddenSheetSection(key)).sort(([left], [right]) => {
    const leftIndex = SHEET_ORDER.indexOf(left);
    const rightIndex = SHEET_ORDER.indexOf(right);
    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex)
        - (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
    }
    return left.localeCompare(right);
  });
}
