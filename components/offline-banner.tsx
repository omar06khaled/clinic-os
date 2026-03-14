"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    // Initialise from current state (SSR renders nothing; client hydration sets real value)
    setOffline(!navigator.onLine)

    function handleOffline() { setOffline(true) }
    function handleOnline()  { setOffline(false) }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online",  handleOnline)
    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online",  handleOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      dir="rtl"
      className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white"
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>لا يوجد اتصال بالإنترنت — بعض الميزات قد لا تعمل حتى يعود الاتصال.</span>
    </div>
  )
}
