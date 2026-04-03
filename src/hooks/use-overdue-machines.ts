import { useMemo } from "react";
import { useMachines, useClients, useInterventions } from "@/hooks/use-data";

export function useOverdueMachines() {
  const { data: machines = [] } = useMachines();
  const { data: clients = [] } = useClients();
  const { data: interventions = [] } = useInterventions();

  return useMemo(() => {
    const today = new Date();

    return machines
      .map((machine) => {
        const machineInterventions = interventions
          .filter(
            (i) =>
              (i.machine_id === machine.id ||
                (i.machine_ids && i.machine_ids.includes(machine.id))) &&
              i.status === "terminee"
          )
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const lastMaintenanceDate = machineInterventions[0]?.date ?? machine.install_date;
        const intervalDays = machine.maintenance_interval_days ?? 365;

        if (!lastMaintenanceDate) return null;

        const dueDate = new Date(lastMaintenanceDate);
        dueDate.setDate(dueDate.getDate() + intervalDays);

        const isOverdue = today > dueDate;
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (!isOverdue) return null;

        const client = clients.find((c) => c.id === machine.client_id);

        return {
          machine,
          client,
          lastMaintenanceDate,
          dueDate: dueDate.toISOString().split("T")[0],
          daysOverdue,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.daysOverdue - a!.daysOverdue) as {
      machine: (typeof machines)[0];
      client: (typeof clients)[0] | undefined;
      lastMaintenanceDate: string;
      dueDate: string;
      daysOverdue: number;
    }[];
  }, [machines, clients, interventions]);
}
