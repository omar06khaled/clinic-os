"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import type { PLSummary } from "@/app/api/financials/pl/route"

interface Props {
  summary: PLSummary
}

export function PLSummaryCards({ summary }: Props) {
  const t = useTranslations("financials")
  const { totalRevenue, totalExpenses, netProfit, profitMargin, cashPosition } =
    summary

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {/* Total Revenue */}
      <Card dir="rtl">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{t("summaryTotalRevenue")}</p>
          <p className="text-xl font-bold tabular-nums text-emerald-600">
            {totalRevenue.toLocaleString("ar-EG")}
            <span className="text-sm font-normal text-muted-foreground mr-1">
              {t("currencySuffix")}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Total Expenses */}
      <Card dir="rtl">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{t("summaryTotalExpenses")}</p>
          <p className="text-xl font-bold tabular-nums text-red-500">
            {totalExpenses.toLocaleString("ar-EG")}
            <span className="text-sm font-normal text-muted-foreground mr-1">
              {t("currencySuffix")}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Net Profit */}
      <Card dir="rtl">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{t("summaryNetProfit")}</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              netProfit >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {netProfit.toLocaleString("ar-EG")}
            <span className="text-sm font-normal text-muted-foreground mr-1">
              {t("currencySuffix")}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Profit Margin */}
      <Card dir="rtl">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{t("summaryProfitMargin")}</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              profitMargin >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {profitMargin.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {/* Cash Position */}
      <Card dir="rtl">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{t("summaryCashPosition")}</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              cashPosition >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {cashPosition.toLocaleString("ar-EG")}
            <span className="text-sm font-normal text-muted-foreground mr-1">
              {t("currencySuffix")}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
