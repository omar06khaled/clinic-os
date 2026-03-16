"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Printer, Send } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { InvoiceData } from "@/app/api/invoices/route"
import type { RevenueRow } from "@/app/api/financials/revenue/route"

interface Props {
  row: RevenueRow | null
  onClose: () => void
}

function formatInvoiceDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("ar-EG", {
    timeZone: "Africa/Cairo",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function fmt(n: number): string {
  return n.toLocaleString("ar-EG")
}

export function InvoiceModal({ row, onClose }: Props) {
  const t = useTranslations("financials")
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!row) {
      setInvoice(null)
      setNotFound(false)
      return
    }

    setLoading(true)
    setNotFound(false)
    setInvoice(null)

    fetch(`/api/invoices?appointmentId=${row.id}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (res.ok) {
          const data: InvoiceData = await res.json()
          setInvoice(data)
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [row])

  function handlePrint() {
    if (!invoice) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${t("invoicePrintTitle", { name: invoice.patientName })}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      direction: rtl;
      padding: 30mm 20mm;
      color: #111;
      font-size: 13px;
      line-height: 1.6;
    }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #333; padding-bottom: 16px; }
    .header h1 { font-size: 22px; font-weight: 700; }
    .header p { color: #555; font-size: 13px; margin-top: 4px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-item label { font-size: 11px; color: #666; display: block; }
    .info-item span { font-weight: 600; }
    .divider { border: none; border-top: 1px solid #e0e0e0; margin: 16px 0; }
    .service-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals { width: 260px; margin-right: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .totals-row.total { font-size: 16px; font-weight: 700; border-top: 2px solid #333; padding-top: 8px; margin-top: 4px; }
    .eta-badge {
      display: inline-block;
      background: #f3f4f6;
      color: #6b7280;
      border-radius: 9999px;
      padding: 2px 12px;
      font-size: 11px;
      border: 1px solid #e5e7eb;
    }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${invoice.clinicName}</h1>
    <p>${t("doctorPrefix")} ${invoice.doctorName}</p>
  </div>

  <div class="section">
    <div class="info-grid">
      <div class="info-item">
        <label>${t("invoiceLabelPatient")}</label>
        <span>${invoice.patientName}</span>
      </div>
      <div class="info-item">
        <label>${t("invoiceLabelPhone")}</label>
        <span>${invoice.patientPhone}</span>
      </div>
      <div class="info-item">
        <label>${t("invoiceLabelInvoiceDate")}</label>
        <span>${formatInvoiceDate(invoice.invoiceDate)}</span>
      </div>
      <div class="info-item">
        <label>${t("invoiceLabelInvoiceNumber")}</label>
        <span style="font-size:11px;color:#666;">${invoice.id}</span>
      </div>
    </div>
  </div>

  <hr class="divider" />

  <div class="section">
    <div class="section-title">${t("invoiceSectionService")}</div>
    <div class="service-row">
      <span>${invoice.serviceDescription}</span>
      <span>${fmt(invoice.amountEGP)} ${t("currencySuffix")}</span>
    </div>
  </div>

  <hr class="divider" />

  <div class="totals">
    <div class="totals-row">
      <span>${t("invoiceLabelBase")}</span>
      <span>${fmt(invoice.amountEGP)} ${t("currencySuffix")}</span>
    </div>
    <div class="totals-row">
      <span>${t("invoiceLabelVat")}</span>
      <span>${fmt(invoice.taxAmountEGP)} ${t("currencySuffix")}</span>
    </div>
    <div class="totals-row total">
      <span>${t("invoiceLabelTotal")}</span>
      <span>${fmt(invoice.totalAmountEGP)} ${t("currencySuffix")}</span>
    </div>
  </div>

  <hr class="divider" style="margin-top:24px;" />

  <div style="margin-top:12px;">
    <span class="section-title">${t("invoiceEtaStatusLabel")}</span>
    <span class="eta-badge">${t("invoiceEtaPendingBadge")}</span>
  </div>

  <div class="footer">${t("invoicePrintFooter")}</div>
</body>
</html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const ETA_STATUS_LABELS: Record<string, string> = {
    pending: t("invoiceEtaPending"),
    submitted: t("invoiceEtaSubmitted"),
    accepted: t("invoiceEtaAccepted"),
    rejected: t("invoiceEtaRejected"),
  }

  return (
    <Dialog
      open={!!row}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{t("invoiceDialogTitle")}</DialogTitle>
        </DialogHeader>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Not found */}
        {!loading && notFound && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            <p className="font-medium">{t("invoiceNotAvailableTitle")}</p>
            <p className="mt-1 text-xs">
              {t("invoiceNotAvailableBody")}
            </p>
          </div>
        )}

        {/* Invoice content */}
        {!loading && invoice && (
          <div ref={invoiceRef} className="space-y-4">
            {/* Clinic + Doctor header */}
            <div className="rounded-lg bg-muted/40 px-4 py-3 text-center">
              <p className="text-base font-bold">{invoice.clinicName}</p>
              <p className="text-sm text-muted-foreground">{t("doctorPrefix")} {invoice.doctorName}</p>
            </div>

            {/* Patient info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{t("invoiceLabelPatient")}</p>
                <p className="font-semibold">{invoice.patientName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("invoiceLabelPhone")}</p>
                <p className="font-semibold" dir="ltr">{invoice.patientPhone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("invoiceLabelInvoiceDate")}</p>
                <p className="font-semibold">{formatInvoiceDate(invoice.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("invoiceLabelInvoiceNumber")}</p>
                <p className="font-mono text-xs text-muted-foreground">{invoice.id.slice(-8)}</p>
              </div>
            </div>

            <hr className="border-border" />

            {/* Service */}
            <div className="text-sm">
              <p className="text-xs text-muted-foreground mb-1">{t("invoiceSectionService")}</p>
              <p className="font-medium">{invoice.serviceDescription}</p>
            </div>

            <hr className="border-border" />

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("invoiceLabelBase")}</span>
                <span className="tabular-nums">{fmt(invoice.amountEGP)} {t("currencySuffix")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("invoiceLabelVat")}</span>
                <span className="tabular-nums">{fmt(invoice.taxAmountEGP)} {t("currencySuffix")}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
                <span>{t("invoiceLabelTotal")}</span>
                <span className="tabular-nums">{fmt(invoice.totalAmountEGP)} {t("currencySuffix")}</span>
              </div>
            </div>

            {/* ETA status */}
            <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {t("invoiceEtaStatusLabel")}
              <span className="font-medium text-foreground">
                {ETA_STATUS_LABELS[invoice.etaStatus] ?? invoice.etaStatus}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          {invoice && (
            <>
              <Button variant="outline" onClick={handlePrint} className="gap-1.5">
                <Printer className="h-4 w-4" />
                {t("invoicePrintBtn")}
              </Button>
              {/* ETA Submit — disabled until business registration is cleared */}
              <Button
                disabled
                title={t("invoiceSubmitEtaTooltip")}
                className="gap-1.5"
              >
                <Send className="h-4 w-4" />
                {t("invoiceSubmitEtaBtn")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
