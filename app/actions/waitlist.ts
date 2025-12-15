"use server";

import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface WaitlistFormData {
  email: string;
  analytics?: string;
  analyticsOther?: string;
  measurements: string[];
  measurementsOther?: string;
  stack: string[];
  stackOther?: string;
}

// Salva apenas o email inicial
export async function saveEmail(email: string) {
  try {
    // Verifica se o email já existe
    const existing = await db.select().from(waitlist).where(eq(waitlist.email, email)).limit(1);

    if (existing.length > 0) {
      return {
        success: true,
        data: existing[0],
        message: "Email já cadastrado",
      };
    }

    const result = await db.insert(waitlist).values({
      email,
      measurements: [],
      stack: [],
    }).returning();

    return {
      success: true,
      data: result[0],
      message: "Email cadastrado com sucesso",
    };
  } catch (error) {
    console.error("Error saving email:", error);
    return {
      success: false,
      error: "Erro ao cadastrar email. Por favor, tente novamente.",
    };
  }
}

// Atualiza o registro com os dados completos do formulário
export async function updateWaitlistData(email: string, data: Omit<WaitlistFormData, "email">) {
  try {
    const result = await db
      .update(waitlist)
      .set({
        analytics: data.analytics,
        analyticsOther: data.analyticsOther,
        measurements: data.measurements,
        measurementsOther: data.measurementsOther,
        stack: data.stack,
        stackOther: data.stackOther,
      })
      .where(eq(waitlist.email, email))
      .returning();

    return {
      success: true,
      data: result[0],
    };
  } catch (error) {
    console.error("Error updating waitlist:", error);
    return {
      success: false,
      error: "Erro ao atualizar dados. Por favor, tente novamente.",
    };
  }
}
