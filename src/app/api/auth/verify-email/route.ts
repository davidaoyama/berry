import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// In-memory store for verification codes (use Redis/Database in production)
const verificationCodes = new Map<string, { code: string; expires: number; verified: boolean }>()

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, action, code } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if email domain is allowed
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || []
    const emailDomain = email.split('@')[1]
    
    if (!allowedDomains.includes(emailDomain)) {
      return NextResponse.json({ 
        error: `Email domain @${emailDomain} is not authorized. Please use an email from: ${allowedDomains.map(d => '@' + d).join(', ')}` 
      }, { status: 403 })
    }

    if (action === 'send') {
      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

      // Store verification code
      verificationCodes.set(email, { code: verificationCode, expires, verified: false })

      // Send email
      const transporter = createTransporter()
      
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@berry.com',
          to: email,
          subject: 'Berry - Email Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4F46E5; margin: 0;">Berry</h1>
              </div>
              
              <h2 style="color: #1F2937; margin-bottom: 20px;">Verify Your Email Address</h2>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.5;">
                Welcome to Berry! To complete your account setup, please enter the verification code below:
              </p>
              
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                <h1 style="color: #1F2937; font-size: 36px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${verificationCode}
                </h1>
              </div>
              
              <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <p style="color: #92400E; margin: 0; font-size: 14px;">
                  ⏰ This code will expire in 10 minutes for security purposes.
                </p>
              </div>
              
              <p style="color: #6B7280; font-size: 14px; line-height: 1.5;">
                If you didn't request this verification code, please ignore this email. Your account security is important to us.
              </p>
              
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
              
              <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                This email was sent by Berry. Please do not reply to this email.
              </p>
            </div>
          `,
        })

        return NextResponse.json({ 
          message: 'Verification code sent successfully',
          expires: expires 
        })
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        return NextResponse.json({ 
          error: 'Failed to send verification email. Please try again.' 
        }, { status: 500 })
      }
    }

    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
      }

      const stored = verificationCodes.get(email)
      
      if (!stored) {
        return NextResponse.json({ error: 'No verification code found. Please request a new code.' }, { status: 404 })
      }

      if (Date.now() > stored.expires) {
        verificationCodes.delete(email)
        return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 })
      }

      if (stored.code !== code) {
        return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 400 })
      }

      // Mark as verified
      stored.verified = true
      verificationCodes.set(email, stored)

      // Clean up after successful verification
      setTimeout(() => {
        verificationCodes.delete(email)
      }, 60000) // Clean up after 1 minute

      return NextResponse.json({ 
        message: 'Email verified successfully',
        verified: true 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const stored = verificationCodes.get(email)
  
  return NextResponse.json({
    hasCode: !!stored,
    verified: stored?.verified || false,
    expired: stored ? Date.now() > stored.expires : false
  })
}