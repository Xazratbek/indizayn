
"use client";

import Link from "next/link";
import { Logo } from "./icons";
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function Footer() {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith('/auth');

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (isAuthPage && isClient) {
    return null; // Don't render footer on auth page
  }

  return (
    <footer className={cn(
        "w-full border-t",
        !session ? "starry-background text-slate-300 border-slate-800" : "bg-background border-border"
        )}>
      <div className="py-6 px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <Link href="/" className="flex items-center gap-2">
              <Logo className={cn("w-6 h-6", !session ? "text-primary" : "text-primary")} />
              <span className={cn("font-semibold font-headline", !session ? "text-white" : "text-foreground")}>inDizayn</span>
            </Link>
            <p className={cn("text-sm hidden md:block", !session ? "text-slate-400" : "text-muted-foreground")}>
              © {new Date().getFullYear()} inDizayn. Barcha huquqlar himoyalangan.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <nav className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/browse" className={cn("hover:text-foreground", !session ? "text-slate-400 hover:text-white" : "text-muted-foreground")}>Loyihalar</Link>
                <Link href="/designers" className={cn("hover:text-foreground", !session ? "text-slate-400 hover:text-white" : "text-muted-foreground")}>Dizaynerlar</Link>
                <Link href="/about" className={cn("hover:text-foreground", !session ? "text-slate-400 hover:text-white" : "text-muted-foreground")}>Haqida</Link>
            </nav>
             <p className={cn("text-sm md:hidden", !session ? "text-slate-400" : "text-muted-foreground")}>
              © {new Date().getFullYear()} inDizayn. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
