export interface Client {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  contact: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface Machine {
  id: string;
  clientId: string;
  name: string;
  model: string;
  serialNumber: string;
  installDate: string;
  status: 'operational' | 'maintenance' | 'hors-service';
}

export interface Intervention {
  id: string;
  clientId: string;
  machineId: string;
  technicianId: string;
  date: string;
  type: 'preventive' | 'corrective' | 'audit';
  status: 'planifiee' | 'en-cours' | 'terminee';
  description: string;
  duration: number; // in minutes
  travelTime: number; // in minutes
  notes: string;
  photos: string[];
}

export interface AuditForm {
  id: string;
  interventionId: string;
  date: string;
  technicianId: string;
  etatGeneral: 'bon' | 'moyen' | 'mauvais';
  securite: 'conforme' | 'non-conforme';
  proprete: 'bon' | 'moyen' | 'mauvais';
  usure: 'faible' | 'moyenne' | 'elevee';
  recommandations: string;
  observations: string;
  photos: string[];
  checklistItems: AuditChecklistItem[];
}

export interface AuditChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  comment: string;
}

export interface Devis {
  id: string;
  interventionId: string;
  clientId: string;
  numeroOffre: string;
  montant: number;
  status: 'en-attente' | 'accepte' | 'refuse';
  dateCreation: string;
  description: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  speciality: string;
}

export type StatusColor = 'success' | 'warning' | 'destructive' | 'info';
