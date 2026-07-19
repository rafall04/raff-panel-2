import type { MetadataRoute } from "next";
import { getCompanyName } from "./dashboard/actions";

// Brand name is per-tenant; during an unauthenticated manifest fetch it resolves
// to DEFAULT_SITE. Dynamic so it can read the session/site.
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const name = await getCompanyName().catch(() => "Portal Pelanggan");

  return {
    name: `${name} — Portal Pelanggan`,
    short_name: name,
    description: `Portal pelanggan ${name}: pantau status koneksi, tagihan, WiFi, dan laporan gangguan.`,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0e17",
    theme_color: "#0a0e17",
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        type: "image/png",
        sizes: "180x180",
        purpose: "maskable",
      },
    ],
  };
}
