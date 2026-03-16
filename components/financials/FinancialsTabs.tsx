"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

const TABS: { href: string; tKey: string }[] = [
  { href: "/financials/revenue",  tKey: "tabRevenue"  },
  { href: "/financials/expenses", tKey: "tabExpenses" },
  { href: "/financials/pl",       tKey: "tabPL"       },
]

export function FinancialsTabs() {
  const t = useTranslations("financials")
  const pathname = usePathname()

  return (
    <div className="border-b bg-card px-4 md:px-6 pt-4">
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map(({ href, tKey }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative px-4 py-2 text-xs sm:text-sm font-medium transition-colors rounded-t-md whitespace-nowrap",
                active
                  ? "text-primary border-b-2 border-primary -mb-px bg-transparent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {t(tKey)}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
