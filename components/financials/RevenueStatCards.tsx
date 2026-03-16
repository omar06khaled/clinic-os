"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import type { RevenueStats } from "@/app/api/financials/revenue/route"

interface Props {
  stats: RevenueStats
  prevStats: RevenueStats
}

type CardDef = {
  labelKey: string
  subtitleKey: string
  value: (s: RevenueStats) => string
  raw: (s: RevenueStats) => number
  higherIsBetter: boolean
}

const CARD_DEFS: CardDef[] = [
  {
    labelKey:    "statTotalRevenue",
    subtitleKey: "statTotalRevenueSubtitle",
    value: (s) => `${s.totalRevenue.toLocaleString("ar-EG")} ج.م`,
    raw:   (s) => s.totalRevenue,
    higherIsBetter: true,
  },
  {
    labelKey:    "statPatients",
    subtitleKey: "statPatientsSubtitle",
    value: (s) => s.totalAppointments.toLocaleString("ar-EG"),
    raw:   (s) => s.totalAppointments,
    higherIsBetter: true,
  },
  {
    labelKey:    "statCollectionRate",
    subtitleKey: "statCollectionRateSubtitle",
    value: (s) =>
      s.totalAppointments === 0
        ? "—"
        : `${s.collectionRate.toLocaleString("ar-EG")}%`,
    raw: (s) => s.collectionRate,
    higherIsBetter: true,
  },
  {
    labelKey:    "statReceivables",
    subtitleKey: "statReceivablesSubtitle",
    value: (s) => `${s.outstandingReceivables.toLocaleString("ar-EG")} ج.م`,
    raw:   (s) => s.outstandingReceivables,
    higherIsBetter: false,
  },
]

function Trend({
  current,
  previous,
  higherIsBetter,
}: {
  current: number
  previous: number
  higherIsBetter: boolean
}) {
  if (previous === 0 && current === 0) return null
  if (previous === 0)
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        —
      </span>
    )

  const pct = ((current - previous) / previous) * 100
  const isUp = pct > 0
  const isDown = pct < 0
  const isPositive = higherIsBetter ? isUp : isDown

  if (Math.abs(pct) < 0.05) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>0%</span>
      </span>
    )
  }

  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {isUp ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>{Math.abs(pct).toFixed(1)}%</span>
    </span>
  )
}

export function RevenueStatCards({ stats, prevStats }: Props) {
  const t = useTranslations("financials")

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {CARD_DEFS.map((card) => (
        <Card key={card.labelKey} className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t(card.subtitleKey)}</p>
            <p className="mt-1 text-xl font-bold tracking-tight">
              {card.value(stats)}
            </p>
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-xs font-medium text-foreground/70">
                {t(card.labelKey)}
              </p>
              <Trend
                current={card.raw(stats)}
                previous={card.raw(prevStats)}
                higherIsBetter={card.higherIsBetter}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
