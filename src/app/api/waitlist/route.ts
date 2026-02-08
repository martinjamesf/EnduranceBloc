import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type SupabaseError = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

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

    const normalizedEmail = String(email).trim().toLowerCase()

    // Ensure env is configured
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) {
      console.error('Waitlist misconfig: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return NextResponse.json(
        { error: 'Server not configured. Please try again later.' },
        { status: 500 }
      )
    }

    // Initialize Supabase client (use anon key for public signup)
    const supabase =
      supabaseAdmin ??
      createClient(url, anon, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

    // Check existing first to provide friendly 409 without relying on PG code
    const { data: existing, error: selectError } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (selectError) {
      const error = selectError as SupabaseError
      console.error('Waitlist select error:', error)
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Waitlist not configured. Please try again later.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Email already on waitlist', isDuplicate: true },
        { status: 409 }
      )
    }

    // Try to insert into waitlist
    const { error } = await supabase
      .from('waitlist')
      .insert({
        email: normalizedEmail,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      })

    if (error) {
      const supabaseError = error as SupabaseError
      console.error('Waitlist insert error:', supabaseError)
      if (supabaseError.code === '23505') {
        return NextResponse.json(
          { error: 'Email already on waitlist', isDuplicate: true },
          { status: 409 }
        )
      }
      if (supabaseError.code === '42P01') {
        return NextResponse.json(
          { error: 'Waitlist not configured. Please try again later.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
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
