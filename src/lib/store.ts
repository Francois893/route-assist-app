import { create } from 'zustand';
import { Client, Machine, Intervention, Devis, Technician } from './types';
import { clients as mockClients, machines as mockMachines, interventions as mockInterventions, devis as mockDevis, technicians as mockTechnicians } from './mock-data';

interface AppStore {
  clients: Client[];
  machines: Machine[];
  interventions: Intervention[];
  devis: Devis[];
  technicians: Technician[];
  
  addClient: (client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  
  addMachine: (machine: Machine) => void;
  updateMachine: (id: string, data: Partial<Machine>) => void;
  
  addIntervention: (intervention: Intervention) => void;
  updateIntervention: (id: string, data: Partial<Intervention>) => void;
  
  addDevis: (devis: Devis) => void;
  updateDevis: (id: string, data: Partial<Devis>) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  clients: mockClients,
  machines: mockMachines,
  interventions: mockInterventions,
  devis: mockDevis,
  technicians: mockTechnicians,

  addClient: (client) => set((s) => ({ clients: [...s.clients, client] })),
  updateClient: (id, data) => set((s) => ({ clients: s.clients.map(c => c.id === id ? { ...c, ...data } : c) })),

  addMachine: (machine) => set((s) => ({ machines: [...s.machines, machine] })),
  updateMachine: (id, data) => set((s) => ({ machines: s.machines.map(m => m.id === id ? { ...m, ...data } : m) })),

  addIntervention: (intervention) => set((s) => ({ interventions: [...s.interventions, intervention] })),
  updateIntervention: (id, data) => set((s) => ({ interventions: s.interventions.map(i => i.id === id ? { ...i, ...data } : i) })),

  addDevis: (devis) => set((s) => ({ devis: [...s.devis, devis] })),
  updateDevis: (id, data) => set((s) => ({ devis: s.devis.map(d => d.id === id ? { ...d, ...data } : d) })),
}));
