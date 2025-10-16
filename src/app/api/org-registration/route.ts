import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          message: "Server configuration error: Missing Supabase environment variables"
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await request.json()
    console.log('Received organization registration:', body)

    // Validate required fields
    const requiredFields = [
      'organizationName',
      'organizationType',
      'website',
      'officialEmailDomain',
      'phoneNumber',
      'businessAddress',
      'contactName',
      'contactRole',
      'contactEmail',
      'businessId',
      'goalsDescription'
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
    if (!emailRegex.test(body.contactEmail)) {
      return NextResponse.json(
        { message: "Invalid contact email format" },
        { status: 400 }
      )
    }

    // Validate that contact email matches official domain
    const contactDomain = body.contactEmail.split('@')[1]?.toLowerCase()
    const officialDomain = body.officialEmailDomain.toLowerCase()

    if (contactDomain !== officialDomain) {
      return NextResponse.json(
        { message: `Contact email must use your official domain: @${body.officialEmailDomain}` },
        { status: 400 }
      )
    }

    // Validate type-specific requirements
    if (body.organizationType === 'university') {
      if (!body.ipeds && !body.officialEmailDomain.endsWith('.edu')) {
        return NextResponse.json(
          { message: "Universities must provide IPEDS/NCES ID or use a .edu email domain" },
          { status: 400 }
        )
      }
    }

    if (body.organizationType === 'business') {
      if (!body.ein || !body.businessLicense) {
        return NextResponse.json(
          { message: "Businesses must provide EIN and Business License Number" },
          { status: 400 }
        )
      }
    }

    if (body.organizationType === 'nonprofit') {
      if (!body.ein || !body.nonprofit501c3) {
        return NextResponse.json(
          { message: "Nonprofits must provide EIN and 501(c)(3) documentation" },
          { status: 400 }
        )
      }
    }

    // Validate business ID format
    if (body.businessId && body.businessId.trim().length < 3) {
      return NextResponse.json(
        { message: "Business ID must be at least 3 characters long" },
        { status: 400 }
      )
    }

    // Validate goals description length
    if (!body.goalsDescription || body.goalsDescription.length < 50) {
      return NextResponse.json(
        { message: "Goals description must be at least 50 characters" },
        { status: 400 }
      )
    }

    // Check if organization with this email or business ID already exists
    const { data: existingOrg, error: checkError } = await supabase
      .from('organizations')
      .select('id, org_email, contact_email, business_id')
      .or(`org_email.eq.${body.contactEmail},contact_email.eq.${body.contactEmail},business_id.eq.${body.businessId}`)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing organization:', checkError)
      return NextResponse.json(
        { message: "Error checking existing registrations" },
        { status: 500 }
      )
    }

    if (existingOrg) {
      let duplicateField = 'unknown'
      if (existingOrg.org_email === body.contactEmail || existingOrg.contact_email === body.contactEmail) {
        duplicateField = 'email'
      } else if (existingOrg.business_id === body.businessId) {
        duplicateField = 'business ID'
      }

      return NextResponse.json(
        { message: `An organization with this ${duplicateField} already exists` },
        { status: 409 }
      )
    }

    // Build verification documents JSON
    const verificationDocs: Record<string, string> = {}

    if (body.ein) verificationDocs.ein = body.ein
    if (body.ipeds) verificationDocs.ipeds = body.ipeds
    if (body.businessLicense) verificationDocs.businessLicense = body.businessLicense
    if (body.nonprofit501c3) verificationDocs.nonprofit501c3 = body.nonprofit501c3

    // Create the organization record with all new fields
    const organizationData = {
      // Basic info
      org_name: body.organizationName,
      org_type: body.organizationType,
      business_id: body.businessId,

      // Contact info
      org_email: body.contactEmail, // Using contact email as the main org email
      org_phone: body.phoneNumber,

      // New fields
      website_url: body.website,
      official_email_domain: body.officialEmailDomain,
      business_address: body.businessAddress,
      linkedin_url: body.linkedinUrl || null,

      contact_name: body.contactName,
      contact_role: body.contactRole,
      contact_email: body.contactEmail,

      verification_docs: verificationDocs,
      goals_description: body.goalsDescription,

      // Legacy field (keep for backward compatibility)
      org_description: body.goalsDescription,

      // Status fields
      verification_status: 'pending',
      approved: false
    }

    // Insert into Supabase
    console.log('Inserting organization:', organizationData)
    const { data, error } = await supabase
      .from('organizations')
      .insert([organizationData])
      .select()
      .single()

    if (error) {
      console.error('Error inserting organization:', error)
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

    console.log('Organization registered successfully:', {
      id: data.id,
      org_name: data.org_name,
      contact_email: data.contact_email,
      verification_status: data.verification_status
    })

    // Create auth.users account for the organization
    // NOTE: This requires Supabase Service Role Key for admin.createUser
    try {
      let authUserId: string | null = null

      // Try to create new auth user
      // If user already exists, createUser will return an error
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: body.contactEmail,
        email_confirm: false, // User must verify email via magic link
        user_metadata: {
          role: 'org',
          org_name: body.organizationName,
          org_id: data.id,
          contact_name: body.contactName,
          contact_role: body.contactRole
        }
      })

      if (authError) {
        // Check if error is because user already exists
        if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
          console.log('User with this email already exists - will send magic link')
          // User exists, just send magic link
          const { error: magicLinkError } = await supabase.auth.signInWithOtp({
            email: body.contactEmail,
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify`
            }
          })

          if (magicLinkError) {
            console.error('Error sending magic link to existing user:', magicLinkError)
          } else {
            console.log('Magic link sent to existing user:', body.contactEmail)
          }
        } else {
          console.error('Error creating auth user:', authError)
          // Don't fail the whole request - org is still saved
        }
      } else if (authData.user) {
        authUserId = authData.user.id
        console.log('Auth user created successfully:', authData.user.id)

        // Update organizations table with user_id
        // NOTE: This requires user_id column in organizations table (run migration first!)
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ user_id: authUserId })
          .eq('id', data.id)

        if (updateError) {
          console.error('Error linking user_id to organization:', updateError)
        }

        // Send magic link for email verification
        const { error: magicLinkError } = await supabase.auth.signInWithOtp({
          email: body.contactEmail,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify`
          }
        })

        if (magicLinkError) {
          console.error('Error sending magic link:', magicLinkError)
        } else {
          console.log('Magic link sent to:', body.contactEmail)
        }
      }
    } catch (authErr) {
      console.error('Error in auth account creation:', authErr)
      // Continue - organization is still registered, just no auth account yet
    }

    return NextResponse.json(
      {
        message: "Registration submitted successfully. Please check your email to verify your address.",
        organizationId: data.id,
        verificationStatus: "pending",
        nextSteps: [
          "Check your email and verify your address",
          "Our team will review your application",
          "You'll receive approval notification within 2-3 business days",
          "Once approved, you can sign in and start posting opportunities"
        ]
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
      .select('id, org_name, contact_email, verification_status, approved, created_at')

    if (organizationId) {
      query = query.eq('id', organizationId)
    } else if (email) {
      query = query.eq('contact_email', email)
    }

    const { data: organization, error } = await query.maybeSingle()

    if (error) {
      console.error('Error fetching organization:', error)
      return NextResponse.json(
        { message: "Error fetching organization data" },
        { status: 500 }
      )
    }

    if (!organization) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        id: organization.id,
        name: organization.org_name,
        email: organization.contact_email,
        verificationStatus: organization.verification_status,
        approved: organization.approved,
        submittedAt: organization.created_at,
        message: organization.approved
          ? 'Your organization has been approved and can now create opportunities.'
          : organization.verification_status === 'email_verified'
            ? 'Your email is verified. Your application is under admin review.'
            : 'Your registration is pending. Please check your email for verification.'
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
