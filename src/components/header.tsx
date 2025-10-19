"use client"

import Link from "next/link"
import { Search, Menu, Home, Compass, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "./icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth, useUser } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

export function Header() {
  const isMobile = useIsMobile();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  }

  const navContent = isMobile === undefined ? null : (
    !isMobile ? (
      <nav className="flex items-center gap-6 text-sm">
        <Link
          href="/browse"
          className="transition-colors hover:text-foreground/80 text-foreground/60"
        >
          Loyihalar
        </Link>
        <Link
          href="/designers"
          className="transition-colors hover:text-foreground/80 text-foreground/60"
        >
          Dizaynerlar
        </Link>
        <Link
          href="/about"
          className="transition-colors hover:text-foreground/80 text-foreground/60"
        >
          Haqida
        </Link>
      </nav>
    ) : null
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block font-headline">
              inDizayn
            </span>
          </Link>
          {navContent}
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <form>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Qidiruv..."
                  className="w-full pl-8 md:w-[200px] lg:w-[336px]"
                />
              </div>
            </form>
          </div>
          <nav className="flex items-center">
             {!isUserLoading && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'Foydalanuvchi'} />
                        <AvatarFallback>{user.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/account">Boshqaruv paneli</Link></DropdownMenuItem>
                    <DropdownMenuItem>Sozlamalar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>Chiqish</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  {!isUserLoading && isMobile === false && (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" asChild>
                            <Link href="/auth">Kirish</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/auth">Ro'yxatdan o'tish</Link>
                        </Button>
                    </div>
                  )}
                </>
              )}
          </nav>
        </div>
      </div>
    </header>
  )
}
