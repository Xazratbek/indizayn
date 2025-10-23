
"use client";

import Link from "next/link";
import { Logo } from "./icons";
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";

export function Footer() {
  const { data: session } = useSession();

  return (
    <footer className="w-full border-t bg-background">
      <div className="py-6 px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="w-6 h-6 text-primary" />
              <span className="font-semibold font-headline">inDizayn</span>
            </Link>
            <p className="text-sm text-muted-foreground hidden md:block">
              © {new Date().getFullYear()} inDizayn. Barcha huquqlar himoyalangan.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <nav className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/browse" className="text-muted-foreground hover:text-foreground">Loyihalar</Link>
                <Link href="/designers" className="text-muted-foreground hover:text-foreground">Dizaynerlar</Link>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">Haqida</Link>
            </nav>
             <p className="text-sm text-muted-foreground md:hidden">
              © {new Date().getFullYear()} inDizayn. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
