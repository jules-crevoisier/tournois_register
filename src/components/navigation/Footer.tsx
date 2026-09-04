"use client"

import Link from "next/link"
import { Trophy } from "lucide-react"

const footerLinks = {
  platform: [
    { href: "/tournaments", label: "Tournois" },
    { href: "/register", label: "Inscription" },
  ],
  support: [
    { href: "#", label: "FAQ" },
    { href: "#", label: "Contact" },
  ],
  legal: [
    { href: "#", label: "CGU" },
    { href: "#", label: "Confidentialité" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8 sm:py-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="flex items-center gap-2 text-foreground">
                <Trophy className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">TournoisGG</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                La plateforme de référence pour organiser et participer à des tournois esport.
              </p>
            </div>

            {/* Platform Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground">Plateforme</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground">Support</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground">Légal</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} TournoisGG. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
