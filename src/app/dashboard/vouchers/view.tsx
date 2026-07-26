"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Copy,
  Loader2,
  QrCode,
  Receipt,
  Ticket,
  X,
} from "lucide-react";

import {
  createVoucherPurchase,
  getVoucherHistory,
  getVoucherPurchaseStatus,
} from "../actions";
import type {
  VoucherPackage,
  VoucherPurchase,
  VoucherPurchaseState,
} from "@/services/voucher.service";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { StatusPill, type StatusTone } from "@/components/ui/status";
import { currencyFormatter, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Jeda polling status. Cukup responsif terasa "langsung", cukup jarang agar tidak membanjiri BFF. */
const POLL_INTERVAL_MS = 4000;
/** Berhenti memolling setelah ini; QRIS iPaymu sendiri kedaluwarsa jauh lebih dulu. */
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

const STATE_LABEL: Record<VoucherPurchaseState, string> = {
  pending: "Menunggu pembayaran",
  processing: "Menerbitkan voucher",
  completed: "Selesai",
  failed: "Perlu bantuan admin",
};

// Warna tidak pernah jadi satu-satunya penanda status — StatusPill selalu berpasangan
// dengan label teks di atas (aturan design-system/MASTER.md).
const STATE_TONE: Record<VoucherPurchaseState, StatusTone> = {
  pending: "pending",
  processing: "pending",
  completed: "online",
  failed: "offline",
};

function StateBadge({ state }: { state: VoucherPurchaseState }) {
  return (
    <StatusPill tone={STATE_TONE[state]} pulse={state === "processing"}>
      {STATE_LABEL[state]}
    </StatusPill>
  );
}

/** Kode voucher + tombol salin. Kode ditampilkan monospace agar 0/O dan 1/l terbaca jelas. */
function VoucherCode({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Kode voucher disalin");
    } catch {
      // clipboard butuh secure context / izin; kodenya tetap terlihat dan bisa disalin manual.
      toast.error("Gagal menyalin. Salin manual kode di layar.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="tabular flex-1 select-all rounded-lg border border-brand/25 bg-brand/10 px-3 py-2 font-mono text-base font-semibold tracking-wider text-brand">
        {code}
      </code>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => void handleCopy()}
        aria-label={`Salin kode voucher ${code}`}
      >
        {copied ? <Check className="text-success" /> : <Copy />}
      </Button>
    </div>
  );
}

function PackageCard({
  item,
  disabled,
  pending,
  onBuy,
}: {
  item: VoucherPackage;
  disabled: boolean;
  pending: boolean;
  onBuy: (item: VoucherPackage) => void;
}) {
  return (
    <div className="tile flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{item.name}</p>
          {item.duration ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Berlaku {item.duration}
            </p>
          ) : null}
        </div>
        {item.featured ? (
          <span className="status-pill shrink-0 bg-brand/12 text-brand ring-1 ring-inset ring-brand/25">
            Terlaris
          </span>
        ) : null}
      </div>

      <p className="tabular text-2xl font-bold leading-none tracking-tight">
        {currencyFormatter.format(item.price)}
      </p>

      <Button
        type="button"
        className="w-full"
        disabled={disabled}
        onClick={() => onBuy(item)}
      >
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Membuat tagihan…
          </>
        ) : (
          "Beli voucher"
        )}
      </Button>
    </div>
  );
}

