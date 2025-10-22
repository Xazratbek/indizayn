"use client"

import Link from "next/link"
import { Search, Menu, Home, Compass, Users, PlusSquare, MessageSquare } from "lucide-react"
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
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { Skeleton } from "./ui/skeleton"
import NotificationsDropdown from "./notifications-dropdown"
import { cn } from "@/lib/utils"

export function Header() {
  const isMobile = useIsMobile();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isUserLoading = status === 'loading';
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  }

  const handleSignIn = () => {
    signIn('google');
  }

  const navItems = [
    { href: "/browse", label: "Loyihalar" },
    { href: "/designers", label: "Dizaynerlar" },
    { href: "/messages", label: "Xabarlar" },
    { href: "/about", label: "Haqida" },
  ];

  const navContent = isMobile === undefined ? null : (
    !isMobile ? (
      <nav className="flex items-center gap-6 text-base">
        {navItems.map((item) => (
           <Link
              key={item.href}
              href={item.href}
              className={cn(
                "font-medium transition-colors hover:text-foreground/80",
                pathname.startsWith(item.href)
                  ? "text-foreground font-bold"
                  : "text-foreground/60"
              )}
            >
              {item.label}
            </Link>
        ))}
      </nav>
    ) : null
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6 lg:px-8">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block font-headline text-lg">
              inDizayn
            </span>
          </Link>
          {navContent}
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search can be implemented later */}
          </div>
          <nav className="flex items-center gap-2">
             {isUserLoading ? (
               <Skeleton className="h-8 w-8 rounded-full" />
             ) : user ? (
               <>
                {isMobile === false && (
                  <Button asChild size="sm">
                    <Link href="/account/new-project"><PlusSquare className="mr-2 h-4 w-4"/> Loyiha Yuklash</Link>
                  </Button>
                )}
                
                <NotificationsDropdown />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image ?? ''} alt={user.name ?? 'Foydalanuvchi'} />
                        <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() ?? 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/account">Boshqaruv paneli</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/account/projects">Mening loyihalarim</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/account/edit">Profilni tahrirlash</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/account/stats">Statistika</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>Chiqish</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
               </>
              ) : (
                <>
                  {isMobile === false && (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={handleSignIn}>
                            Kirish
                        </Button>
                        <Button onClick={handleSignIn}>
                            Ro'yxatdan o'tish
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
