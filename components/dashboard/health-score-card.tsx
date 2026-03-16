import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface HealthScoreCardProps {
  score: number
  fillRate: number
  paymentRate: number
  noshowRate: number
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400"
  if (score >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

interface MetricRowProps {
  label: string
  value: number
  /** If true, lower is better (e.g. no-show rate) */
  inverted?: boolean
}

function MetricRow({ label, value, inverted = false }: MetricRowProps) {
  const isGood = inverted ? value <= 20 : value >= 70
  const isOk = inverted ? value <= 40 : value >= 50
  const barColor = isGood
    ? "bg-green-500"
    : isOk
      ? "bg-amber-500"
      : "bg-red-500"
  const barWidth = inverted
    ? Math.min(100 - value, 100)
    : Math.min(value, 100)

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}

export function HealthScoreCard({
  score,
  fillRate,
  paymentRate,
  noshowRate,
}: HealthScoreCardProps) {
  const t = useTranslations("dashboard")
  const scoreColor = getScoreColor(score)

  const scoreLabel =
    score >= 80
      ? t("healthExcellent")
      : score >= 60
        ? t("healthGood")
        : score >= 40
          ? t("healthAverage")
          : t("healthNeedsImprovement")

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          {t("healthScoreTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score circle */}
        <div className="flex flex-col items-center gap-1 py-2">
          <span className={cn("text-6xl font-black tabular-nums leading-none", scoreColor)}>
            {score}
          </span>
          <span className={cn("text-sm font-semibold mt-1", scoreColor)}>{scoreLabel}</span>
          <span className="text-xs text-muted-foreground">{t("outOf100")}</span>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <MetricRow label={t("fillRateLabel")} value={fillRate} />
          <MetricRow label={t("paymentRateLabel")} value={paymentRate} />
          <MetricRow label={t("noshowRateLabel")} value={noshowRate} inverted />
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          {t("calculatedFromToday")}
        </p>
      </CardContent>
    </Card>
  )
}
