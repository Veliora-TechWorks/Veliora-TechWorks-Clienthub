"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react"

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const result = await signIn("credentials", { ...data, redirect: false })
    setLoading(false)
    if (result?.error) {
      toast({ title: "Login failed", description: "Invalid email or password", variant: "destructive" })
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Mobile-only brand header */}
      <div className="lg:hidden text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl mb-4 overflow-hidden bg-black">
          <img
            src="/images/Favicon_With_Background.jpg"
            alt="Veliora Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Veliora TechWorks CMS</h2>
        <p className="text-muted-foreground text-sm mt-1">Client Management System</p>
      </div>

      {/* Heading */}
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-2xl font-heading font-bold text-foreground">Welcome back 👋</h1>
        <p className="text-muted-foreground text-sm mt-1.5">Sign in to your workspace to continue</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              {...register("email")}
              className="pl-10 h-11 bg-background border-border focus-visible:ring-[#ecc94b] focus-visible:border-[#ecc94b]"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <button type="button" className="text-xs text-[#b7950b] hover:text-[#ecc94b] font-medium transition-colors">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className="pl-10 pr-10 h-11 bg-background border-border focus-visible:ring-[#ecc94b] focus-visible:border-[#ecc94b]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11 mt-2 bg-[#ecc94b] hover:bg-[#d4b03a] text-[#212529] font-semibold text-sm shadow-lg shadow-[#ecc94b]/20 transition-all hover:shadow-[#ecc94b]/30 hover:-translate-y-0.5"
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
          ) : (
            "Sign In to Dashboard →"
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-8">
        Protected by{" "}
        <span className="font-semibold text-foreground">Veliora TechWorks CMS</span>
        {" "}· All rights reserved
      </p>
    </div>
  )
}
