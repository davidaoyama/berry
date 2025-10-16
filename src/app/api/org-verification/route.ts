import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// PATCH endpoint to update organization verification status after email verification
export async function PATCH(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const { userId, status } = await request.json()

    if (!userId || !status) {
      return NextResponse.json(
        { message: "Missing userId or status" },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses = ['pending', 'email_verified', 'approved', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 }
      )
    }

    // Update organization verification status
    // NOTE: This assumes you've added user_id column to organizations table
    const { data, error } = await supabase
      .from('organizations')
      .update({ verification_status: status })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating verification status:', error)
      return NextResponse.json(
        { message: "Failed to update verification status", error: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { message: "Organization not found for this user" },
        { status: 404 }
      )
    }

    console.log('Organization verification status updated:', {
      org_id: data.id,
      user_id: userId,
      new_status: status
    })

    return NextResponse.json({
      success: true,
      message: "Verification status updated successfully",
      organization: {
        id: data.id,
        name: data.org_name,
        verification_status: data.verification_status
      }
    })

  } catch (error) {
    console.error('Error in org verification update:', error)
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}