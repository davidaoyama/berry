import { NextResponse } from "next/server";
// use server helper that awaits cookies()
import { createClient as createServerSupabase } from "@/app/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  // create server supabase client using your helper (it awaits cookies())
  const serverSupabase = await createServerSupabase();

  // Authenticate the user server-side (verifies with Supabase)
  const { data: userData, error: userErr } = await serverSupabase.auth.getUser();
  if (userErr || !userData?.user) {
    console.error("Unauthorized or error getting user", userErr);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // create service-role client (server-only). Must exist in env.
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
    return NextResponse.json({ message: "Server misconfigured" }, { status: 500 });
  }
  const svc = createServiceClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    // pagination
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || "50")));
    const from = (page - 1) * pageSize;
    const to = page * pageSize - 1;

    // fetch all opportunities ordered by soonest application_deadline
    const { data: opportunitiesRaw, error: oppError } = await svc
      .from("opportunities")
      .select(
        "id, opportunity_name, brief_description, category, opportunity_type, application_deadline, organization_id"
      )
      .order("application_deadline", { ascending: true })
      .range(from, to);

    if (oppError) {
      console.error("Error fetching opportunities:", oppError);
      return NextResponse.json({ message: "Failed to load opportunities" }, { status: 500 });
    }

    const opportunitiesList = Array.isArray(opportunitiesRaw) ? opportunitiesRaw : [];

    // Collect unique organization ids referenced by the opportunities
    const orgIds = Array.from(new Set(opportunitiesList.map((o: any) => o.organization_id).filter(Boolean)));

    // Fetch organization names in one query
    let orgs: any[] = [];
    if (orgIds.length) {
      const { data: orgRows, error: orgErr } = await svc
        .from("organizations")
        .select("id, org_name")
        .in("id", orgIds);

      if (orgErr) {
        console.error("Error fetching organizations:", orgErr);
      } else {
        orgs = orgRows ?? [];
      }
    }

    const orgMap = new Map<string, string | null>(orgs.map((r: any) => [r.id, r.org_name ?? null]));

    // Attach org_name to each opportunity
    const opportunities = opportunitiesList.map((o: any) => ({
      ...o,
      org_name: o.organization_id ? orgMap.get(o.organization_id) ?? null : null,
    }));

    console.log(`student-explore: returned=${opportunities.length} page=${page} pageSize=${pageSize}`);

    return NextResponse.json({
      data: opportunities,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("Unexpected error in student-explore:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}