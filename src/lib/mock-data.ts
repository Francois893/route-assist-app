import { Client, Machine, Intervention, Devis, Technician } from './types';

export const technicians: Technician[] = [
  { id: 't1', name: 'Marc Dupont', email: 'marc@tech.fr', phone: '06 12 34 56 78', speciality: 'Hydraulique' },
  { id: 't2', name: 'Sophie Martin', email: 'sophie@tech.fr', phone: '06 23 45 67 89', speciality: 'Électrique' },
  { id: 't3', name: 'Lucas Bernard', email: 'lucas@tech.fr', phone: '06 34 56 78 90', speciality: 'Mécanique' },
];

export const clients: Client[] = [
  { id: 'c1', name: 'Acier Plus SARL', address: '12 Rue de l\'Industrie', city: 'Lyon', phone: '04 72 00 00 01', email: 'contact@acierplus.fr', contact: 'Jean Moreau', latitude: 45.764, longitude: 4.8357, createdAt: '2024-01-15' },
  { id: 'c2', name: 'MécaPro Industries', address: '45 Avenue des Usines', city: 'Grenoble', phone: '04 76 00 00 02', email: 'info@mecapro.fr', contact: 'Claire Petit', latitude: 45.1885, longitude: 5.7245, createdAt: '2024-02-20' },
  { id: 'c3', name: 'ThermoTech SA', address: '8 Boulevard Pasteur', city: 'Saint-Étienne', phone: '04 77 00 00 03', email: 'direction@thermotech.fr', contact: 'Paul Roux', latitude: 45.4397, longitude: 4.3872, createdAt: '2024-03-10' },
  { id: 'c4', name: 'Fonderie Delacroix', address: '22 Chemin des Forges', city: 'Villeurbanne', phone: '04 78 00 00 04', email: 'admin@fonderie-d.fr', contact: 'Marie Lambert', latitude: 45.7676, longitude: 4.8798, createdAt: '2024-04-05' },
];

export const machines: Machine[] = [
  { id: 'm1', clientId: 'c1', name: 'Presse hydraulique P200', model: 'PH-200X', serialNumber: 'PH200-2023-001', installDate: '2023-06-15', status: 'operational' },
  { id: 'm2', clientId: 'c1', name: 'Tour CNC T500', model: 'TC-500', serialNumber: 'TC500-2022-015', installDate: '2022-03-20', status: 'maintenance' },
  { id: 'm3', clientId: 'c2', name: 'Robot soudeur RS3', model: 'RS-3000', serialNumber: 'RS3-2024-002', installDate: '2024-01-10', status: 'operational' },
  { id: 'm4', clientId: 'c2', name: 'Fraiseuse 5 axes FA5', model: 'FA-5X', serialNumber: 'FA5-2021-008', installDate: '2021-09-01', status: 'hors-service' },
  { id: 'm5', clientId: 'c3', name: 'Four industriel FI-800', model: 'FI-800T', serialNumber: 'FI800-2023-003', installDate: '2023-11-22', status: 'operational' },
  { id: 'm6', clientId: 'c4', name: 'Pont roulant PR-10T', model: 'PR-10', serialNumber: 'PR10-2020-012', installDate: '2020-07-14', status: 'operational' },
];

export const interventions: Intervention[] = [
  { id: 'i1', clientId: 'c1', machineId: 'm1', technicianId: 't1', date: '2025-03-10', type: 'preventive', status: 'terminee', description: 'Maintenance préventive trimestrielle', duration: 120, travelTime: 45, notes: 'RAS, machine en bon état', photos: [] },
  { id: 'i2', clientId: 'c1', machineId: 'm2', technicianId: 't2', date: '2025-03-12', type: 'corrective', status: 'terminee', description: 'Remplacement roulement axe principal', duration: 240, travelTime: 45, notes: 'Pièce remplacée, recalibration effectuée', photos: [] },
  { id: 'i3', clientId: 'c2', machineId: 'm4', technicianId: 't3', date: '2025-03-14', type: 'corrective', status: 'en-cours', description: 'Diagnostic panne système de refroidissement', duration: 180, travelTime: 90, notes: 'En attente pièce détachée', photos: [] },
  { id: 'i4', clientId: 'c3', machineId: 'm5', technicianId: 't1', date: '2025-03-17', type: 'audit', status: 'planifiee', description: 'Audit annuel four industriel', duration: 0, travelTime: 60, notes: '', photos: [] },
  { id: 'i5', clientId: 'c4', machineId: 'm6', technicianId: 't2', date: '2025-03-18', type: 'preventive', status: 'planifiee', description: 'Inspection pont roulant', duration: 0, travelTime: 30, notes: '', photos: [] },
];

