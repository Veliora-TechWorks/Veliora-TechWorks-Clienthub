import type { Metadata, Viewport } from "next"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-poppins" })

export const metadata: Metadata = {
  title: "Veliora TechWorks CMS",
  description: "CRM & Project Management Platform by Veliora TechWorks",
  icons: {
    icon: "/images/Favicon_With_Background.jpg",
    apple: "/images/Favicon_With_Background.jpg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-body antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
