import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// GET endpoint to check organization approval status by user_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get organization by user_id
    // NOTE: This assumes you've added user_id column to organizations table
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('id, org_name, approved, verification_status, created_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching organization status:', error)
      return NextResponse.json(
        { message: "Error fetching organization status" },
        { status: 500 }
      )
    }

    if (!organization) {
      return NextResponse.json(
        { message: "No organization found for this user", exists: false },
        { status: 404 }
      )
    }

    // Determine status message
    let statusMessage = ''
    if (organization.approved) {
      statusMessage = 'Your organization is approved and active'
    } else if (organization.verification_status === 'email_verified') {
      statusMessage = 'Email verified. Your application is under review by admins.'
    } else if (organization.verification_status === 'pending') {
      statusMessage = 'Please verify your email to continue'
    } else if (organization.verification_status === 'rejected') {
      statusMessage = 'Your application was not approved'
    }

    return NextResponse.json({
      exists: true,
      id: organization.id,
      orgName: organization.org_name,
      approved: organization.approved,
      verificationStatus: organization.verification_status,
      createdAt: organization.created_at,
      statusMessage
    })

  } catch (error) {
    console.error('Error in GET org status:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}