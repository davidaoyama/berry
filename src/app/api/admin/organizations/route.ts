import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { message: "Server configuration error: Missing Supabase environment variables" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all organizations
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json(
        { 
          message: "Failed to fetch organizations",
          error: error.message
        },
        { status: 500 }
      )
    }

    // Separate pending and approved organizations
    const pendingOrgs = organizations.filter(org => !org.approved)
    const approvedOrgs = organizations.filter(org => org.approved)

    return NextResponse.json({
      pending: pendingOrgs,
      approved: approvedOrgs,
      total: organizations.length
    })

  } catch (error) {
    console.error('Error in GET organizations:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { message: "Server configuration error: Missing Supabase environment variables" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const body = await request.json()
    
    const { organizationId, approved } = body

    if (!organizationId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { message: "Organization ID and approved status are required" },
        { status: 400 }
      )
    }

    // Update organization approval status
    const { data, error } = await supabase
      .from('organizations')
      .update({ approved })
      .eq('id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization:', error)
      return NextResponse.json(
        { 
          message: "Failed to update organization",
          error: error.message
        },
        { status: 500 }
      )
    }

    console.log(`Organization ${organizationId} ${approved ? 'approved' : 'unapproved'} by admin`)

    return NextResponse.json({
      message: `Organization ${approved ? 'approved' : 'unapproved'} successfully`,
      organization: data
    })

  } catch (error) {
    console.error('Error in PATCH organizations:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