export default function VoucherView({
  packages,
  initialHistory,
}: {
  packages: VoucherPackage[];
  initialHistory: VoucherPurchase[];
}) {
  const [history, setHistory] = React.useState(initialHistory);
  const [creatingProf, setCreatingProf] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<VoucherPurchase | null>(null);
  const [activePackageName, setActivePackageName] = React.useState<string>("");

  const activeReff = active?.reff ?? null;
  const activeState = active?.state ?? null;
  const shouldPoll = activeState === "pending" || activeState === "processing";

  // Polling status transaksi berjalan. Berhenti pada state final, saat 404 (transaksi hilang
  // / bukan milik kita — memolling terus tidak akan pernah berubah), atau setelah timeout.
  React.useEffect(() => {
    if (!activeReff || !shouldPoll) {
      return;
    }

    // Objek mutable, bukan `let cancelled` — TypeScript mempersempit variabel boolean ke
    // `false` dan menandai guard setelah `await` sebagai kondisi mati, padahal cleanup
    // memang menyetelnya di antara dua tick.
    const run = { alive: true };
    const startedAt = Date.now();

    const timer = setInterval(() => {
      void (async () => {
        // Tidak ada guard di sini: cleanup sudah clearInterval, jadi callback tak akan
        // menyala lagi setelah unmount. Yang perlu dijaga adalah SETELAH await di bawah,
        // saat efek bisa sudah dibersihkan selagi permintaan berjalan.
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          clearInterval(timer);
          return;
        }

        const result = await getVoucherPurchaseStatus(activeReff);
        if (!run.alive) {
          return;
        }

        if (!result.success) {
          if (result.notFound) {
            clearInterval(timer);
          }
          return;
        }

        const next = result.data;
        if (!next) {
          return;
        }
        setActive(next);

        if (next.state === "completed" || next.state === "failed") {
          clearInterval(timer);
          setHistory(await getVoucherHistory());
          if (next.state === "completed") {
            toast.success("Voucher berhasil diterbitkan");
          }
        }
      })();
    }, POLL_INTERVAL_MS);

    return () => {
      run.alive = false;
      clearInterval(timer);
    };
  }, [activeReff, shouldPoll]);

  async function handleBuy(item: VoucherPackage) {
    setCreatingProf(item.prof);
    try {
      const result = await createVoucherPurchase(item.prof);
      if (!result.success || !result.data) {
        toast.error(result.message);
        return;
      }

      setActivePackageName(result.data.packageName);
      setActive({
        reff: result.data.reff,
        state: "pending",
        paid: false,
        prof: result.data.prof,
        amount: result.data.amount,
        total: result.data.total,
        qrString: result.data.qrString,
        voucherCode: null,
        createdAt: Date.now(),
        expiredAt: result.data.expiredAt,
      });
    } finally {
      setCreatingProf(null);
    }
  }

  function dismissActive() {
    setActive(null);
    setActivePackageName("");
    void (async () => setHistory(await getVoucherHistory()))();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Ticket}
        eyebrow="Layanan Tambahan"
        title="Voucher Hotspot"
        description="Beli voucher WiFi dengan QRIS. Kode dikirim ke WhatsApp Anda dan tersimpan di halaman ini."
      />

      {active ? (
        <Card className="border-brand/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2.5">
                  <span className="icon-chip h-9 w-9">
                    <QrCode className="h-[18px] w-[18px]" />
                  </span>
                  {activePackageName || "Transaksi voucher"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {currencyFormatter.format(active.total ?? active.amount)} ·
                  Ref {active.reff}
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={dismissActive}
                aria-label="Tutup detail transaksi"
              >
                <X />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <StateBadge state={active.state} />

            {active.state === "pending" ? (
              <div className="flex flex-col items-center gap-3">
                {/* PNG diambil lewat BFF, yang memverifikasi kepemilikan sebelum meneruskan. */}
                <div className="rounded-xl border bg-white p-3">
                  <Image
                    src={`/api/vouchers/qr/${encodeURIComponent(active.reff)}`}
                    alt={`Kode QRIS untuk pembayaran ${activePackageName}`}
                    width={220}
                    height={220}
                    unoptimized
                    className="h-[220px] w-[220px]"
                  />
                </div>
                <p className="max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
                  Pindai dengan aplikasi bank atau e-wallet Anda. Halaman ini
                  memperbarui sendiri begitu pembayaran masuk — tidak perlu
                  di-refresh.
                </p>
              </div>
            ) : null}

            {active.state === "processing" ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Pembayaran diterima. Voucher sedang diterbitkan, mohon tunggu
                sebentar.
              </p>
            ) : null}

            {active.state === "completed" && active.voucherCode ? (
              <div className="space-y-2">
                <p className="eyebrow">Kode voucher Anda</p>
                <VoucherCode code={active.voucherCode} />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Hubungkan ke WiFi kami, lalu masukkan kode ini di halaman
                  login. Salinannya juga dikirim ke WhatsApp Anda.
                </p>
              </div>
            ) : null}

            {active.state === "failed" ? (
              <div className="flex gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-3.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm leading-relaxed">
                  Pembayaran Anda sudah diterima, tetapi voucher gagal terbit.
                  Admin sudah mendapat notifikasi dan akan mengirim kode Anda
                  secara manual. Simpan nomor Ref{" "}
                  <span className="tabular font-semibold">{active.reff}</span>.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <SectionHeading
          title="Pilih paket"
          description="Harga sudah final, tanpa biaya tambahan."
        />
        {packages.length > 0 ? (
          <div className="grid gap-3 xs:grid-cols-2 lg:grid-cols-3">
            {packages.map((item) => (
              <PackageCard
                key={item.prof}
                item={item}
                pending={creatingProf === item.prof}
                disabled={creatingProf !== null || active?.state === "pending"}
                onBuy={(pkg) => void handleBuy(pkg)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Ticket}
            title="Belum ada paket voucher"
            description="Admin belum menyiapkan paket voucher untuk lokasi Anda."
          />
        )}
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Riwayat pembelian"
          description="20 transaksi terakhir Anda."
        />
        {history.length > 0 ? (
          <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border">
            {history.map((row) => (
              <li key={row.reff} className="bg-card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {row.prof ?? "Voucher"}
                    </p>
                    <p className="tabular mt-0.5 text-sm text-muted-foreground">
                      {currencyFormatter.format(row.amount)}
                      {row.createdAt
                        ? ` · ${formatDateTime(row.createdAt)}`
                        : null}
                    </p>
                  </div>
                  <StateBadge state={row.state} />
                </div>
                {row.voucherCode ? (
                  <div className={cn("mt-3")}>
                    <VoucherCode code={row.voucherCode} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Receipt}
            title="Belum ada pembelian"
            description="Voucher yang Anda beli akan muncul di sini beserta kodenya."
          />
        )}
      </section>
    </div>
  );
}
