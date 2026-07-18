import { getDashboardPageData } from "./actions";
import ClientView from "./client.view";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { logPortalServerEvent } from "@/lib/server-log";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getAuthSession();
  if (!session?.user.id) {
    redirect("/login");
  }

  try {
    const {
      ssidInfo,
      customerInfo,
      dashboardStatus,
      trafficUsage,
      trafficUsageEnabled,
      trafficLiveEnabled,
    } = await getDashboardPageData();

    if (!ssidInfo) {
      return (
        <div className="w-full min-h-[100dvh] flex items-center justify-center p-4">
          {/* Deliberately does NOT blame the customer's connection: they reached
              this page, so their internet works. The cause is on our side. */}
          <Alert variant="destructive" className="max-w-lg">
            <AlertTitle>Data perangkat belum bisa ditampilkan</AlertTitle>
            <AlertDescription>
              Kami sedang tidak bisa mengambil data perangkat Anda. Coba muat
              ulang halaman ini beberapa saat lagi. Kalau terus berulang,
              hubungi admin lewat WhatsApp.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <ClientView
        ssidInfo={ssidInfo}
        customerInfo={customerInfo}
        dashboardStatus={dashboardStatus}
        trafficUsage={trafficUsage}
        trafficUsageEnabled={trafficUsageEnabled}
        trafficLiveEnabled={trafficLiveEnabled}
      />
    );
  } catch (error) {
    logPortalServerEvent("error", "dashboard_page_load_error", {
      domain: "dashboard",
      customerId: session.user.id,
      error: error instanceof Error ? error.message : "unknown_error",
    });
    if (error instanceof Error && error.message.includes("not authenticated")) {
      redirect("/login?reason=session-expired");
    }

    return (
      <div className="w-full min-h-[100dvh] flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>Halaman gagal dimuat</AlertTitle>
          <AlertDescription>
            Terjadi kendala saat memuat dasbor Anda. Silakan muat ulang halaman
            ini beberapa saat lagi.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
