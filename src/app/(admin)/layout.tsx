import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { Toaster } from "@/components/ui/sonner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <AdminSidebar />
      {/* Main content area */}
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-[100dvh]">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
