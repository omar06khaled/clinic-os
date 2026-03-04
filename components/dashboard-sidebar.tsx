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

const NAV_LINKS = [
  { href: "/",             label: "Dashboard",    icon: LayoutDashboard  },
  { href: "/appointments", label: "Appointments", icon: CalendarDays     },
  { href: "/patients",     label: "Patients",     icon: Users            },
  { href: "/financials",   label: "Financials",   icon: CircleDollarSign },
  { href: "/auditor",      label: "Auditor",      icon: ShieldCheck      },
  { href: "/whatsapp",     label: "WhatsApp",     icon: MessageCircle    },
  { href: "/settings",     label: "Settings",     icon: Settings         },
] as const;

const BOTTOM_TAB_LINKS = [
  { href: "/",             label: "Dashboard",    icon: LayoutDashboard  },
  { href: "/appointments", label: "Appts",        icon: CalendarDays     },
  { href: "/patients",     label: "Patients",     icon: Users            },
  { href: "/financials",   label: "Financials",   icon: CircleDollarSign },
  { href: "/settings",     label: "Settings",     icon: Settings         },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

type DoctorInfo = {
  name: string
  specialty: string | null
  role: string
}

export function Sidebar({ doctor }: { doctor: DoctorInfo }) {
  const pathname = usePathname();

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
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
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

      {/* Signed-in doctor */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
            <UserCircle className="h-5 w-5 text-sidebar-foreground/70" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {doctor.name}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/50">
              {doctor.specialty ?? "General Practice"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden h-16 items-stretch bg-sidebar border-t border-sidebar-border">
      {BOTTOM_TAB_LINKS.map(({ href, label, icon: Icon }) => {
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
