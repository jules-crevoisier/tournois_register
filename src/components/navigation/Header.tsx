"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Menu, X, Trophy, User, LogIn, LogOut, Shield, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/tournaments", label: "Tournois" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER"

  const handleSignOut = async () => {
    setMobileMenuOpen(false)
    await signOut({ callbackUrl: "/" })
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            onClick={closeMobileMenu}
          >
            <Trophy className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">TournoisGG</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Navigation principale">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}

            {status === "authenticated" && session.user && (
              <>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    {session.user.name || session.user.email?.split("@")[0]}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Deconnexion
                </Button>
              </>
            )}

            {status === "unauthenticated" && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Connexion
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">
                    <User className="h-4 w-4 mr-2" />
                    S&apos;inscrire
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center p-2 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="mx-auto max-w-7xl px-4 py-4 space-y-1" role="navigation" aria-label="Navigation mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={cn(
                  "flex items-center px-3 py-3 text-base font-medium rounded-md min-h-[44px] transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t border-border space-y-2">
              {status === "loading" && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {status === "authenticated" && session?.user && (
                <>
                  {isAdmin && (
                    <Button variant="outline" className="w-full min-h-[44px]" asChild onClick={closeMobileMenu}>
                      <Link href="/admin">
                        <Shield className="h-4 w-4 mr-2" />
                        Administration
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full min-h-[44px]" asChild onClick={closeMobileMenu}>
                    <Link href="/profile">
                      <User className="h-4 w-4 mr-2" />
                      Mon profil
                    </Link>
                  </Button>
                  <Button variant="destructive" className="w-full min-h-[44px]" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Deconnexion
                  </Button>
                </>
              )}

              {status === "unauthenticated" && (
                <>
                  <Button variant="outline" className="w-full min-h-[44px]" asChild onClick={closeMobileMenu}>
                    <Link href="/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Connexion
                    </Link>
                  </Button>
                  <Button className="w-full min-h-[44px]" asChild onClick={closeMobileMenu}>
                    <Link href="/register">
                      <User className="h-4 w-4 mr-2" />
                      S&apos;inscrire
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
