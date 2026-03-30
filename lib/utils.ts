import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Default display currency: Indian Rupee
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

// For international clients — display in their own currency
export function formatCurrencyIntl(amount: number, currency: string = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return formatCurrency(amount)
  }
}

export const CURRENCIES = [
  { code: "INR", label: "₹ Indian Rupee (INR)" },
  { code: "USD", label: "$ US Dollar (USD)" },
  { code: "EUR", label: "€ Euro (EUR)" },
  { code: "GBP", label: "£ British Pound (GBP)" },
  { code: "AED", label: "د.إ UAE Dirham (AED)" },
  { code: "SGD", label: "S$ Singapore Dollar (SGD)" },
  { code: "AUD", label: "A$ Australian Dollar (AUD)" },
  { code: "CAD", label: "C$ Canadian Dollar (CAD)" },
  { code: "JPY", label: "¥ Japanese Yen (JPY)" },
  { code: "SAR", label: "﷼ Saudi Riyal (SAR)" },
]

function toValidDate(date: Date | string | any): Date {
  if (date && typeof date === "object" && "seconds" in date) {
    return new Date(date.seconds * 1000)
  }
  const d = new Date(date)
  return isNaN(d.getTime()) ? new Date() : d
}

export function formatDate(date: Date | string): string {
  return format(toValidDate(date), "MMM dd, yyyy")
}

export function formatDateTime(date: Date | string): string {
  return format(toValidDate(date), "MMM dd, yyyy HH:mm")
}

export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export function generateInvoiceNo(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `INV-${year}-${random}`
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "")
}
