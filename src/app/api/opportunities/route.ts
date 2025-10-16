import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// US States for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

const VALID_CATEGORIES = [
  'stem_innovation',
  'arts_design',
  'humanities_social_sciences',
  'civic_engagement_leadership',
  'health_sports_sustainability',
  'business_entrepreneurship',
  'trades_technical'
]

const VALID_OPPORTUNITY_TYPES = [
  'program',
  'summer_opportunity',
  'internship',
  'mentorship',
  'volunteering'
]

const VALID_LOCATION_TYPES = ['online', 'in_person', 'hybrid']

const VALID_GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

export async function POST(request: NextRequest) {
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

    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authentication required. Please sign in." },
        { status: 401 }
      )
    }

    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { message: "Invalid or expired session. Please sign in again." },
        { status: 401 }
      )
    }

    // Verify user is from an approved organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, org_name, approved, verification_status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (orgError || !organization) {
      return NextResponse.json(
        { message: "No organization found for this account." },
        { status: 403 }
      )
    }

    if (!organization.approved || organization.verification_status !== 'approved') {
      return NextResponse.json(
        {
          message: "Your organization must be approved before posting opportunities.",
          verificationStatus: organization.verification_status,
          approved: organization.approved
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('Received opportunity submission:', {
      organizationId: organization.id,
      opportunityName: body.opportunityName,
      category: body.category,
      type: body.opportunityType
    })

    // Validate required fields
    const requiredFields = [
      'opportunityName',
      'category',
      'opportunityType',
      'locationType',
      'applicationDeadline',
      'briefDescription',
      'applicationUrl',
      'contactInfo'
    ]

    const missingFields = requiredFields.filter(field => !body[field] || (typeof body[field] === 'string' && body[field].trim() === ''))

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        },
        { status: 400 }
      )
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate opportunity type
    if (!VALID_OPPORTUNITY_TYPES.includes(body.opportunityType)) {
      return NextResponse.json(
        { message: `Invalid opportunity type. Must be one of: ${VALID_OPPORTUNITY_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate location type
    if (!VALID_LOCATION_TYPES.includes(body.locationType)) {
      return NextResponse.json(
        { message: `Invalid location type. Must be one of: ${VALID_LOCATION_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate location-specific requirements
    if ((body.locationType === 'in_person' || body.locationType === 'hybrid') && !body.locationAddress) {
      return NextResponse.json(
        { message: "Physical address is required for in-person and hybrid opportunities" },
        { status: 400 }
      )
    }

    // Validate state if provided
    if (body.locationState && !US_STATES.includes(body.locationState)) {
      return NextResponse.json(
        { message: `Invalid US state code: ${body.locationState}` },
        { status: 400 }
      )
    }

    // Validate dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const applicationDeadline = new Date(body.applicationDeadline)
    if (applicationDeadline < today) {
      return NextResponse.json(
        { message: "Application deadline must be in the future" },
        { status: 400 }
      )
    }

    if (body.startDate) {
      const startDate = new Date(body.startDate)
      if (startDate < today) {
        return NextResponse.json(
          { message: "Start date must be in the future" },
          { status: 400 }
        )
      }
    }

    if (body.startDate && body.endDate) {
      const startDate = new Date(body.startDate)
      const endDate = new Date(body.endDate)
      if (endDate < startDate) {
        return NextResponse.json(
          { message: "End date must be after start date" },
          { status: 400 }
        )
      }
    }

    // Validate GPA if provided
    if (body.minGpa !== null && body.minGpa !== undefined && body.minGpa !== '') {
      const gpa = parseFloat(body.minGpa)
      if (isNaN(gpa) || gpa < 0 || gpa > 5.0) {
        return NextResponse.json(
          { message: "Minimum GPA must be between 0 and 5.0" },
          { status: 400 }
        )
      }
    }

    // Validate age range if provided
    if (body.minAge !== null && body.minAge !== undefined && body.minAge !== '') {
      const minAge = parseInt(body.minAge)
      if (isNaN(minAge) || minAge < 0 || minAge > 100) {
        return NextResponse.json(
          { message: "Minimum age must be between 0 and 100" },
          { status: 400 }
        )
      }
    }

    if (body.maxAge !== null && body.maxAge !== undefined && body.maxAge !== '') {
      const maxAge = parseInt(body.maxAge)
      if (isNaN(maxAge) || maxAge < 0 || maxAge > 100) {
        return NextResponse.json(
          { message: "Maximum age must be between 0 and 100" },
          { status: 400 }
        )
      }
    }

    if (body.minAge && body.maxAge && parseInt(body.maxAge) < parseInt(body.minAge)) {
      return NextResponse.json(
        { message: "Maximum age must be greater than or equal to minimum age" },
        { status: 400 }
      )
    }

    // Validate grade levels if provided
    if (body.gradeLevels && Array.isArray(body.gradeLevels)) {
      const invalidGrades = body.gradeLevels.filter((grade: string) => !VALID_GRADE_LEVELS.includes(grade))
      if (invalidGrades.length > 0) {
        return NextResponse.json(
          { message: `Invalid grade levels: ${invalidGrades.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate cost
    const cost = parseFloat(body.cost || 0)
    if (isNaN(cost) || cost < 0) {
      return NextResponse.json(
        { message: "Cost must be a non-negative number (use 0 for free opportunities)" },
        { status: 400 }
      )
    }

    // Validate URL format
    const urlRegex = /^https?:\/\/.+/i
    if (!urlRegex.test(body.applicationUrl)) {
      return NextResponse.json(
        { message: "Application URL must be a valid URL starting with http:// or https://" },
        { status: 400 }
      )
    }

    // Build opportunity data object
    const opportunityData = {
      organization_id: organization.id,
      created_by: user.id,

      // Basic Info
      opportunity_name: body.opportunityName.trim(),
      brief_description: body.briefDescription.trim(),

      // Category & Type
      category: body.category,
      opportunity_type: body.opportunityType,

      // Duration
      start_date: body.startDate || null,
      end_date: body.endDate || null,

      // Location
      location_type: body.locationType,
      location_address: body.locationAddress?.trim() || null,
      location_state: body.locationState || null,

      // Requirements
      min_gpa: body.minGpa ? parseFloat(body.minGpa) : null,
      min_age: body.minAge ? parseInt(body.minAge) : null,
      max_age: body.maxAge ? parseInt(body.maxAge) : null,
      grade_levels: body.gradeLevels && body.gradeLevels.length > 0 ? body.gradeLevels : null,
      requirements_other: body.requirementsOther?.trim() || null,

      // Cost
      cost: cost,
      has_stipend: body.hasStipend || false,

      // Application
      application_deadline: body.applicationDeadline,
      application_url: body.applicationUrl.trim(),
      contact_info: body.contactInfo.trim(),

      // Status
      is_active: true
    }

    // Insert opportunity into database
    console.log('Inserting opportunity:', opportunityData)
    const { data: opportunity, error: insertError } = await supabase
      .from('opportunities')
      .insert([opportunityData])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting opportunity:', insertError)
      return NextResponse.json(
        {
          message: "Failed to create opportunity",
          error: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        },
        { status: 500 }
      )
    }

    console.log('Opportunity created successfully:', {
      id: opportunity.id,
      organization: organization.org_name,
      opportunityName: opportunity.opportunity_name
    })

    // TODO: Send confirmation email to organization
    // For now, just log that email should be sent
    console.log('TODO: Send confirmation email to organization contact')

    return NextResponse.json(
      {
        message: "Opportunity posted successfully! Students can now discover and apply.",
        opportunityId: opportunity.id,
        opportunityName: opportunity.opportunity_name,
        isActive: opportunity.is_active,
        createdAt: opportunity.created_at
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error processing opportunity submission:', error)
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve opportunities
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)

    // Build query based on filters
    let query = supabase
      .from('opportunities')
      .select(`
        *,
        organizations (
          id,
          org_name,
          org_type,
          website_url,
          official_email_domain
        )
      `)
      .eq('is_active', true)

    // Filter by category
    const category = searchParams.get('category')
    if (category) {
      query = query.eq('category', category)
    }

    // Filter by opportunity type
    const opportunityType = searchParams.get('type')
    if (opportunityType) {
      query = query.eq('opportunity_type', opportunityType)
    }

    // Filter by location type
    const locationType = searchParams.get('location_type')
    if (locationType) {
      query = query.eq('location_type', locationType)
    }

    // Filter by state
    const state = searchParams.get('state')
    if (state) {
      query = query.eq('location_state', state)
    }

    // Filter by cost (free, paid, or stipend)
    const costFilter = searchParams.get('cost')
    if (costFilter === 'free') {
      query = query.eq('cost', 0)
    } else if (costFilter === 'paid') {
      query = query.gt('cost', 0)
    } else if (costFilter === 'stipend') {
      query = query.eq('has_stipend', true)
    }

    // Order by deadline (soonest first)
    query = query.order('application_deadline', { ascending: true })

    const { data: opportunities, error } = await query

    if (error) {
      console.error('Error fetching opportunities:', error)
      return NextResponse.json(
        { message: "Error fetching opportunities" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        opportunities,
        count: opportunities?.length || 0
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET opportunities:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE endpoint for admin or org to delete opportunity
export async function DELETE(request: NextRequest) {
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

    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { message: "Invalid session" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const opportunityId = searchParams.get('id')

    if (!opportunityId) {
      return NextResponse.json(
        { message: "Opportunity ID is required" },
        { status: 400 }
      )
    }

    // Check if user is admin or opportunity owner
    const isAdmin = user.user_metadata?.role === 'admin'

    const { data: opportunity, error: fetchError } = await supabase
      .from('opportunities')
      .select('id, created_by, opportunity_name')
      .eq('id', opportunityId)
      .single()

    if (fetchError || !opportunity) {
      return NextResponse.json(
        { message: "Opportunity not found" },
        { status: 404 }
      )
    }

    // Verify permission
    if (!isAdmin && opportunity.created_by !== user.id) {
      return NextResponse.json(
        { message: "You don't have permission to delete this opportunity" },
        { status: 403 }
      )
    }

    // Soft delete: set is_active to false and track who deleted it
    const { error: deleteError } = await supabase
      .from('opportunities')
      .update({
        is_active: false,
        deleted_by: user.id,
        deleted_at: new Date().toISOString()
      })
      .eq('id', opportunityId)

    if (deleteError) {
      console.error('Error deleting opportunity:', deleteError)
      return NextResponse.json(
        { message: "Failed to delete opportunity" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: "Opportunity deleted successfully",
        deletedBy: isAdmin ? 'admin' : 'organization'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE opportunity:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}