
"use client";

import Link from "next/link";
import { Logo } from "./icons";
import { Button } from "./ui/button";
import { useUser } from "@/firebase";

export function Footer() {
  const { user } = useUser();

  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-start gap-4">
                 <Link href="/" className="flex items-center gap-2">
                    <Logo className="w-6 h-6 text-primary" />
                    <span className="font-semibold font-headline">inDizayn</span>
                </Link>
                <p className="text-sm text-muted-foreground">O'zbekistondagi dizaynerlar hamjamiyatini kashf qiling, ilhomlaning va ular bilan bog'laning.</p>
                 <div className="flex gap-2">
                    {/* Ijtimoiy tarmoqlar havolalari */}
                 </div>
            </div>
            <div className="grid grid-cols-2 md:col-span-2 gap-8 text-sm">
                <div>
                    <h4 className="font-semibold mb-2 font-headline">Platforma</h4>
                    <nav className="flex flex-col gap-2">
                        <Link href="/browse" className="text-muted-foreground hover:text-foreground">Loyihalar</Link>
                        <Link href="/designers" className="text-muted-foreground hover:text-foreground">Dizaynerlar</Link>
                         <Link href="/about" className="text-muted-foreground hover:text-foreground">Haqida</Link>
                    </nav>
                </div>
                 {!user && (
                    <div>
                        <h4 className="font-semibold mb-2 font-headline">Dizayner bo'ling</h4>
                        <p className="text-muted-foreground mb-4">Hamjamiyatimizga qo'shiling va ijodingizni namoyish eting.</p>
                        <Button asChild>
                            <Link href="/auth">Boshlash</Link>
                        </Button>
                    </div>
                 )}
            </div>
        </div>
         <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} inDizayn. Barcha huquqlar himoyalangan.</p>
        </div>
      </div>
    </footer>
  );
}
