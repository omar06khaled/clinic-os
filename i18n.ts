import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"

export const locales = ["en", "ar"] as const
export const defaultLocale = "en" as const

export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(locales, requested) ? requested : defaultLocale

  const messages =
    locale === "ar"
      ? (await import("./messages/ar.json")).default
      : (await import("./messages/en.json")).default

  return { locale, messages }
})
