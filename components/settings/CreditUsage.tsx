"use client"

import { useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const TIER_LIMITS: Record<string, number> = {
  starter: 300,
  professional: 500,
  growth: 800,
}

type Props = {
  subscriptionTier: string
}

export function CreditUsage({ subscriptionTier }: Props) {
  const [used, setUsed] = useState<number | null>(null)
  const limit = TIER_LIMITS[subscriptionTier] ?? 500

  useEffect(() => {
    fetch("/api/settings/credits")
      .then((r) => r.json())
      .then((data) => setUsed(data.used ?? 0))
      .catch(() => setUsed(0))
  }, [])

  const pct = used !== null ? Math.min((used / limit) * 100, 100) : 0

  function barColor() {
    if (pct >= 90) return "bg-red-500"
    if (pct >= 70) return "bg-amber-500"
    return "bg-emerald-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          WhatsApp Credit Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {used === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <p className="text-sm">
              <span className="font-semibold">{used.toLocaleString("en-US")}</span>
              {" / "}
              <span className="text-muted-foreground">
                {limit.toLocaleString("en-US")} conversations used this month
              </span>
            </p>

            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor()}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {Math.round(pct)}% of your{" "}
              <span className="capitalize font-medium">{subscriptionTier}</span> plan limit used.
              {pct >= 90 && (
                <span className="ml-1 text-red-600 font-medium">
                  Consider upgrading your plan.
                </span>
              )}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
