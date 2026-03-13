"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ── Nav definitions ──────────────────────────────────────────────────────────

const ADMIN_NAV = [
  { href: "/",             label: "Dashboard",    icon: LayoutDashboard  },
  { href: "/appointments", label: "Appointments", icon: CalendarDays     },
  { href: "/patients",     label: "Patients",     icon: Users            },
  { href: "/financials",   label: "Financials",   icon: CircleDollarSign },
  { href: "/auditor",      label: "Auditor",      icon: ShieldCheck      },
  { href: "/whatsapp",     label: "WhatsApp",     icon: MessageCircle    },
  { href: "/settings",     label: "Settings",     icon: Settings         },
] as const;

const DOCTOR_NAV = [
  { href: "/",             label: "Dashboard",    icon: LayoutDashboard  },
  { href: "/appointments", label: "Appointments", icon: CalendarDays     },
  { href: "/patients",     label: "Patients",     icon: Users            },
  { href: "/whatsapp",     label: "WhatsApp",     icon: MessageCircle    },
  { href: "/settings",     label: "Settings",     icon: Settings         },
] as const;

const RECEPTIONIST_NAV = [
  { href: "/",             label: "Dashboard",    icon: LayoutDashboard  },
  { href: "/appointments", label: "Appointments", icon: CalendarDays     },
  { href: "/patients",     label: "Patients",     icon: Users            },
  { href: "/whatsapp",     label: "WhatsApp",     icon: MessageCircle    },
  { href: "/settings",     label: "Settings",     icon: Settings         },
] as const;

const ADMIN_BOTTOM = [
  { href: "/",             label: "Dashboard",  icon: LayoutDashboard  },
  { href: "/appointments", label: "Appts",      icon: CalendarDays     },
  { href: "/patients",     label: "Patients",   icon: Users            },
  { href: "/financials",   label: "Financials", icon: CircleDollarSign },
  { href: "/settings",     label: "Settings",   icon: Settings         },
] as const;

const DOCTOR_BOTTOM = [
  { href: "/",             label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appts",     icon: CalendarDays    },
  { href: "/patients",     label: "Patients",  icon: Users           },
  { href: "/whatsapp",     label: "WhatsApp",  icon: MessageCircle   },
  { href: "/settings",     label: "Settings",  icon: Settings        },
] as const;

const RECEPTIONIST_BOTTOM = [
  { href: "/",             label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Appts",     icon: CalendarDays    },
  { href: "/patients",     label: "Patients",  icon: Users           },
  { href: "/whatsapp",     label: "WhatsApp",  icon: MessageCircle   },
  { href: "/settings",     label: "Settings",  icon: Settings        },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function getRoleBadge(role: string) {
  if (role === "admin") {
    return {
      label: "Admin",
      className: "shrink-0 px-1.5 py-0 text-[10px] border-amber-500/40 text-amber-600 bg-amber-50 dark:bg-amber-950/20",
    };
  }
  if (role === "receptionist") {
    return {
      label: "Receptionist",
      className: "shrink-0 px-1.5 py-0 text-[10px] border-purple-500/40 text-purple-600 bg-purple-50 dark:bg-purple-950/20",
    };
  }
  return {
    label: "Doctor",
    className: "shrink-0 px-1.5 py-0 text-[10px] border-blue-500/40 text-blue-600 bg-blue-50 dark:bg-blue-950/20",
  };
}

function getRoleSubtitle(role: string, specialty: string | null) {
  if (role === "admin") return "Clinic Administrator";
  if (role === "receptionist") return "Receptionist";
  return specialty ?? "General Practice";
}

// ── Types ────────────────────────────────────────────────────────────────────

type DoctorInfo = {
  name: string
  specialty: string | null
  role: string
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({ doctor }: { doctor: DoctorInfo }) {
  const pathname = usePathname();

  const navLinks =
    doctor.role === "admin"
      ? ADMIN_NAV
      : doctor.role === "receptionist"
        ? RECEPTIONIST_NAV
        : DOCTOR_NAV;

  const badge = getRoleBadge(doctor.role);
  const subtitle = getRoleSubtitle(doctor.role, doctor.specialty);

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border">

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
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
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
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Signed-in user card — name + role badge */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
            <UserCircle className="h-5 w-5 text-sidebar-foreground/70" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {doctor.name}
              </span>
              <Badge variant="outline" className={badge.className}>
                {badge.label}
              </Badge>
            </div>
            <span className="truncate text-xs text-sidebar-foreground/50">
              {subtitle}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── Bottom tab bar (mobile) ──────────────────────────────────────────────────

export function BottomTabBar({ role = "doctor" }: { role?: string }) {
  const pathname = usePathname();

  const tabs =
    role === "admin"
      ? ADMIN_BOTTOM
      : role === "receptionist"
        ? RECEPTIONIST_BOTTOM
        : DOCTOR_BOTTOM;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden h-16 items-stretch bg-sidebar border-t border-sidebar-border">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
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
        );
      })}
    </nav>
  );
}
