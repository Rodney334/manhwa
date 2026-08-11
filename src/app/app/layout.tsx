import { AuthGuard } from "@/components/features/AuthGuard";
import { Sidebar } from "@/components/features/Sidebar";
import { Topbar } from "@/components/features/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-fond">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar />
          <main className="flex-1 px-5 lg:px-8 py-8 max-w-[1200px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