export const devis: Devis[] = [
  { id: 'd1', interventionId: 'i2', clientId: 'c1', numeroOffre: 'OFF-2025-001', montant: 3450, status: 'accepte', dateCreation: '2025-03-13', description: 'Remplacement roulement + main d\'œuvre' },
  { id: 'd2', interventionId: 'i3', clientId: 'c2', numeroOffre: 'OFF-2025-002', montant: 8900, status: 'en-attente', dateCreation: '2025-03-15', description: 'Réparation système refroidissement + pièces' },
  { id: 'd3', interventionId: 'i1', clientId: 'c1', numeroOffre: 'OFF-2025-003', montant: 1200, status: 'accepte', dateCreation: '2025-03-11', description: 'Maintenance préventive forfaitaire' },
  { id: 'd4', interventionId: 'i4', clientId: 'c3', numeroOffre: 'OFF-2025-004', montant: 2100, status: 'en-attente', dateCreation: '2025-03-16', description: 'Audit annuel + rapport' },
  { id: 'd5', interventionId: 'i5', clientId: 'c4', numeroOffre: 'OFF-2025-005', montant: 650, status: 'refuse', dateCreation: '2025-03-14', description: 'Vente additionnelle - kit lubrification' },
];

const item = (id: string, label: string, category: string, machineType?: 'piston' | 'engrenage') => ({
  id, label, checked: false, status: 'non-verifie' as const, comment: '', category, machineType,
});

export const defaultAuditChecklist = [
  // VUE ENSEMBLE
  item('ve1', 'Carter', 'Vue ensemble'),
  item('ve2', 'Feeder', 'Vue ensemble'),
  // SYSTÈME PISTON
  item('sp1', 'Filtre', 'Système Piston', 'piston'),
  item('sp2', 'Vérin', 'Système Piston', 'piston'),
  item('sp3', 'Electrovanne', 'Système Piston', 'piston'),
  item('sp4', 'Vanne dépressurisation', 'Système Piston', 'piston'),
  item('sp5', 'Valve', 'Système Piston', 'piston'),
  item('sp6', 'Raccord', 'Système Piston', 'piston'),
  item('sp7', 'Détendeur / Mano', 'Système Piston', 'piston'),
  item('sp8', 'Axe de pompe', 'Système Piston', 'piston'),
  item('sp9', 'Isolant', 'Système Piston', 'piston'),
  item('sp10', 'Distributeur', 'Système Piston', 'piston'),
  item('sp11', 'Joint cuve', 'Système Piston', 'piston'),
  // SYSTÈME ENGRENAGE
  item('se1', 'Filtre', 'Système Engrenage', 'engrenage'),
  item('se2', 'Accouplement', 'Système Engrenage', 'engrenage'),
  item('se3', 'Fuite / Pompe', 'Système Engrenage', 'engrenage'),
  item('se4', 'By pass', 'Système Engrenage', 'engrenage'),
  item('se5', 'Vérin NS', 'Système Engrenage', 'engrenage'),
  item('se6', 'Isolant', 'Système Engrenage', 'engrenage'),
  item('se7', 'Distributeur', 'Système Engrenage', 'engrenage'),
  item('se8', 'Joint cuve', 'Système Engrenage', 'engrenage'),
  // ELECTRIQUE
  item('el1', 'Connection électrique', 'Électrique'),
  item('el2', 'Sortie électrique', 'Électrique'),
  item('el3', 'Capteur', 'Électrique'),
  item('el4', 'Bobine', 'Électrique'),
  item('el5', 'Balise', 'Électrique'),
  // APPLICATEUR
  item('ap1', 'Fonctionnement', 'Applicateur'),
  item('ap2', 'Fixation', 'Applicateur'),
  item('ap3', 'Fuite', 'Applicateur'),
  item('ap4', 'Connection / Bornier / Connecteur', 'Applicateur'),
  item('ap5', 'Electrovanne', 'Applicateur'),
  item('ap6', 'Sonde / Résistance', 'Applicateur'),
  item('ap7', 'Module', 'Applicateur'),
  item('ap8', 'Raccord air', 'Applicateur'),
  item('ap9', 'Buse', 'Applicateur'),
  // TUYAUX
  item('tu1', 'Fonctionnement', 'Tuyaux'),
  item('tu2', 'Fuite', 'Tuyaux'),
  item('tu3', 'Connection', 'Tuyaux'),
  item('tu4', 'Revêtement', 'Tuyaux'),
  // PISTOLET
  item('pi1', 'Fonctionnement', 'Pistolet'),
  item('pi2', 'Sonde / Résistance', 'Pistolet'),
  item('pi3', 'Connection / Bornier', 'Pistolet'),
  item('pi4', 'Fuite / Colle', 'Pistolet'),
  item('pi5', 'Carcasse', 'Pistolet'),
  item('pi6', 'Sécurité', 'Pistolet'),
  item('pi7', 'Buse', 'Pistolet'),
];
