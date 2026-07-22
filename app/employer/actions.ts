"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getAuthUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

async function createNotification(
  userId: string,
  actorId: string,
  type: string,
  postId?: string
) {
  const supabase = await createServerSupabaseClient();
  try {
    await supabase.from("comm_notifications").insert({
      user_id: userId,
      actor_id: actorId,
      type,
      post_id: postId || null,
    });
  } catch {
    /* optional table */
  }
}

const EmployerOnboardingSchema = z.object({
  company_name: z.string().trim().min(2, "Company name is required"),
  email: z.string().trim().email("Enter a valid company email"),
  website: z.string().url("Enter a valid website URL").or(z.literal("")).optional(),
  location: z.string().trim().min(2, "Location is required"),
  location_type: z.enum(["remote", "hybrid", "on_site", "multi_location", "other"]),
  company_size: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]),
  pan_number: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v),
      "Enter a valid PAN (e.g. ABCDE1234F) or leave blank"
    ),
  about: z.string().trim().max(2000).optional().or(z.literal("")),
  sector: z.string().trim().max(120).optional().or(z.literal("")),
  hiring_contact_name: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  company_logo_url: z.string().url().or(z.literal("")).optional(),
});

export async function completeEmployerOnboarding(formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/employer/signin?mode=sign-in");

  const parsed = EmployerOnboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const d = parsed.data;
  const supabase = await createServerSupabaseClient();

  const usernameBase =
    user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "-") ??
    user.id.slice(0, 8);
  const companySlug = d.company_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  const username = `co-${companySlug || usernameBase}`.slice(0, 40);

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      email: d.email || user.email,
      username,
      full_name: d.hiring_contact_name || d.company_name,
      phone: d.phone || null,
      location: d.location,
      bio: d.about || null,
      target_role: "Employer",
      role: "employer",
    },
    { onConflict: "user_id" }
  );

  if (profileError) {
    if (profileError.code === "23505") {
      // username conflict — retry with user id suffix
      await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          email: d.email || user.email,
          username: `${username}-${user.id.slice(0, 4)}`,
          full_name: d.hiring_contact_name || d.company_name,
          phone: d.phone || null,
          location: d.location,
          bio: d.about || null,
          target_role: "Employer",
          role: "employer",
        },
        { onConflict: "user_id" }
      );
    } else if (/app_role|invalid input value/i.test(profileError.message)) {
      return {
        error:
          "Employer role is not enabled in the database yet. Run supabase/migrations/006_employer.sql, then try again.",
      };
    } else {
      return { error: profileError.message };
    }
  }

  const { error: empError } = await supabase.from("employer_profiles").upsert(
    {
      user_id: user.id,
      company_name: d.company_name,
      company_logo_url: d.company_logo_url || null,
      email: d.email,
      website: d.website || null,
      location: d.location,
      location_type: d.location_type,
      company_size: d.company_size,
      pan_number: d.pan_number ? d.pan_number.toUpperCase() : null,
      about: d.about || null,
      sector: d.sector || null,
      hiring_contact_name: d.hiring_contact_name || null,
      phone: d.phone || null,
      onboarding_complete: true,
    },
    { onConflict: "user_id" }
  );

  if (empError) {
    if (empError.code === "42P01" || /employer_profiles|relation .* does not exist/i.test(empError.message)) {
      return {
        error:
          "Employer tables are not set up yet. Run supabase/migrations/006_employer.sql in your Supabase project.",
      };
    }
    return { error: empError.message };
  }

  revalidatePath("/employer");
  revalidatePath("/employer/dashboard");
  redirect("/employer/dashboard");
}

const CreateEmployerJobSchema = z.object({
  title: z.string().trim().min(3, "Job title must be at least 3 characters"),
  description: z.string().trim().min(20, "Description must be at least 20 characters"),
  employment_type: z.enum(["internship", "full_time", "part_time", "contract", "freelance"]),
  workplace_type: z.enum(["remote", "hybrid", "on_site"]),
  location: z.string().trim().min(2, "Location is required"),
  skills_required: z.string().trim().min(1, "Add at least one required skill"),
  compensation: z.string().trim().min(2, "Compensation is required"),
  experience_required: z.string().trim().min(1, "Experience requirement is required"),
  contact_email: z.string().trim().email("Enter a valid contact email"),
  application_url: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  application_deadline: z.string().optional(),
  category: z.enum(["job", "freelance", "internship", "opportunity"]).optional(),
  company_website: z.string().url().or(z.literal("")).optional(),
});

