import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Initialize Supabase client (use anon key for public signup)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

    // Try to insert into waitlist
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      })
      .select()

    if (error) {
      // Check if it's a duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Email already on waitlist', isDuplicate: true },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(
      { success: true, message: 'You\'ve been added to the waitlist!' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
