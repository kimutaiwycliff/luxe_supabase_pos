import { Suspense } from "react";
import { LayoutSkeleton } from "@/components/layout/layout-skeleton";
import { getCurrentUser } from "@/lib/actions/auth";
import { Navbar, Sheet } from "@/components/layout/navbar";
import { getOutOfStockCount } from "@/lib/actions/inventory";

export async function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const { count: outOfStockCount } = await getOutOfStockCount();

  return (
    <>
      <Navbar user={user} outOfStockCount={outOfStockCount} />
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {children}
      </main>
    </>
  )
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Sheet>
      <div className="min-h-screen flex flex-col">
        <Suspense fallback={<LayoutSkeleton />}>
          <NavbarWrapper>
            {children}
          </NavbarWrapper>
        </Suspense>
      </div>
    </Sheet>
  );
}
