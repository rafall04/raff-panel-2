import { getMonthlyPackages, getCustomerInfo } from "../actions";
import SettingsView from "./view";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  // Fetch all data concurrently for efficiency
  const [packages, customerInfo] = await Promise.all([
    getMonthlyPackages(),
    getCustomerInfo(),
  ]);

  // We need customer info, so it's a critical dependency
  if (!customerInfo) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={AlertTriangle}
          title="Gagal memuat pengaturan"
          description="Kami tidak bisa mengambil informasi akun Anda. Silakan coba lagi beberapa saat lagi."
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <SettingsView allPackages={packages} currentCustomerInfo={customerInfo} />
  );
}
