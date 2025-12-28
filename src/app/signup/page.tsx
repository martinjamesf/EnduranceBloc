"use client"

import React, { useState } from "react"
import Input from "../../components/Inputs/Input"
import Button from "../../components/Buttons/Button"
import Link from "next/link"
import { supabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function SignupPage() {
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validate()) return

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

      // On success, redirect to home or a welcome page
      router.push("/")
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-24 px-4">
      <div className="w-full max-w-[526px]">
        <h1 className="text-[52px] font-semibold tracking-[-2px] text-[#090914]">Start Blocking Time</h1>
        <p className="mt-4 text-[#52525b]">"Don't have an account yet? Sign up to get started."</p>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm text-slate-800 mb-2">Full name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              aria-invalid={!!fieldErrors.fullName}
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg h-14 px-4"
            />
            {fieldErrors.fullName && <p className="text-sm text-red-500 mt-1">{fieldErrors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-800 mb-2">Email address</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              aria-invalid={!!fieldErrors.email}
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg h-14 px-4"
            />
            {fieldErrors.email && <p className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm text-slate-800 mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-invalid={!!fieldErrors.password}
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg h-14 px-4"
            />
            {fieldErrors.password && <p className="text-sm text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 border rounded"
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-sm text-primaryNavy">
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div>
            <Button className="h-[55px] w-[160px] bg-primaryNavy rounded-md text-white">
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Already have an account? <Link href="/login" className="text-primaryNavy">log in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
