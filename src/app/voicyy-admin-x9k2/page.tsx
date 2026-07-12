import type { Metadata } from "next";

import { AdminAuth } from "@/components/admin/AdminAuth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import {
  AdminUnauthorizedError,
  listAgentRequestsForAdmin,
} from "@/lib/server/admin-data";
import { hasValidAdminSession } from "@/lib/server/admin-session";
import {
  DatabaseConfigurationError,
  DatabaseOperationError,
} from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Area riservata · Voicyy",
  robots: { index: false, follow: false, noarchive: true, noimageindex: true },
};

async function loadRequests() {
  try {
    return { requests: await listAgentRequestsForAdmin(), error: null };
  } catch (error) {
    return { requests: null, error };
  }
}

function ConfigurationNotice({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#080a0d] px-5 py-16 text-white">
      <div className="mx-auto max-w-lg rounded-[2rem] border border-amber-300/20 bg-amber-300/[0.06] p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Configurazione richiesta</p>
        <h1 className="mt-3 text-2xl font-bold">Dashboard non ancora collegata</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{message}</p>
        <form method="post" action="/api/admin/logout" className="mt-6">
          <button className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black">Esci</button>
        </form>
      </div>
    </main>
  );
}

export default async function AdminPage() {
  if (!(await hasValidAdminSession())) return <AdminAuth />;

  const result = await loadRequests();
  if (result.error instanceof AdminUnauthorizedError) return <AdminAuth />;
  if (
    result.error instanceof DatabaseConfigurationError ||
    result.error instanceof DatabaseOperationError
  ) {
    return <ConfigurationNotice message={result.error.message} />;
  }
  if (result.error) throw result.error;
  return <AdminDashboard requests={result.requests ?? []} />;
}
