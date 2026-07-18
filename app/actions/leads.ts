"use server";

import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const LeadSchema = z.object({
  source: z.enum(["workshop", "community", "college", "startup"]),
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().default(""),
  college: z.string().max(160).optional().default("")
});

export async function registerLead(formData: FormData) {
  const parsed = LeadSchema.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  await supabase.from("community_members").insert({
    source: parsed.source,
    full_name: parsed.full_name,
    email: parsed.email,
    phone: parsed.phone || null,
    college: parsed.college || null
  });
}
