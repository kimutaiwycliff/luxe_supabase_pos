import { Suspense } from "react";
import { LayoutSkeleton } from "@/components/layout/layout-skeleton";
import { getCurrentUser } from "@/lib/actions/auth";
import { Navbar, Sheet } from "@/components/layout/navbar";

export async function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar user={user} />
      <main className="flex-1 container mx-auto px-4 py-6">
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
