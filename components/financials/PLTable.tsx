"use client"

import type { PLSummary } from "@/app/api/financials/pl/route"

interface Props {
  summary: PLSummary
  expensesByCategory: Record<string, number>
  month: string
  clinicName: string
  doctorName: string
  doctorSpecialty: string | null
  generatedAt: string
}

const EXPENSE_ROWS: { key: string; label: string }[] = [
  { key: "rent", label: "إيجار" },
  { key: "utilities", label: "مرافق" },
  { key: "supplies", label: "مستلزمات" },
  { key: "salary", label: "رواتب" },
  { key: "equipment", label: "معدات" },
  { key: "other", label: "أخرى" },
]

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("ar-EG", {
    month: "long",
    year: "numeric",
  })
}

export function PLTable({
  summary,
  expensesByCategory,
  month,
  clinicName,
  doctorName,
  doctorSpecialty,
  generatedAt,
}: Props) {
  const { totalRevenue, totalExpenses, netProfit, profitMargin } = summary

  function pct(amount: number): string {
    if (totalRevenue <= 0) return "—"
    return `${((amount / totalRevenue) * 100).toFixed(1)}%`
  }

  const isPositive = netProfit >= 0

  return (
    <div className="rounded-xl border bg-card shadow-sm print:border-0 print:shadow-none print:rounded-none">
      {/* ── Print-only header ───────────────────────────────────────────────── */}
      <div className="hidden print:block p-6 pb-4 border-b">
        <h1 className="text-xl font-bold">{clinicName}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {doctorName}
          {doctorSpecialty ? ` — ${doctorSpecialty}` : ""}
        </p>
        <p className="text-base font-semibold mt-3">
          كشف الأرباح والخسائر — {formatMonthLabel(month)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          تاريخ الإنشاء: {generatedAt}
        </p>
      </div>

      {/* ── Screen-only section title ───────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 print:hidden">
        <h2 className="text-sm font-semibold">كشف الأرباح والخسائر الشهري</h2>
        <span className="text-xs text-muted-foreground">
          {formatMonthLabel(month)}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 print:px-6 print:pb-6" dir="rtl">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2">
              <th className="pb-2 text-right font-semibold w-1/2">البند</th>
              <th className="pb-2 text-left font-semibold">المبلغ (ج.م)</th>
              <th className="pb-2 text-left font-semibold">% من الإيرادات</th>
            </tr>
          </thead>
          <tbody>
            {/* Revenue row */}
            <tr className="border-b font-bold bg-emerald-50 print:bg-transparent">
              <td className="py-2.5 pr-2 text-emerald-700">إجمالي الإيرادات</td>
              <td className="py-2.5 text-left tabular-nums text-emerald-700">
                {totalRevenue.toLocaleString("ar-EG")}
              </td>
              <td className="py-2.5 text-left text-emerald-700">100%</td>
            </tr>

            {/* Individual expense rows */}
            {EXPENSE_ROWS.map(({ key, label }) => {
              const amount = expensesByCategory[key] ?? 0
              return (
                <tr key={key} className="border-b border-dashed">
                  <td className="py-2 pr-2 text-muted-foreground">{label}</td>
                  <td className="py-2 text-left tabular-nums">
                    {amount.toLocaleString("ar-EG")}
                  </td>
                  <td className="py-2 text-left text-muted-foreground">
                    {pct(amount)}
                  </td>
                </tr>
              )
            })}

            {/* Total expenses subtotal */}
            <tr className="border-b font-bold bg-red-50 print:bg-transparent">
              <td className="py-2.5 pr-2 text-red-600">إجمالي المصروفات</td>
              <td className="py-2.5 text-left tabular-nums text-red-600">
                {totalExpenses.toLocaleString("ar-EG")}
              </td>
              <td className="py-2.5 text-left text-red-600">
                {pct(totalExpenses)}
              </td>
            </tr>

            {/* Net profit */}
            <tr
              className={`border-b font-bold ${
                isPositive
                  ? "bg-emerald-50 print:bg-transparent"
                  : "bg-red-50 print:bg-transparent"
              }`}
            >
              <td
                className={`py-2.5 pr-2 ${
                  isPositive ? "text-emerald-700" : "text-red-600"
                }`}
              >
                صافي الربح
              </td>
              <td
                className={`py-2.5 text-left tabular-nums ${
                  isPositive ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {netProfit.toLocaleString("ar-EG")}
              </td>
              <td
                className={`py-2.5 text-left ${
                  isPositive ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {pct(netProfit)}
              </td>
            </tr>

            {/* Profit margin */}
            <tr
              className={`font-semibold ${
                profitMargin >= 0 ? "text-emerald-700" : "text-red-600"
              }`}
            >
              <td className="py-2.5 pr-2">هامش الربح %</td>
              <td className="py-2.5 text-left tabular-nums">
                {profitMargin.toFixed(1)}%
              </td>
              <td className="py-2.5 text-left text-muted-foreground">—</td>
            </tr>
          </tbody>
        </table>

        {/* ── Print-only footer ─────────────────────────────────────────────── */}
        <div className="hidden print:flex mt-10 pt-4 border-t items-center justify-between text-xs text-muted-foreground">
          <span>تم الإنشاء بواسطة Clinic OS</span>
          <span className="print-page-number" />
        </div>
      </div>
    </div>
  )
}
