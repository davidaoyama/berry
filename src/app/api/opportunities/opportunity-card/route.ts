import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/app/utils/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  // ensure authenticated (reuse server helper which awaits cookies)
  const serverSupabase = await createServerSupabase();
  const { data: userData, error: userErr } = await serverSupabase.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ message: "Server misconfigured" }, { status: 500 });
  }

  const svc = createServiceClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    // select additional fields you need — add/remove columns as required
    const { data, error } = await svc
      .from("opportunities")
      .select(
        `id,
         min_age,
         max_age,
         min_gpa,
         start_date,
         end_date,
         requirements_other,
         grade_levels,
         location_type,
         has_stipend,
         application_url,
         contact_info`
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching opportunity details:", error);
      return NextResponse.json({ message: "Failed to load opportunity" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Unexpected error in opportunity-card:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}