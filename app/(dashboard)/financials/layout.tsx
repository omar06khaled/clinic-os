"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/financials/revenue",  label: "الإيرادات"       },
  { href: "/financials/expenses", label: "المصروفات"       },
  { href: "/financials/pl",       label: "الأرباح والخسائر" },
] as const

export default function FinancialsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="border-b bg-card px-4 md:px-6 pt-4" dir="rtl">
        <div className="flex gap-1">
          {TABS.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors rounded-t-md",
                  active
                    ? "text-primary border-b-2 border-primary -mb-px bg-transparent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
