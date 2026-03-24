export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audits: {
        Row: {
          checklist: Json | null
          created_at: string
          date: string
          etat_general: string | null
          id: string
          intervention_id: string | null
          machine_ids: string[] | null
          observations: string | null
          photos: string[] | null
          proprete: string | null
          recommandations: string | null
          securite: string | null
          technician_id: string | null
          usure: string | null
        }
        Insert: {
          checklist?: Json | null
          created_at?: string
          date?: string
          etat_general?: string | null
          id?: string
          intervention_id?: string | null
          machine_ids?: string[] | null
          observations?: string | null
          photos?: string[] | null
          proprete?: string | null
          recommandations?: string | null
          securite?: string | null
          technician_id?: string | null
          usure?: string | null
        }
        Update: {
          checklist?: Json | null
          created_at?: string
          date?: string
          etat_general?: string | null
          id?: string
          intervention_id?: string | null
          machine_ids?: string[] | null
          observations?: string | null
          photos?: string[] | null
          proprete?: string | null
          recommandations?: string | null
          securite?: string | null
          technician_id?: string | null
          usure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audits_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string
          contact: string | null
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city: string
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      devis: {
        Row: {
          client_id: string
          created_at: string
          date_creation: string
          description: string | null
          id: string
          intervention_id: string | null
          montant: number
          numero_offre: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date_creation?: string
          description?: string | null
          id?: string
          intervention_id?: string | null
          montant?: number
          numero_offre: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date_creation?: string
          description?: string | null
          id?: string
          intervention_id?: string | null
          montant?: number
          numero_offre?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "interventions"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          client_id: string
          created_at: string
          date: string
          description: string | null
          duration: number | null
          id: string
          machine_id: string | null
          machine_ids: string[] | null
          notes: string | null
          photos: string[] | null
          status: string
          technician_id: string | null
          travel_time: number | null
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          description?: string | null
          duration?: number | null
          id?: string
          machine_id?: string | null
          machine_ids?: string[] | null
          notes?: string | null
          photos?: string[] | null
          status?: string
          technician_id?: string | null
          travel_time?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          description?: string | null
          duration?: number | null
          id?: string
          machine_id?: string | null
          machine_ids?: string[] | null
          notes?: string | null
          photos?: string[] | null
          status?: string
          technician_id?: string | null
          travel_time?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          created_at: string
          designation: string
          id: string
          location_type: string
          min_stock: number
          quantity: number
          reference: string
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          designation?: string
          id?: string
          location_type?: string
          min_stock?: number
          quantity?: number
          reference: string
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          designation?: string
          id?: string
          location_type?: string
          min_stock?: number
          quantity?: number
          reference?: string
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_history: {
        Row: {
          changed_at: string
          id: string
          inventory_id: string
          new_quantity: number
          note: string | null
          old_quantity: number
        }
        Insert: {
          changed_at?: string
          id?: string
          inventory_id: string
          new_quantity: number
          note?: string | null
          old_quantity: number
        }
        Update: {
          changed_at?: string
          id?: string
          inventory_id?: string
          new_quantity?: number
          note?: string | null
          old_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_history_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          client_id: string
          created_at: string
          id: string
          install_date: string | null
          model: string | null
          name: string
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          install_date?: string | null
          model?: string | null
          name: string
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          install_date?: string | null
          model?: string | null
          name?: string
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          created_at: string
          email: string | null
          home_address: string | null
          home_latitude: number | null
          home_longitude: number | null
          id: string
          name: string
          phone: string | null
          speciality: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          home_address?: string | null
          home_latitude?: number | null
          home_longitude?: number | null
          id?: string
          name: string
          phone?: string | null
          speciality?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          home_address?: string | null
          home_latitude?: number | null
          home_longitude?: number | null
          id?: string
          name?: string
          phone?: string | null
          speciality?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