export async function createEmployerJob(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "employer" && profile?.role !== "admin") {
    return { error: "Only employer accounts can post jobs. Sign in with Employer Login." };
  }

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!employer?.onboarding_complete) {
    return { error: "Complete your company profile before posting jobs." };
  }

  const parsed = CreateEmployerJobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const job = parsed.data;
  const skills = job.skills_required
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (skills.length === 0) return { error: "Add at least one required skill" };

  let category = job.category ?? "job";
  if (job.employment_type === "freelance") category = "freelance";
  if (job.employment_type === "internship") category = "internship";

  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    employer_user_id: user.id,
    title: job.title,
    company_name: employer.company_name,
    company_website: job.company_website || employer.website || null,
    company_logo_url: employer.company_logo_url || null,
    description: job.description,
    employment_type: job.employment_type,
    workplace_type: job.workplace_type,
    location: job.location,
    skills_required: skills,
    compensation: job.compensation,
    experience_required: job.experience_required,
    contact_email: job.contact_email,
    application_url: job.application_url || null,
    application_deadline: job.application_deadline || null,
    category,
    status: "open",
  };

  const { data, error } = await supabase
    .from("comm_jobs")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    // Retry without newer columns if migration not applied fully
    if (/employer_user_id|company_logo_url|category|column/i.test(error.message)) {
      const { data: fallback, error: fallbackErr } = await supabase
        .from("comm_jobs")
        .insert({
          user_id: user.id,
          title: job.title,
          company_name: employer.company_name,
          company_website: job.company_website || employer.website || null,
          description: job.description,
          employment_type: job.employment_type,
          workplace_type: job.workplace_type,
          location: job.location,
          skills_required: skills,
          compensation: job.compensation,
          experience_required: job.experience_required,
          contact_email: job.contact_email,
          application_url: job.application_url || null,
          application_deadline: job.application_deadline || null,
          status: "open",
        })
        .select("id")
        .single();
      if (fallbackErr) {
        if (fallbackErr.code === "42P01" || /comm_jobs/i.test(fallbackErr.message)) {
          return {
            error:
              "Job tables are missing. Run supabase/migrations/003_community_feed_and_jobs.sql and 006_employer.sql.",
          };
        }
        return { error: fallbackErr.message };
      }
      revalidatePath("/employer/dashboard");
      revalidatePath("/community/jobs");
      revalidatePath("/placements");
      revalidatePath("/community/jobs/opportunities");
      return { success: true, id: fallback!.id as string };
    }
    if (error.code === "42501" || /policy|row-level security/i.test(error.message)) {
      return {
        error:
          "You don't have permission to post jobs. Ensure your account role is employer and migration 006_employer.sql is applied.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/employer/dashboard");
  revalidatePath("/employer/dashboard/jobs");
  revalidatePath("/community/jobs");
  revalidatePath("/community/jobs/opportunities");
  revalidatePath("/placements");
  return { success: true, id: data.id as string };
}

export async function updateJobStatus(jobId: string, status: "open" | "closed") {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("comm_jobs")
    .update({ status })
    .eq("id", jobId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/employer/dashboard");
  revalidatePath("/employer/dashboard/jobs");
  revalidatePath("/community/jobs");
  revalidatePath("/placements");
  return { success: true };
}

export async function updateEmployerApplicationStatus(
  applicationId: string,
  status: "submitted" | "shortlisted" | "interviewed" | "accepted" | "rejected"
) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };
  const supabase = await createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("comm_job_applications")
    .select("id, applicant_id, job_id, comm_jobs:job_id(user_id, title)")
    .eq("id", applicationId)
    .single();

  const job = existing?.comm_jobs as unknown as { user_id?: string; title?: string } | null;
  if (!existing || job?.user_id !== user.id) return { error: "Not authorized" };

  const { error } = await supabase
    .from("comm_job_applications")
    .update({ status })
    .eq("id", applicationId);
  if (error) return { error: error.message };

  await createNotification(existing.applicant_id, user.id, `application_${status}`);
  revalidatePath("/employer/dashboard");
  revalidatePath(`/employer/dashboard/applications/${applicationId}`);
  revalidatePath("/community/jobs/applications");
  return { success: true };
}

const OfferSchema = z.object({
  application_id: z.string().min(1),
  message: z.string().trim().min(10, "Offer message must be at least 10 characters"),
  compensation: z.string().trim().optional().or(z.literal("")),
  start_date: z.string().optional().or(z.literal("")),
});

export async function sendJobOffer(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = OfferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const d = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data: app } = await supabase
    .from("comm_job_applications")
    .select("id, applicant_id, job_id, comm_jobs:job_id(user_id, title)")
    .eq("id", d.application_id)
    .single();

  const job = app?.comm_jobs as unknown as { user_id?: string; title?: string } | null;
  if (!app || job?.user_id !== user.id) return { error: "Not authorized" };

  const { error } = await supabase.from("comm_job_offers").insert({
    application_id: d.application_id,
    job_id: app.job_id,
    employer_id: user.id,
    applicant_id: app.applicant_id,
    message: d.message,
    compensation: d.compensation || null,
    start_date: d.start_date || null,
    status: "pending",
  });

  if (error) {
    if (/comm_job_offers|relation .* does not exist/i.test(error.message)) {
      return {
        error: "Offers table missing. Run supabase/migrations/006_employer.sql.",
      };
    }
    return { error: error.message };
  }

  await supabase
    .from("comm_job_applications")
    .update({ status: "accepted" })
    .eq("id", d.application_id);

  await createNotification(app.applicant_id, user.id, "job_offer");
  revalidatePath(`/employer/dashboard/applications/${d.application_id}`);
  revalidatePath("/employer/dashboard");
  revalidatePath("/community/jobs/applications");
  return { success: true };
}

export async function markEmployerNotificationsRead() {
  const user = await getAuthUser();
  if (!user) return;
  const supabase = await createServerSupabaseClient();
  try {
    await supabase
      .from("comm_notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  } catch {
    /* ignore */
  }
  revalidatePath("/employer/dashboard/notifications");
}

export async function updateEmployerCompany(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = EmployerOnboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const d = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("employer_profiles")
    .update({
      company_name: d.company_name,
      company_logo_url: d.company_logo_url || null,
      email: d.email,
      website: d.website || null,
      location: d.location,
      location_type: d.location_type,
      company_size: d.company_size,
      pan_number: d.pan_number ? d.pan_number.toUpperCase() : null,
      about: d.about || null,
      sector: d.sector || null,
      hiring_contact_name: d.hiring_contact_name || null,
      phone: d.phone || null,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  await supabase
    .from("profiles")
    .update({
      email: d.email,
      full_name: d.hiring_contact_name || d.company_name,
      phone: d.phone || null,
      location: d.location,
      bio: d.about || null,
    })
    .eq("user_id", user.id);

  revalidatePath("/employer/dashboard/company");
  revalidatePath("/employer/dashboard");
  return { success: true };
}
