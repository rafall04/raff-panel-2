import type { LucideIcon } from "lucide-react";
import {
  Activity,
  HelpCircle,
  History,
  LayoutDashboard,
  Rocket,
  Settings,
  Ticket,
  Wifi,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Short label for the bottom bar, where 10px type has ~7 characters to work with. */
  shortLabel?: string;
  icon: LucideIcon;
  /** One-line explanation, shown in the mobile overflow sheet. */
  description: string;
  /**
   * Lower wins a slot in the bottom bar. Ordered by what customers actually
   * open: status, Wi-Fi, the paid upsell, then billing history.
   */
  mobilePriority: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * The single source of truth for navigation. The desktop sidebar renders every
 * group; the mobile bar takes the four highest-priority items and pushes the
 * rest into an overflow sheet — so the two can never drift apart, and the bar
 * can never exceed the five-item limit no matter how many optional features a
 * site has switched on.
 */
export function getNavGroups({
  speedBoostEnabled,
  trafficEnabled,
  voucherEnabled = false,
}: {
  speedBoostEnabled: boolean;
  trafficEnabled: boolean;
  /** `customerVoucher.enabled` di backend — default OFF, jadi menu sembunyi kecuali dinyalakan. */
  voucherEnabled?: boolean;
}): NavGroup[] {
  return [
    {
      label: "Layanan",
      items: [
        {
          href: "/dashboard",
          label: "Beranda",
          icon: LayoutDashboard,
          description: "Status koneksi, perangkat, dan ringkasan akun",
          mobilePriority: 1,
        },
        {
          href: "/dashboard/wifi",
          label: "Wi-Fi",
          icon: Wifi,
          description: "Ubah nama dan kata sandi jaringan Anda",
          mobilePriority: 2,
        },
        ...(speedBoostEnabled
          ? [
              {
                href: "/dashboard/speed-boost",
                label: "Speed Boost",
                shortLabel: "Boost",
                icon: Rocket,
                description: "Tingkatkan kecepatan sementara",
                mobilePriority: 3,
              },
            ]
          : []),
        ...(voucherEnabled
          ? [
              {
                href: "/dashboard/vouchers",
                label: "Voucher",
                icon: Ticket,
                description: "Beli voucher hotspot dengan QRIS",
                mobilePriority: 4,
              },
            ]
          : []),
        ...(trafficEnabled
          ? [
              {
                href: "/dashboard/traffic",
                label: "Pemakaian",
                shortLabel: "Traffic",
                icon: Activity,
                description: "Pemakaian data harian dan bulanan",
                mobilePriority: 6,
              },
            ]
          : []),
      ],
    },
    {
      label: "Akun",
      items: [
        {
          href: "/dashboard/history",
          label: "Riwayat",
          icon: History,
          description: "Tagihan, laporan, Wi-Fi, dan perubahan paket",
          mobilePriority: 5,
        },
        {
          href: "/dashboard/knowledge-base",
          label: "Bantuan",
          icon: HelpCircle,
          description: "Pertanyaan umum dan kontak dukungan",
          mobilePriority: 7,
        },
        {
          href: "/dashboard/settings",
          label: "Pengaturan",
          shortLabel: "Akun",
          icon: Settings,
          description: "Profil, paket, kata sandi, dan perangkat",
          mobilePriority: 8,
        },
      ],
    },
  ];
}

/** How many nav destinations sit in the bar itself; the 5th slot is "Lainnya". */
const BOTTOM_BAR_SLOTS = 4;

/** Splits the flattened nav into the bottom bar and its overflow sheet. */
export function splitForBottomBar(groups: NavGroup[]): {
  primary: NavItem[];
  overflow: NavItem[];
} {
  const byPriority = groups
    .flatMap((group) => group.items)
    .sort((a, b) => a.mobilePriority - b.mobilePriority);

  const primary = byPriority.slice(0, BOTTOM_BAR_SLOTS);
  const primaryHrefs = new Set(primary.map((item) => item.href));

  return {
    primary,
    // Keep the sheet in the sidebar's reading order rather than priority order —
    // it is a menu, not a ranking.
    overflow: groups
      .flatMap((group) => group.items)
      .filter((item) => !primaryHrefs.has(item.href)),
  };
}
