export interface Equipment {
  id: string;
  reference: string;
  designation: string;
  description: string;
  price: number;
  category: string;
}

export const equipmentCatalog: Equipment[] = [
  {
    id: "eq-001",
    reference: "MEL-PMP-2200",
    designation: "Pompe hydraulique haute pression 220 bar",
    description: "Pompe hydraulique industrielle haute pression, débit 45L/min, adaptée aux environnements exigeants. Corps en fonte, joints Viton. Certification ATEX zone 2.",
    price: 3450.00,
    category: "Pompes",
  },
  {
    id: "eq-002",
    reference: "MEL-VAN-1050",
    designation: "Vanne de régulation DN50 pneumatique",
    description: "Vanne de régulation à membrane pneumatique, DN50, pression max 16 bar. Corps inox 316L, actionneur simple effet avec positionneur intégré.",
    price: 1280.00,
    category: "Vannes",
  },
  {
    id: "eq-003",
    reference: "MEL-CPR-3000",
    designation: "Compresseur à vis 30kW",
    description: "Compresseur rotatif à vis lubrifiée, puissance 30kW, débit 5.2 m³/min à 8 bar. Sécheur intégré, variateur de fréquence, niveau sonore 68 dB(A).",
    price: 12800.00,
    category: "Compresseurs",
  },
  {
    id: "eq-004",
    reference: "MEL-FLT-0420",
    designation: "Filtre à particules industriel 4μm",
    description: "Filtre à particules haute efficacité, seuil de filtration 4μm, débit nominal 120 m³/h. Cartouche en acier inoxydable, manomètre différentiel inclus.",
    price: 890.00,
    category: "Filtration",
  },
  {
    id: "eq-005",
    reference: "MEL-MOT-5500",
    designation: "Moteur électrique triphasé 5.5kW IE3",
    description: "Moteur asynchrone triphasé 5.5kW, rendement IE3, 1450 tr/min, 400V/50Hz. Classe d'isolation F, indice de protection IP55, montage B3/B5.",
    price: 1650.00,
    category: "Moteurs",
  },
  {
    id: "eq-006",
    reference: "MEL-CAP-0800",
    designation: "Capteur de pression 0-100 bar 4-20mA",
    description: "Transmetteur de pression piézorésistif, plage 0-100 bar, sortie 4-20mA. Précision ±0.25% PE, raccord G1/4, boîtier inox IP67.",
    price: 420.00,
    category: "Capteurs",
  },
  {
    id: "eq-007",
    reference: "MEL-ECH-1200",
    designation: "Échangeur thermique à plaques 120kW",
    description: "Échangeur à plaques brasées, puissance thermique 120kW, plaques inox AISI 316. Pression max 30 bar, température max 200°C.",
    price: 4200.00,
    category: "Échangeurs",
  },
  {
    id: "eq-008",
    reference: "MEL-RED-0315",
    designation: "Réducteur planétaire i=15 couple 300Nm",
    description: "Réducteur planétaire 2 étages, rapport i=15, couple nominal 300 Nm. Arbre de sortie Ø35mm, rendement 96%, lubrification à vie.",
    price: 2100.00,
    category: "Réducteurs",
  },
  {
    id: "eq-009",
    reference: "MEL-VER-0750",
    designation: "Vérin pneumatique Ø75 course 250mm",
    description: "Vérin pneumatique double effet, diamètre 75mm, course 250mm. Tige chromée, amortissement réglable, conforme ISO 15552.",
    price: 340.00,
    category: "Vérins",
  },
  {
    id: "eq-010",
    reference: "MEL-API-2400",
    designation: "Automate programmable 24 E/S",
    description: "API compact 24 entrées/sorties (14DI + 10DO), port Ethernet/Profinet, écran LCD intégré. Programmation en Ladder/FBD, mémoire programme 256Ko.",
    price: 1890.00,
    category: "Automatisme",
  },
];
