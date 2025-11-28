import { Suspense } from "react";
import { LayoutSkeleton } from "@/components/layout/layout-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cookies } from "next/headers";

export async function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">

        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Suspense fallback={<LayoutSkeleton />}>
            <SidebarWrapper>{children}</SidebarWrapper>
          </Suspense>
        </div>

      </div>
    </main>
  );
}
