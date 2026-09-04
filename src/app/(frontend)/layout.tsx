import { Toaster } from "@/components/ui/sonner"
import { Header } from "@/components/navigation/Header"
import { Footer } from "@/components/navigation/Footer"

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}
