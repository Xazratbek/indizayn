import Link from "next/link";
import { Logo } from "./icons";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-6 h-6 text-primary" />
            <span className="font-semibold font-headline">DesignFlow</span>
          </Link>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} DesignFlow. Barcha huquqlar himoyalangan.</p>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="#" className="hover:underline">
              Shartlar
            </Link>
            <Link href="#" className="hover:underline">
              Maxfiylik
            </Link>
            <Link href="#" className="hover:underline">
              Aloqa
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
