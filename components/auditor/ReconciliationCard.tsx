"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Banknote, Smartphone, CreditCard, Shield, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { AuditorExpectedData, AuditorReportedValues } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type MethodKey = "cash" | "instapay" | "fawry" | "insurance"

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  expectedData: AuditorExpectedData | null
  loading: boolean
  onCalculate: (reported: AuditorReportedValues) => void
  calculating: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReconciliationCard({
  expectedData,
  loading,
  onCalculate,
  calculating,
}: Props) {
  const t = useTranslations("auditor")

  const METHODS: {
    key: MethodKey
    label: string
    inputLabel: string
    Icon: React.ComponentType<{ className?: string }>
    iconColor: string
    borderColor: string
  }[] = [
    {
      key: "cash",
      label: t("methodCash"),
      inputLabel: t("inputLabelCash"),
      Icon: Banknote,
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
    },
    {
      key: "instapay",
      label: t("methodInstapay"),
      inputLabel: t("inputLabelInstapay"),
      Icon: Smartphone,
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
    },
    {
      key: "fawry",
      label: t("methodFawry"),
      inputLabel: t("inputLabelFawry"),
      Icon: CreditCard,
      iconColor: "text-orange-600",
      borderColor: "border-orange-200",
    },
    {
      key: "insurance",
      label: t("methodInsurance"),
      inputLabel: t("inputLabelInsurance"),
      Icon: Shield,
      iconColor: "text-sky-600",
      borderColor: "border-sky-200",
    },
  ]

  const [reported, setReported] = useState<Record<MethodKey, string>>({
    cash: "",
    instapay: "",
    fawry: "",
    insurance: "",
  })

  function handleChange(key: MethodKey, value: string) {
    // Allow only digits and a single decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setReported((prev) => ({ ...prev, [key]: value }))
    }
  }

  function handleCalculate() {
    onCalculate({
      cash: Number(reported.cash) || 0,
      instapay: Number(reported.instapay) || 0,
      fawry: Number(reported.fawry) || 0,
      insurance: Number(reported.insurance) || 0,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-base font-semibold text-foreground">
          {t("cardTitle")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("cardSubtitle")}
        </p>
        <div className="mt-1 flex items-start gap-1.5 rounded-md bg-purple-50 border border-purple-200 px-3 py-2">
          <Shield className="h-3.5 w-3.5 shrink-0 text-purple-500 mt-0.5" />
          <p className="text-xs text-purple-700">
            {t("insuranceNote")}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {METHODS.map(
            ({ key, label, inputLabel, Icon, iconColor, borderColor }) => {
              const expected = expectedData?.[key]
              return (
                <div
                  key={key}
                  className={`rounded-lg border ${borderColor} bg-card p-4 flex flex-col gap-3`}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                    <span className="text-sm font-semibold">{label}</span>
                  </div>

                  {/* Expected */}
                  <div className="space-y-0.5">
                    {loading ? (
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {t("expectedByRecords")}
                        </p>
                        <p className="text-lg font-bold tabular-nums">
                          {expected?.totalEGP.toLocaleString("ar-EG") ?? "٠"}
                          <span className="mr-1 text-xs font-normal text-muted-foreground">
                            ج.م
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("patientCount", { count: expected?.count ?? 0 })}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Reported input */}
                  <div className="space-y-1">
                    <Label
                      htmlFor={`reported-${key}`}
                      className="text-xs text-muted-foreground"
                    >
                      {inputLabel}
                    </Label>
                    <Input
                      id={`reported-${key}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="٠"
                      value={reported[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="text-right tabular-nums"
                      dir="ltr"
                    />
                  </div>
                </div>
              )
            }
          )}
        </div>

        {/* Calculate button */}
        <div className="mt-5 flex justify-start">
          <Button
            onClick={handleCalculate}
            disabled={calculating || loading}
            className="min-w-[140px]"
          >
            {calculating ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                {t("calculating")}
              </>
            ) : (
              t("calculateButton")
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
