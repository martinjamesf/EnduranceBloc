"use client"

import React, { useState } from "react"
import { usePageAnalytics } from "@/lib/analytics/usePageAnalytics"
import Link from "next/link"
import { supabase } from "../../../lib/supabaseClient"

export default function ForgotPasswordPage() {
  usePageAnalytics('forgotPassword')
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email")
      return
    }

    setLoading(true)
    try {
      // Support different Supabase client versions - use any to be flexible
      let res: any
      if (typeof (supabase as any).auth.resetPasswordForEmail === "function") {
        res = await (supabase as any).auth.resetPasswordForEmail(email)
      } else if ((supabase as any).auth.api && typeof (supabase as any).auth.api.resetPasswordForEmail === "function") {
        res = await (supabase as any).auth.api.resetPasswordForEmail(email)
      }

      if (res?.error) {
        setError(res.error.message)
      } else {
        setMessage("If an account with that email exists, you'll receive password reset instructions shortly.")
      }
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1D35] via-[#1a2f4a] to-[#0D1D35] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#0D1D35] mb-2">Reset your password</h1>
            <p className="text-slate-600">Enter your email and we'll send reset instructions</p>
          </div>

          {message ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 flex items-start gap-2">
                  <span className="text-lg">✅</span>
                  <span>{message}</span>
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">Check your email for the reset link.</p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-full h-12 bg-[#0D1D35] hover:bg-[#1a2f4a] text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D1D35] focus:ring-offset-2"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearError()
                  }}
                  placeholder="you@example.com"
                  disabled={loading}
                  aria-invalid={!!error}
                  aria-describedby={error ? "email-error" : undefined}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg h-12 px-4 focus:ring-2 focus:ring-[#0D1D35] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {error && (
                  <p id="email-error" className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span> {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#0D1D35] hover:bg-[#1a2f4a] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0D1D35] focus:ring-offset-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send reset link"
                )}
              </button>

              <div className="text-center text-sm text-slate-500 pt-2">
                🔒 Your data is encrypted and secure
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="text-[#0D1D35] font-medium hover:text-[#FF7A00] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D1D35] focus:ring-offset-2 rounded px-1"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
