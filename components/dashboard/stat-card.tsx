import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

type Color = "blue" | "green" | "amber" | "red"

const colorMap: Record<Color, { icon: string; value: string; bg: string }> = {
  blue: {
    icon: "text-blue-500",
    value: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  green: {
    icon: "text-green-500",
    value: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/40",
  },
  amber: {
    icon: "text-amber-500",
    value: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  red: {
    icon: "text-red-500",
    value: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
  },
}

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: Color
  sub?: string
}

export function StatCard({ title, value, icon: Icon, color, sub }: StatCardProps) {
  const c = colorMap[color]
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate" dir="rtl">
              {title}
            </p>
            <p className={cn("text-2xl font-bold tracking-tight", c.value)} dir="rtl">
              {value}
            </p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">
                {sub}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              c.bg
            )}
          >
            <Icon className={cn("h-5 w-5", c.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
