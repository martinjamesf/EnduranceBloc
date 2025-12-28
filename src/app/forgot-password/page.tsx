"use client"

import React, { useState } from "react"
import Input from "../../components/Inputs/Input"
import Button from "../../components/Buttons/Button"
import Link from "next/link"
import { supabase } from "../../lib/supabaseClient"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        setMessage("If an account with that email exists, you’ll receive password reset instructions shortly.")
      }
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-24 px-4">
      <div className="w-full max-w-[526px]">
        <h1 className="text-[52px] font-semibold tracking-[-2px] text-[#090914]">Reset password</h1>
        <p className="mt-4 text-[#52525b]">Enter your email and we’ll send reset instructions.</p>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm text-slate-800 mb-2">Email address</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg h-14 px-4"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <div>
            <Button className="h-[55px] w-[240px] bg-primaryNavy rounded-md text-white">{loading ? "Sending..." : "Send reset link"}</Button>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Remembered? <Link href="/login" className="text-primaryNavy">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
