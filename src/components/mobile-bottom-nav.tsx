

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Users, User, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from 'framer-motion';

const navItems = [
  { href: "/", label: "Bosh Sahifa", icon: Home },
  { href: "/browse", label: "Loyihalar", icon: LayoutGrid },
  { href: "/messages", label: "Xabarlar", icon: MessageSquare },
  { href: "/designers", label: "Dizaynerlar", icon: Users },
  { href: "/account", label: "Profil", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (isMobile === false || isMobile === undefined) { 
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 border-t border-border/20 backdrop-blur-lg shadow-2xl shadow-black z-50">
      <nav className="h-full">
        <ul className="flex h-full items-center justify-around">
          {navItems.map((item) => {
            const isActive = (item.href === "/" && pathname === "/") || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.href} className="flex-1">
                <Link href={item.href} className="flex flex-col items-center justify-center h-full relative">
                  <motion.div
                    className="flex flex-col items-center gap-1"
                    animate={{ y: isActive ? -8 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <item.icon
                      className={cn(
                        "w-6 h-6 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-medium transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
