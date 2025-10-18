"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { href: "/", label: "Bosh Sahifa", icon: Home },
  { href: "/browse", label: "Ko'rish", icon: LayoutGrid },
  { href: "/designers", label: "Dizaynerlar", icon: Users },
  { href: "/account", label: "Hisobim", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <nav className="h-full">
        <ul className="flex h-full items-center justify-around">
          {navItems.map((item) => {
            const isActive = (item.href === "/" && pathname === "/") || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.href} className="flex-1">
                <Link href={item.href}>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <item.icon
                      className={cn(
                        "w-6 h-6 transition-all duration-200",
                        isActive
                          ? "text-primary scale-110 -translate-y-0.5"
                          : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium transition-all duration-200",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
