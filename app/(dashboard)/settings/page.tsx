"use client"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { getInitials } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Sun, Moon, Shield, User, Palette } from "lucide-react"

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const { register, handleSubmit } = useForm({ defaultValues: { name: session?.user?.name || "", email: session?.user?.email || "" } })

  const onSubmit = (data: any) => {
    toast({ title: "Settings saved", description: "Your profile has been updated." })
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl md:text-2xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm md:text-base flex items-center gap-2"><User className="w-4 h-4" /> Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 md:gap-4 mb-6">
            <Avatar className="w-12 h-12 md:w-16 md:h-16 shrink-0">
              <AvatarFallback className="text-lg md:text-xl">{getInitials(session?.user?.name || "U")}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold truncate">{session?.user?.name}</p>
              <p className="text-sm text-muted-foreground truncate">{session?.user?.email}</p>
              <Badge className="mt-1 text-xs" variant="outline">{session?.user?.role}</Badge>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input {...register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input {...register("email")} type="email" />
              </div>
            </div>
            <Button type="submit" size="sm">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm md:text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="gap-2 flex-1 sm:flex-none"
              >
                <Sun className="w-4 h-4" /> Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="gap-2 flex-1 sm:flex-none"
              >
                <Moon className="w-4 h-4" /> Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm md:text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => toast({ title: "Password updated" })}>
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 md:p-5">
          <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Platform</p>
              <p className="font-medium text-sm">Veliora ClientHub v1.0</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Stack</p>
              <p className="font-medium text-sm">Next.js · Firebase</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Company</p>
              <p className="font-medium text-sm">Veliora TechWorks</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Role</p>
              <p className="font-medium text-sm capitalize">{session?.user?.role?.toLowerCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
