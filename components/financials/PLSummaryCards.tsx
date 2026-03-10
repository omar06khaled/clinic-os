"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { PLSummary } from "@/app/api/financials/pl/route"

interface Props {
  summary: PLSummary
}

export function PLSummaryCards({ summary }: Props) {
  const { totalRevenue, totalExpenses, netProfit, profitMargin, cashPosition } =
    summary

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {/* إجمالي الإيرادات */}
      <Card dir="rtl">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">إجمالي الإيرادات</p>
          <p className="text-xl font-bold tabular-nums text-emerald-600">
            {totalRevenue.toLocaleString("ar-EG")}
            <span className="text-sm font-normal text-muted-foreground mr-1">
              ج.م
            </span>
          </p>
        </CardContent>
      </Card>

      {/* إجمالي المصروفات */}
      <Card dir="rtl">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">إجمالي المصروفات</p>
          <p className="text-xl font-bold tabular-nums text-red-500">
            {totalExpenses.toLocaleString("ar-EG")}
            <span className="text-sm font-normal text-muted-foreground mr-1">
              ج.م
            </span>
          </p>
        </CardContent>
      </Card>

      {/* صافي الربح */}
      <Card dir="rtl">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">صافي الربح</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              netProfit >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {netProfit.toLocaleString("ar-EG")}
            <span className="text-sm font-normal text-muted-foreground mr-1">
              ج.م
            </span>
          </p>
        </CardContent>
      </Card>

      {/* هامش الربح */}
      <Card dir="rtl">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">هامش الربح</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              profitMargin >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {profitMargin.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {/* المركز النقدي */}
      <Card dir="rtl">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">المركز النقدي</p>
          <p
            className={`text-xl font-bold tabular-nums ${
              cashPosition >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {cashPosition.toLocaleString("ar-EG")}
            <span className="text-sm font-normal text-muted-foreground mr-1">
              ج.م
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
