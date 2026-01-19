"use client"

import React, { useState } from "react"
import { usePageAnalytics } from "@/lib/analytics/usePageAnalytics"
import Link from "next/link"
import { supabase, isSupabaseConfigured } from "../../../lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  usePageAnalytics('signup')
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; email?: string; password?: string }>({})

  const validate = () => {
    const errs: { fullName?: string; email?: string; password?: string } = {}
    if (!fullName.trim()) errs.fullName = "Full name is required"
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errs.email = "Please enter a valid email"
    if (password.length < 8) errs.password = "Password must be at least 8 characters"
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    if (!isSupabaseConfigured) {
      setError(
        'Signup is temporarily unavailable: Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the dev server.'
      )
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await (supabase as any).auth.signUp({ email, password })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // Create a profile row so the app has a profile to reference
      const profilePayload: any = { name: fullName, email }
      if (data?.user?.id) profilePayload.id = data.user.id
      const { error: profileError } = await supabase.from("profiles").insert([profilePayload])
      if (profileError) {
        // Not fatal, but surface the error
        setError(profileError.message)
      }

      // On success, redirect to week view
      router.push("/calendar?view=week")
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
            <h1 className="text-3xl font-bold text-[#0D1D35] mb-2">Create your account</h1>
            <p className="text-slate-600">Start planning your training schedule</p>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Supabase is not configured. Please set <span className="font-semibold">NEXT_PUBLIC_SUPABASE_URL</span> and
                <span className="font-semibold"> NEXT_PUBLIC_SUPABASE_ANON_KEY</span> in your <span className="font-mono">.env.local</span> and restart the dev server.
              </p>
            </div>
          )}

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  clearFieldError("fullName")
                }}
                placeholder="John Doe"
                disabled={loading}
                aria-invalid={!!fieldErrors.fullName}
                aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg h-12 px-4 focus:ring-2 focus:ring-[#0D1D35] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {fieldErrors.fullName && (
                <p id="fullName-error" className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.fullName}
                </p>
              )}
            </div>

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
                  clearFieldError("email")
                }}
                placeholder="you@example.com"
                disabled={loading}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg h-12 px-4 focus:ring-2 focus:ring-[#0D1D35] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearFieldError("password")
                }}
                placeholder="••••••••"
                disabled={loading}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg h-12 px-4 focus:ring-2 focus:ring-[#0D1D35] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {fieldErrors.password && (
                <p id="password-error" className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 border-slate-300 rounded text-[#0D1D35] focus:ring-2 focus:ring-[#0D1D35] disabled:opacity-50"
              />
              <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">
                I agree to the{" "}
                <a href="/terms" className="text-[#0D1D35] hover:text-[#FF7A00] transition-colors">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-[#0D1D35] hover:text-[#FF7A00] transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <span>⚠️</span> {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full h-12 bg-[#0D1D35] hover:bg-[#1a2f4a] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0D1D35] focus:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>

            <div className="text-center text-sm text-slate-500 pt-2">
              🔒 Your data is encrypted and secure
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
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
