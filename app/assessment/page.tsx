import { redirect } from "next/navigation"; import { createServerSupabaseClient } from "@/lib/supabase/server"; import { AssessmentRunner } from "./runner";
export const dynamic="force-dynamic";
export default async function AssessmentPage(){const s=await createServerSupabaseClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect("/signin?mode=sign-in");return <AssessmentRunner/>;}