// Supabase-backed operations service. Single source of truth for the
// real operational data (no mocks). Uses RLS — every query is scoped to
// the authenticated user automatically.

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DBOperation = Database["public"]["Tables"]["operations"]["Row"];
export type DBOperationInsert = Database["public"]["Tables"]["operations"]["Insert"];
export type DBOperationStatus = Database["public"]["Enums"]["operation_status"];

function makeOperationCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TX-${n}`;
}

export const operationsDb = {
  async list(): Promise<DBOperation[]> {
    const { data, error } = await supabase
      .from("operations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async listActive(): Promise<DBOperation[]> {
    const { data, error } = await supabase
      .from("operations")
      .select("*")
      .neq("status", "PENDING_PAYMENT")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async get(id: string): Promise<DBOperation | null> {
    const { data, error } = await supabase
      .from("operations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async createPending(input: Omit<DBOperationInsert, "operation_code" | "status">): Promise<DBOperation> {
    const payload: DBOperationInsert = {
      ...input,
      operation_code: makeOperationCode(),
      status: "PENDING_PAYMENT",
    };
    const { data, error } = await supabase
      .from("operations")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, patch: Partial<DBOperationInsert>): Promise<DBOperation> {
    const { data, error } = await supabase
      .from("operations")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },

  async markActive(id: string): Promise<DBOperation> {
    return this.update(id, {
      status: "ACTIVE",
      activated_at: new Date().toISOString(),
    });
  },

  async uploadProof(userId: string, operationId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${operationId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return path;
  },

  async getProofUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 60 * 60);
    if (error) return null;
    return data?.signedUrl ?? null;
  },
};
