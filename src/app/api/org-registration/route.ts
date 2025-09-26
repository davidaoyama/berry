import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'organizationName',
      'organizationType', 
      'contactPersonName',
      'contactEmail',
      'contactPhone',
      'city',
      'state',
      'description',
      'servicesOffered',
      'businessId'
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

    // Validate grades served
    if (!body.gradesServed || !Array.isArray(body.gradesServed) || body.gradesServed.length === 0) {
      return NextResponse.json(
        { message: "Please select at least one grade level served" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.contactEmail)) {
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

    // Create the organization registration record
    const registrationData = {
      ...body,
      submittedAt: new Date().toISOString(),
      status: 'pending_review',
      id: generateRegistrationId()
    }

    // In a real application, you would save this to a database
    // For now, we'll log it and simulate success
    console.log('New organization registration received:', {
      id: registrationData.id,
      organizationName: registrationData.organizationName,
      contactEmail: registrationData.contactEmail,
      submittedAt: registrationData.submittedAt
    })

    // TODO: Save to database
    // await saveOrganizationRegistration(registrationData)

    // TODO: Send notification email to admins
    // await sendAdminNotification(registrationData)

    // TODO: Send confirmation email to organization
    // await sendConfirmationEmail(registrationData)

    return NextResponse.json(
      { 
        message: "Registration submitted successfully",
        registrationId: registrationData.id,
        status: "pending_review"
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error processing organization registration:', error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

// Generate a unique registration ID
function generateRegistrationId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `ORG-${timestamp}-${randomStr}`.toUpperCase()
}

// GET endpoint to retrieve registration status (for future use)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const registrationId = searchParams.get('id')

  if (!registrationId) {
    return NextResponse.json(
      { message: "Registration ID is required" },
      { status: 400 }
    )
  }

  // TODO: Implement database lookup
  // const registration = await getOrganizationRegistration(registrationId)
  
  // For now, return a mock response
  return NextResponse.json(
    {
      id: registrationId,
      status: 'pending_review',
      submittedAt: new Date().toISOString(),
      message: 'Your registration is currently under review. You will be contacted within 5-7 business days.'
    },
    { status: 200 }
  )
}
