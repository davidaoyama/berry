import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client inside the function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    console.log('Environment check:')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Missing')

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          message: "Server configuration error: Missing Supabase environment variables",
          debug: {
            supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
            supabaseKey: supabaseKey ? 'Set' : 'Missing'
          }
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Check environment variables
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing')
    
    const body = await request.json()
    console.log('Received form data:', body)
    
    // Validate required fields
    const requiredFields = [
      'organizationName',
      'organizationType', 
      'businessId',
      'description',
      'email',
      'phoneNumber'
    ]

    const missingFields = requiredFields.filter(field => !body[field] || body[field].trim() === '')
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      )
    }

    // Validate business ID format (basic validation)
    if (body.businessId && body.businessId.trim().length < 3) {
      return NextResponse.json(
        { message: "Business ID must be at least 3 characters long" },
        { status: 400 }
      )
    }

    // Check if organization with this email or business ID already exists
    const { data: existingOrg, error: checkError } = await supabase
      .from('organizations')
      .select('id, org_email, business_id')
      .or(`org_email.eq.${body.email},business_id.eq.${body.businessId}`)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing organization:', checkError)
      return NextResponse.json(
        { message: "Error checking existing registrations" },
        { status: 500 }
      )
    }

    if (existingOrg) {
      const duplicateField = existingOrg.org_email === body.email ? 'email' : 'business ID'
      return NextResponse.json(
        { message: `An organization with this ${duplicateField} already exists` },
        { status: 409 }
      )
    }

    // Create the organization record for Supabase with correct column names
    const organizationData = {
      org_name: body.organizationName,
      org_type: body.organizationType,
      business_id: body.businessId,
      org_description: body.description,
      org_email: body.email,
      org_phone: body.phoneNumber,
      approved: false
    }

    // Insert into Supabase
    console.log('About to insert:', organizationData)
    const { data, error } = await supabase
      .from('organizations')
      .insert([organizationData])
      .select()
      .single()

    console.log('Insert response:', { data, error })

    if (error) {
      console.error('Error inserting organization:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      return NextResponse.json(
        { 
          message: "Failed to save organization registration",
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    console.log('New organization registration saved:', {
      id: data.id,
      org_name: data.org_name,
      org_email: data.org_email,
      created_at: data.created_at
    })

    return NextResponse.json(
      { 
        message: "Registration submitted successfully",
        organizationId: data.id,
        status: "pending_approval"
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error processing organization registration:', error)
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve organization status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('id')
  const email = searchParams.get('email')

  if (!organizationId && !email) {
    return NextResponse.json(
      { message: "Organization ID or email is required" },
      { status: 400 }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { message: "Server configuration error: Missing Supabase environment variables" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let query = supabase
      .from('organizations')
      .select('id, org_name, org_email, approved, created_at')

    if (organizationId) {
      query = query.eq('id', organizationId)
    } else if (email) {
      query = query.eq('org_email', email)
    }

    const { data: organization, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { message: "Organization not found" },
          { status: 404 }
        )
      }
      console.error('Error fetching organization:', error)
      return NextResponse.json(
        { message: "Error fetching organization data" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        id: organization.id,
        name: organization.org_name,
        email: organization.org_email,
        approved: organization.approved,
        status: organization.approved ? 'approved' : 'pending_approval',
        submittedAt: organization.created_at,
        message: organization.approved 
          ? 'Your organization has been approved and can now create opportunities.'
          : 'Your registration is currently under review. You will be contacted once approved.'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET organization:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
