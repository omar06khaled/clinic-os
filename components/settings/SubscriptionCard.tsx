import { Check, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Tier = {
  key: string
  label: string
  priceEGP: number
  features: string[]
}

const TIERS: Tier[] = [
  {
    key: "starter",
    label: "Starter",
    priceEGP: 400,
    features: [
      "WhatsApp booking bot",
      "Automated reminders (24h + 1h)",
      "Appointment calendar",
      "300 patient conversations/month",
    ],
  },
  {
    key: "professional",
    label: "Professional",
    priceEGP: 700,
    features: [
      "Everything in Starter",
      "Full EMR-lite patient records",
      "Chronic condition tracking",
      "Cash Auditor reconciliation",
      "Revenue + expense tracking",
      "500 patient conversations/month",
    ],
  },
  {
    key: "growth",
    label: "Growth",
    priceEGP: 1000,
    features: [
      "Everything in Professional",
      "Voice note transcription",
      "Multi-doctor siloed vaults",
      "Revenue analytics + P&L export",
      "Follow-up campaigns",
      "800 patient conversations/month",
    ],
  },
]

type Props = {
  currentTier: string
}

export function SubscriptionCard({ currentTier }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          Subscription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIERS.map((tier) => {
            const isCurrent = tier.key === currentTier
            return (
              <div
                key={tier.key}
                className={`rounded-lg border p-4 space-y-3 ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{tier.label}</h3>
                  {isCurrent && (
                    <Badge className="text-xs shrink-0 bg-primary text-primary-foreground">
                      Current Plan
                    </Badge>
                  )}
                </div>

                {/* Price */}
                <p className="text-xl font-bold leading-none">
                  EGP {tier.priceEGP.toLocaleString("en-US")}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </p>

                {/* Features */}
                <ul className="space-y-1.5">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-1.5 text-xs text-muted-foreground"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Upgrade CTA */}
                {!isCurrent && (
                  <a href="#">
                    <Button variant="outline" size="sm" className="w-full text-xs mt-1">
                      Upgrade
                    </Button>
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
