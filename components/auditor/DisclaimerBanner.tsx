"use client"

import { useTranslations } from "next-intl"
import { Info } from "lucide-react"

/**
 * Always-visible disclaimer banner — appears above all numbers.
 * Cannot be dismissed or hidden.
 */
export default function DisclaimerBanner() {
  const t = useTranslations("auditor")

  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" aria-hidden />
      <p className="text-sm leading-relaxed text-blue-800">
        {t("disclaimer")}
      </p>
    </div>
  )
}
