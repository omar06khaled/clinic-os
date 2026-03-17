"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CircleDollarSign,
  ShieldCheck,
  MessageCircle,
  Settings,
  Stethoscope,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { LanguageToggle } from "@/components/language-toggle"

// ── Nav definitions (label-free — resolved via i18n inside components) ───────

const ADMIN_NAV = [
  { href: "/",             key: "dashboard" as const,    icon: LayoutDashboard  },
  { href: "/appointments", key: "appointments" as const, icon: CalendarDays     },
  { href: "/patients",     key: "patients" as const,     icon: Users            },
  { href: "/financials",   key: "financials" as const,   icon: CircleDollarSign },
  { href: "/auditor",      key: "auditor" as const,      icon: ShieldCheck      },
  { href: "/whatsapp",     key: "whatsapp" as const,     icon: MessageCircle    },
  { href: "/settings",     key: "settings" as const,     icon: Settings         },
]

const OWNER_NAV = ADMIN_NAV

const DOCTOR_NAV = [
  { href: "/",             key: "dashboard" as const,    icon: LayoutDashboard  },
  { href: "/appointments", key: "appointments" as const, icon: CalendarDays     },
  { href: "/patients",     key: "patients" as const,     icon: Users            },
  { href: "/whatsapp",     key: "whatsapp" as const,     icon: MessageCircle    },
  { href: "/settings",     key: "settings" as const,     icon: Settings         },
]

const RECEPTIONIST_NAV = [
  { href: "/",             key: "dashboard" as const,    icon: LayoutDashboard  },
  { href: "/appointments", key: "appointments" as const, icon: CalendarDays     },
  { href: "/patients",     key: "patients" as const,     icon: Users            },
  { href: "/whatsapp",     key: "whatsapp" as const,     icon: MessageCircle    },
  { href: "/settings",     key: "settings" as const,     icon: Settings         },
]

const ADMIN_BOTTOM = [
  { href: "/",             key: "dashboard" as const,    abbrevKey: "dashboard" as const,     icon: LayoutDashboard  },
  { href: "/appointments", key: "appointments" as const, abbrevKey: "appts" as const,         icon: CalendarDays     },
  { href: "/patients",     key: "patients" as const,     abbrevKey: "patients" as const,      icon: Users            },
  { href: "/financials",   key: "financials" as const,   abbrevKey: "financials" as const,    icon: CircleDollarSign },
  { href: "/settings",     key: "settings" as const,     abbrevKey: "settings" as const,      icon: Settings         },
]

const OWNER_BOTTOM = ADMIN_BOTTOM

const DOCTOR_BOTTOM = [
  { href: "/",             key: "dashboard" as const,    abbrevKey: "dashboard" as const,     icon: LayoutDashboard },
  { href: "/appointments", key: "appointments" as const, abbrevKey: "appts" as const,         icon: CalendarDays    },
  { href: "/patients",     key: "patients" as const,     abbrevKey: "patients" as const,      icon: Users           },
  { href: "/whatsapp",     key: "whatsapp" as const,     abbrevKey: "whatsapp" as const,      icon: MessageCircle   },
  { href: "/settings",     key: "settings" as const,     abbrevKey: "settings" as const,      icon: Settings        },
]

const RECEPTIONIST_BOTTOM = [
  { href: "/",             key: "dashboard" as const,    abbrevKey: "dashboard" as const,     icon: LayoutDashboard },
  { href: "/appointments", key: "appointments" as const, abbrevKey: "appts" as const,         icon: CalendarDays    },
  { href: "/patients",     key: "patients" as const,     abbrevKey: "patients" as const,      icon: Users           },
  { href: "/whatsapp",     key: "whatsapp" as const,     abbrevKey: "whatsapp" as const,      icon: MessageCircle   },
  { href: "/settings",     key: "settings" as const,     abbrevKey: "settings" as const,      icon: Settings        },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

// ── Types ────────────────────────────────────────────────────────────────────

type DoctorInfo = {
  name: string
  specialty: string | null
  role: string
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({ doctor }: { doctor: DoctorInfo }) {
  const pathname = usePathname()
  const tNav = useTranslations("nav")
  const tSidebar = useTranslations("sidebar")

  const navLinks =
    doctor.role === "owner"
      ? OWNER_NAV
      : doctor.role === "admin"
        ? ADMIN_NAV
        : doctor.role === "receptionist"
          ? RECEPTIONIST_NAV
          : DOCTOR_NAV

  // Role badge
  const badgeClassName =
    doctor.role === "owner"
      ? "shrink-0 px-1.5 py-0 text-[10px] border-rose-400/30 text-rose-300 bg-rose-400/10"
      : doctor.role === "admin"
        ? "shrink-0 px-1.5 py-0 text-[10px] border-amber-400/30 text-amber-300 bg-amber-400/10"
        : doctor.role === "receptionist"
          ? "shrink-0 px-1.5 py-0 text-[10px] border-purple-400/30 text-purple-300 bg-purple-400/10"
          : "shrink-0 px-1.5 py-0 text-[10px] border-blue-400/30 text-blue-300 bg-blue-400/10"

  const badgeLabel =
    doctor.role === "owner"
      ? tSidebar("roleOwner")
      : doctor.role === "admin"
        ? tSidebar("roleAdmin")
        : doctor.role === "receptionist"
          ? tSidebar("roleReceptionist")
          : tSidebar("roleDoctor")

  const subtitle =
    doctor.role === "owner"
      ? tSidebar("subtitleOwner")
      : doctor.role === "admin"
        ? tSidebar("subtitleAdmin")
        : doctor.role === "receptionist"
          ? tSidebar("subtitleReceptionist")
          : doctor.specialty ?? tSidebar("subtitleDoctor")

  return (
    <aside className="sidebar-nav hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <Stethoscope className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
          Clinic OS
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navLinks.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                )}
              />
              {tNav(key)}
            </Link>
          )
        })}
      </nav>

      {/* Signed-in user card — name + role badge */}
      <div className="border-t border-sidebar-border p-3 space-y-0.5">
        <div className="flex items-center gap-3 rounded-md px-2 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
            <UserCircle className="h-5 w-5 text-sidebar-foreground/70" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {doctor.name}
              </span>
              <Badge variant="outline" className={badgeClassName}>
                {badgeLabel}
              </Badge>
            </div>
            <span className="truncate text-xs text-sidebar-foreground/50">
              {subtitle}
            </span>
          </div>
        </div>

        {/* Language toggle */}
        <LanguageToggle />
      </div>
    </aside>
  )
}

// ── Bottom tab bar (mobile) ──────────────────────────────────────────────────

export function BottomTabBar({ role = "doctor" }: { role?: string }) {
  const pathname = usePathname()
  const tNav = useTranslations("nav")
  const tSidebar = useTranslations("sidebar")

  const tabs =
    role === "owner"
      ? OWNER_BOTTOM
      : role === "admin"
        ? ADMIN_BOTTOM
        : role === "receptionist"
          ? RECEPTIONIST_BOTTOM
          : DOCTOR_BOTTOM

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden h-16 items-stretch bg-sidebar border-t border-sidebar-border">
      {tabs.map(({ href, key, abbrevKey, icon: Icon }) => {
        const active = isActive(pathname, href)
        // Use sidebar namespace for abbreviations, nav namespace for the key
        const label = abbrevKey === "appts" ? tSidebar("appts") : tNav(key)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              active
                ? "text-sidebar-primary"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="leading-none">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
