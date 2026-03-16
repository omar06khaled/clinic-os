"use client"

import { useLocale, useTranslations } from "next-intl"
import { Languages } from "lucide-react"

export function LanguageToggle() {
  const locale = useLocale()
  const t = useTranslations("sidebar")

  function handleToggle() {
    const next = locale === "en" ? "ar" : "en"
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`
    window.location.reload()
  }

  return (
    <button
      onClick={handleToggle}
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
    >
      <Languages className="h-3.5 w-3.5 shrink-0" />
      <span>{t("toggleLanguage")}</span>
    </button>
  )
}
