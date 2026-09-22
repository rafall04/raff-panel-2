"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  Loader2,
  Minus,
  Plus,
  Receipt,
  RefreshCw,
  Ticket,
  Wifi,
} from "lucide-react";

import {
  checkVoucherUsername,
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { StatusPill, type StatusTone } from "@/components/ui/status";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currencyFormatter, formatDateTime } from "@/lib/format";

/** Jeda polling status: cukup responsif terasa langsung, cukup jarang agar tidak membanjiri BFF. */
const POLL_INTERVAL_MS = 4000;
/** Berhenti memolling setelah ini; QRIS iPaymu sendiri kedaluwarsa jauh lebih dulu. */
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

type Step = "catalog" | "review" | "pay" | "result";

const STATE_LABEL: Record<VoucherPurchaseState, string> = {
  pending: "Menunggu pembayaran",
  processing: "Menerbitkan voucher",
  completed: "Selesai",
  failed: "Perlu bantuan admin",
};

// Warna tidak pernah jadi satu-satunya penanda — StatusPill selalu berpasangan dengan label
// teks di atas (aturan design-system/MASTER.md).
const STATE_TONE: Record<VoucherPurchaseState, StatusTone> = {
  pending: "pending",
  processing: "pending",
  completed: "online",
  failed: "offline",
};

/** Daftar kode terurut — `voucherCodes` dari backend baru, fallback memecah `voucherCode` lama. */
function codesOf(purchase: VoucherPurchase): string[] {
  if (purchase.voucherCodes && purchase.voucherCodes.length > 0) {
    return purchase.voucherCodes;
  }
  return (purchase.voucherCode ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function qtyOf(purchase: VoucherPurchase): number {
  return purchase.qty && purchase.qty > 1 ? purchase.qty : 1;
}

async function copyAllCodes(codes: string[]) {
  try {
    await navigator.clipboard.writeText(codes.join("\n"));
    toast.success(`${codes.length} kode voucher disalin`);
  } catch {
    toast.error("Gagal menyalin. Salin manual kode di layar.");
  }
}

function StateBadge({ state }: { state: VoucherPurchaseState }) {
  return (
    <StatusPill tone={STATE_TONE[state]} pulse={state === "processing"}>
      {STATE_LABEL[state]}
    </StatusPill>
  );
}

/** Satu baris rincian biaya. `emphasis` untuk baris total. */
function CostRow({
  label,
  value,
  emphasis = false,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span
        className={
          emphasis ? "text-sm font-semibold" : "text-sm text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          emphasis
            ? "tabular text-base font-bold"
            : "tabular text-sm font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}

/** Kode voucher + tombol salin. Monospace supaya 0/O dan 1/l terbaca jelas. */
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
      <code className="tabular flex-1 select-all rounded-lg border border-brand/25 bg-brand/10 px-3 py-2.5 font-mono text-lg font-semibold tracking-[0.15em] text-brand">
        {code}
      </code>
      <Button
        type="button"
        variant="outline"
        size="icon"
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
  onPick,
}: {
  item: VoucherPackage;
  disabled: boolean;
  onPick: (item: VoucherPackage) => void;
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
        onClick={() => onPick(item)}
      >
        Pilih paket
        <ArrowRight />
      </Button>
    </div>
  );
}

/** Struk pembayaran, meniru halaman beli publik. Hanya untuk transaksi yang sudah lunas. */
function Invoice({
  purchase,
  packageName,
}: {
  purchase: VoucherPurchase;
  packageName: string;
}) {
  return (
    <div className="tile space-y-0 divide-y divide-border/60">
      <div className="flex items-center gap-2 pb-2 text-sm font-semibold">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        Struk Pembayaran
      </div>
      <CostRow label="No. Transaksi" value={purchase.reff} />
      <CostRow
        label="Waktu"
        value={purchase.createdAt ? formatDateTime(purchase.createdAt) : "-"}
      />
      <CostRow label="Paket" value={packageName} />
      {qtyOf(purchase) > 1 ? (
        <CostRow label="Jumlah voucher" value={`${qtyOf(purchase)} pcs`} />
      ) : null}
      <CostRow
        label={
          qtyOf(purchase) > 1
            ? `Harga voucher ×${qtyOf(purchase)}`
            : "Harga voucher"
        }
        value={currencyFormatter.format(purchase.subtotal)}
      />
      <CostRow
        label="Biaya admin QRIS"
        value={currencyFormatter.format(purchase.fee)}
      />
      <CostRow
        label="Total dibayar"
        value={currencyFormatter.format(purchase.total ?? purchase.subtotal)}
        emphasis
      />
      <CostRow label="Metode" value="QRIS" />
      <div className="flex items-baseline justify-between gap-3 py-2">
        <span className="text-sm text-muted-foreground">Status</span>
        <StatusPill tone="online">LUNAS</StatusPill>
      </div>
    </div>
  );
}

function HowToUse() {
  const steps = [
    "Sambungkan HP atau laptop ke WiFi hotspot kami.",
    "Buka browser — halaman login biasanya muncul otomatis.",
    "Masukkan kode voucher di atas, lalu tekan Connect.",
  ];
  return (
    <div className="tile">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Wifi className="h-4 w-4 text-muted-foreground" />
        Cara pakai voucher
      </div>
      <ol className="space-y-2.5">
        {steps.map((text, index) => (
          <li key={text} className="flex gap-2.5 text-sm leading-relaxed">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/12 text-[11px] font-bold text-brand">
              {index + 1}
            </span>
            {text}
          </li>
        ))}
      </ol>
    </div>
  );
}

function HistoryRow({ row }: { row: VoucherPurchase }) {
  const codes = codesOf(row);
  return (
    <li className="bg-card p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {row.prof ?? "Voucher"}
            {qtyOf(row) > 1 ? (
              <span className="ml-1.5 text-muted-foreground">
                ×{qtyOf(row)}
              </span>
            ) : null}
          </p>
          <p className="tabular mt-0.5 text-sm text-muted-foreground">
            {currencyFormatter.format(row.total ?? row.amount)}
            {row.createdAt ? ` · ${formatDateTime(row.createdAt)}` : null}
          </p>
        </div>
        <StateBadge state={row.state} />
      </div>
      {codes.length > 0 ? (
        <div className="mt-3 space-y-2">
          {codes.map((code) => (
            <VoucherCode key={code} code={code} />
          ))}
          {codes.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => void copyAllCodes(codes)}
            >
              <Copy />
              Salin semua ({codes.length})
            </Button>
          ) : null}
        </div>
      ) : null}
      {row.partial ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Baru {codes.length} dari {qtyOf(row)} voucher yang terbit — sisanya
          sedang diproses admin.
        </p>
      ) : null}
      {row.state === "failed" ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sudah dibayar tetapi voucher gagal terbit. Admin sudah diberi tahu —
          sebutkan Ref <span className="tabular font-semibold">{row.reff}</span>{" "}
          saat menghubungi.
        </p>
      ) : null}
    </li>
  );
}

export default function VoucherView({
  packages,
  initialHistory,
  qrisFeeRate,
  notifyPhone,
  multiBuy,
  customCreds,
}: {
  packages: VoucherPackage[];
  initialHistory: VoucherPurchase[];
  qrisFeeRate: number;
  notifyPhone: string | null;
  multiBuy: { enabled: boolean; maxQty: number };
  customCreds: { enabled: boolean };
}) {
  const [history, setHistory] = React.useState(initialHistory);
  const [step, setStep] = React.useState<Step>("catalog");
  const [selected, setSelected] = React.useState<VoucherPackage | null>(null);
  const [qty, setQty] = React.useState(1);
  // Kredensial pilihan pembeli — hanya berlaku qty=1 dan saat gate backend ON.
  const [customUser, setCustomUser] = React.useState("");
  const [customPass, setCustomPass] = React.useState("");
  const [cuserStatus, setCuserStatus] = React.useState<
    "idle" | "checking" | "ok" | "taken" | "invalid" | "error"
  >("idle");
  const [cuserMsg, setCuserMsg] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [active, setActive] = React.useState<VoucherPurchase | null>(null);

  const activeReff = active?.reff ?? null;
  const activeState = active?.state ?? null;
  const shouldPoll =
    step === "pay" &&
    (activeState === "pending" || activeState === "processing");

  const packageNameFor = React.useCallback(
    (prof: string | null) =>
      packages.find((p) => p.prof === prof)?.name ?? prof ?? "Voucher",
    [packages],
  );

  const applyPurchase = React.useCallback((next: VoucherPurchase) => {
    setActive(next);
    // "processing" tetap di layar bayar (QR sudah tak relevan tapi belum ada kode);
    // begitu final, pindah ke layar hasil.
    if (next.state === "completed" || next.state === "failed") {
      setStep("result");
    }
  }, []);

  // Polling status transaksi berjalan. Berhenti pada state final, saat 404 (transaksi
  // hilang / bukan milik kita — tak akan pernah berubah), atau setelah timeout.
  React.useEffect(() => {
    if (!activeReff || !shouldPoll) {
      return;
    }

    // Objek mutable, bukan `let` boolean — TypeScript mempersempit boolean ke `false` dan
    // menandai guard setelah `await` sebagai kondisi mati, padahal cleanup memang
    // menyetelnya di antara dua tick.
    const run = { alive: true };
    const startedAt = Date.now();

    const timer = setInterval(() => {
      void (async () => {
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
        applyPurchase(next);

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
  }, [activeReff, shouldPoll, applyPurchase]);

  /**
   * Estimasi pra-transaksi, dihitung dari SUBTOTAL batch (harga × qty), bukan harga
   * satuan — biaya admin menempel pada nilai yang ditagihkan. `ceil` agar tak pernah
   * kurang dari fee asli.
   */
  const effectiveQty = multiBuy.enabled
    ? Math.min(Math.max(1, qty), multiBuy.maxQty)
    : 1;
  const reviewSubtotal = selected ? selected.price * effectiveQty : 0;
  const estimatedFee = Math.ceil(reviewSubtotal * qrisFeeRate);

  // Username kustom: field terkunci saat qty>1 — satu username tak bisa dibagi banyak voucher.
  const credsLocked = effectiveQty > 1;
  const normalizedUser = customUser.trim().toLowerCase();

  // Probe ketersediaan username (debounced). Jawaban sementara — validasi final tetap
  // di backend saat createPurchase (lock per-username di sana).
  React.useEffect(() => {
    if (!customCreds.enabled || !normalizedUser || credsLocked) {
      setCuserStatus("idle");
      setCuserMsg("");
      return;
    }
    if (!/^[a-z0-9_-]{3,16}$/.test(normalizedUser)) {
      setCuserStatus("invalid");
      setCuserMsg("Hanya huruf kecil/angka plus - dan _ (3-16 karakter).");
      return;
    }
    setCuserStatus("checking");
    setCuserMsg("Memeriksa ketersediaan…");
    const run = { alive: true };
    const timer = setTimeout(() => {
      void (async () => {
        const res = await checkVoucherUsername(normalizedUser);
        if (!run.alive) {
          return;
        }
        if (res.available) {
          setCuserStatus("ok");
          setCuserMsg(`Username "${res.username ?? normalizedUser}" tersedia.`);
        } else if (res.status === 503 || !res.message) {
          setCuserStatus("error");
          setCuserMsg(
            "Gagal memeriksa ketersediaan — sistem cek ulang saat pembayaran.",
          );
        } else {
          setCuserStatus("taken");
          setCuserMsg(res.message);
        }
      })();
    }, 400);
    return () => {
      run.alive = false;
      clearTimeout(timer);
    };
  }, [customCreds.enabled, normalizedUser, credsLocked]);

  function pickPackage(item: VoucherPackage) {
    setSelected(item);
    setQty(1);
    setCustomUser("");
    setCustomPass("");
    setCuserStatus("idle");
    setCuserMsg("");
    setStep("review");
  }

  async function confirmPurchase() {
    if (!selected) {
      return;
    }
    // Kredensial kustom bila diisi — backend menolak username yang sudah dipakai.
    const wantsCustom =
      customCreds.enabled && !credsLocked && normalizedUser !== "";
    if (wantsCustom) {
      if (cuserStatus === "checking") {
        toast.error(
          "Tunggu sebentar — sedang memeriksa ketersediaan username.",
        );
        return;
      }
      if (cuserStatus === "invalid" || cuserStatus === "taken") {
        toast.error("Perbaiki username voucher dulu.");
        return;
      }
      const pass = customPass.trim();
      if (pass !== "" && !/^\S{3,64}$/.test(pass)) {
        toast.error("Password voucher 3-64 karakter tanpa spasi.");
        return;
      }
    }
    setCreating(true);
    try {
      const result = await createVoucherPurchase(
        selected.prof,
        effectiveQty,
        wantsCustom
          ? {
              username: normalizedUser,
              password: customPass.trim() || undefined,
            }
          : undefined,
      );
      if (!result.success || !result.data) {
        toast.error(result.message);
        return;
      }
      setActive({
        reff: result.data.reff,
        state: "pending",
        paid: false,
        prof: result.data.prof,
        qty: result.data.qty ?? effectiveQty,
        amount: result.data.amount,
        subtotal: result.data.amount,
        fee: result.data.fee,
        total: result.data.total,
        qrString: result.data.qrString,
        voucherCode: null,
        voucherCodes: [],
        partial: false,
        customUser: wantsCustom ? normalizedUser : null,
        customPass: wantsCustom ? customPass.trim() || normalizedUser : null,
        createdAt: Date.now(),
        expiredAt: result.data.expiredAt,
      });
      setStep("pay");
    } finally {
      setCreating(false);
    }
  }

  async function checkNow() {
    if (!activeReff) {
      return;
    }
    setChecking(true);
    try {
      const result = await getVoucherPurchaseStatus(activeReff);
      if (!result.success || !result.data) {
        toast.error(result.message || "Gagal memeriksa status.");
        return;
      }
      applyPurchase(result.data);
      if (result.data.state === "pending") {
        toast.info("Pembayaran belum masuk. Coba lagi beberapa saat lagi.");
      } else {
        setHistory(await getVoucherHistory());
      }
    } finally {
      setChecking(false);
    }
  }

  /** Unduh PNG QRIS lewat BFF (yang memverifikasi kepemilikan sebelum meneruskan). */
  async function downloadQr() {
    if (!activeReff) {
      return;
    }
    setDownloading(true);
    try {
      const response = await fetch(
        `/api/vouchers/qr/${encodeURIComponent(activeReff)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        toast.error("Gagal mengunduh kode QR.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `qris-${activeReff}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Kode QR diunduh");
    } catch {
      toast.error("Gagal mengunduh kode QR.");
    } finally {
      setDownloading(false);
    }
  }

  async function startOver() {
    setStep("catalog");
    setSelected(null);
    setActive(null);
    setHistory(await getVoucherHistory());
  }

  const header = (
    <PageHeader
      icon={Ticket}
      eyebrow="Layanan Tambahan"
      title="Voucher Hotspot"
      description="Beli voucher WiFi dengan QRIS. Kode dikirim ke WhatsApp Anda dan tersimpan di halaman ini."
    />
  );

  // ── Langkah 2: konfirmasi. Belum ada transaksi yang dibuat di titik ini. ──────────
  if (step === "review" && selected) {
    return (
      <div className="space-y-6">
        {header}
        <Button
          type="button"
          variant="ghost"
          className="px-2"
          onClick={() => setStep("catalog")}
        >
          <ArrowLeft />
          Kembali ke daftar paket
        </Button>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">{selected.name}</p>
                {selected.duration ? (
                  <p className="text-sm text-muted-foreground">
                    Berlaku {selected.duration}
                  </p>
                ) : null}
              </div>
              <span className="icon-chip h-10 w-10">
                <Ticket className="h-[18px] w-[18px]" />
              </span>
            </div>

            {/* Stepper hanya dirender saat backend membuka gate — tanpa itu pembelian
                tetap 1 voucher dan pelanggan tidak melihat kontrol yang akan ditolak. */}
            {multiBuy.enabled ? (
              <div className="tile flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Jumlah voucher</p>
                  <p className="text-xs text-muted-foreground">
                    Maksimal {multiBuy.maxQty} per transaksi
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={effectiveQty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Kurangi jumlah voucher"
                  >
                    <Minus />
                  </Button>
                  <span className="tabular w-10 text-center text-lg font-bold">
                    {effectiveQty}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={effectiveQty >= multiBuy.maxQty}
                    onClick={() =>
                      setQty((q) => Math.min(multiBuy.maxQty, q + 1))
                    }
                    aria-label="Tambah jumlah voucher"
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Kredensial pilihan pembeli — hanya saat backend membuka gate, dan hanya
                bermakna untuk 1 voucher (terkunci saat stepper menaikkan jumlah). */}
            {customCreds.enabled ? (
              <div
                className={`tile space-y-3 ${credsLocked ? "opacity-60" : ""}`}
              >
                <div>
                  <p className="text-sm font-medium">
                    Username &amp; password sendiri{" "}
                    <span className="font-normal text-muted-foreground">
                      (opsional)
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {credsLocked
                      ? "Hanya untuk pembelian 1 voucher — turunkan jumlah ke 1 untuk memakainya."
                      : "Kosongkan untuk voucher dengan kode acak."}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Input
                    value={customUser}
                    onChange={(e) => setCustomUser(e.target.value)}
                    placeholder="Username voucher, cth: adi_net"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={16}
                    disabled={credsLocked}
                  />
                  {normalizedUser !== "" ? (
                    <p
                      className={`text-xs ${
                        cuserStatus === "ok"
                          ? "text-success"
                          : cuserStatus === "error"
                            ? "text-warning"
                            : cuserStatus === "checking"
                              ? "text-muted-foreground"
                              : "text-destructive"
                      }`}
                    >
                      {cuserMsg}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Huruf kecil/angka plus - dan _ (3-16 karakter).
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Input
                    value={customPass}
                    onChange={(e) => setCustomPass(e.target.value)}
                    placeholder="Password — kosong = sama dengan username"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={64}
                    disabled={credsLocked}
                  />
                </div>
              </div>
            ) : null}

            <div className="tile space-y-0 divide-y divide-border/60">
              <CostRow
                label="Kirim kode ke"
                value={notifyPhone ?? "Nomor belum terdaftar"}
              />
              {customCreds.enabled && !credsLocked && normalizedUser !== "" ? (
                <CostRow label="Username" value={normalizedUser} />
              ) : null}
              {effectiveQty > 1 ? (
                <CostRow
                  label="Harga satuan"
                  value={currencyFormatter.format(selected.price)}
                />
              ) : null}
              <CostRow
                label={
                  effectiveQty > 1
                    ? `Harga voucher ×${effectiveQty}`
                    : "Harga voucher"
                }
                value={currencyFormatter.format(reviewSubtotal)}
              />
              <CostRow
                label="Biaya admin QRIS"
                value={currencyFormatter.format(estimatedFee)}
              />
              <CostRow
                label="Total bayar"
                value={currencyFormatter.format(reviewSubtotal + estimatedFee)}
                emphasis
              />
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Total di atas{" "}
              <strong className="text-foreground">
                sudah termasuk biaya admin QRIS
              </strong>
              . Kode QR baru dibuat setelah Anda menekan tombol di bawah — jadi
              kalau batal di sini, tidak ada transaksi yang terbuat.
            </p>

            <Button
              type="button"
              className="w-full"
              disabled={creating}
              onClick={() => void confirmPurchase()}
            >
              {creating ? (
                <>
                  <Loader2 className="animate-spin" />
                  Membuat kode QR…
                </>
              ) : (
                <>
                  Buat Kode QR &amp; Bayar
                  <ArrowRight />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Langkah 3: bayar. QR + rincian NYATA dari transaksi. ─────────────────────────
  if (step === "pay" && active) {
    return (
      <div className="space-y-6">
        {header}
        <Card className="border-brand/30">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold">
                  {packageNameFor(active.prof)}
                </p>
                <p className="tabular text-sm text-muted-foreground">
                  Ref {active.reff}
                </p>
              </div>
              <StateBadge state={active.state} />
            </div>

            {active.state === "pending" ? (
              <>
                <div className="flex flex-col items-center gap-3">
                  {/* PNG diambil lewat BFF, yang memverifikasi kepemilikan lebih dulu. */}
                  <div className="rounded-xl border bg-white p-3">
                    <Image
                      src={`/api/vouchers/qr/${encodeURIComponent(active.reff)}`}
                      alt={`Kode QRIS untuk pembayaran ${packageNameFor(active.prof)}`}
                      width={220}
                      height={220}
                      unoptimized
                      className="h-[220px] w-[220px]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={downloading}
                    onClick={() => void downloadQr()}
                  >
                    {downloading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Download />
                    )}
                    Download QR
                  </Button>
                </div>

                <div className="tile space-y-0 divide-y divide-border/60">
                  {qtyOf(active) > 1 ? (
                    <CostRow
                      label="Jumlah voucher"
                      value={`${qtyOf(active)} pcs`}
                    />
                  ) : null}
                  <CostRow
                    label={
                      qtyOf(active) > 1
                        ? `Harga voucher ×${qtyOf(active)}`
                        : "Harga voucher"
                    }
                    value={currencyFormatter.format(active.subtotal)}
                  />
                  <CostRow
                    label="Biaya admin QRIS"
                    value={currencyFormatter.format(active.fee)}
                  />
                  <CostRow
                    label="Total pembayaran"
                    value={currencyFormatter.format(
                      active.total ?? active.subtotal,
                    )}
                    emphasis
                  />
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  Pindai dengan aplikasi bank atau e-wallet apa pun yang
                  mendukung QRIS. Halaman ini memperbarui sendiri begitu
                  pembayaran masuk — tidak perlu di-refresh.
                </p>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={checking}
                    onClick={() => void checkNow()}
                  >
                    {checking ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <RefreshCw />
                    )}
                    Sudah bayar? Cek sekarang
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => void startOver()}
                  >
                    Batalkan
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Pembayaran diterima. Voucher sedang diterbitkan, mohon tunggu
                  sebentar.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={checking}
                  onClick={() => void checkNow()}
                >
                  {checking ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <RefreshCw />
                  )}
                  Periksa lagi
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Langkah 4: hasil. Struk lengkap bila lunas, atau jalur bantuan admin. ────────
  if (step === "result" && active) {
    const codes = codesOf(active);
    const isDone = active.state === "completed" && codes.length > 0;
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col items-center text-center">
              <span
                className={
                  isDone
                    ? "icon-chip-solid mb-3 h-14 w-14"
                    : "mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/12 text-destructive ring-1 ring-inset ring-destructive/25"
                }
              >
                {isDone ? (
                  <Check className="h-7 w-7" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </span>
              <p className="text-lg font-bold">
                {isDone ? "Pembayaran berhasil" : "Pembayaran diterima"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {isDone
                  ? "Voucher WiFi Anda sudah aktif dan siap dipakai."
                  : "Voucher gagal terbit otomatis. Admin sudah mendapat notifikasi dan akan mengirim kode Anda secara manual."}
              </p>
            </div>

            {isDone ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="eyebrow">
                    {codes.length > 1
                      ? `Kode voucher Anda (${codes.length})`
                      : "Kode voucher Anda"}
                  </p>
                  {codes.length > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void copyAllCodes(codes)}
                    >
                      <Copy />
                      Salin semua
                    </Button>
                  ) : null}
                </div>
                {codes.map((code) => (
                  <VoucherCode key={code} code={code} />
                ))}
                {/* Kredensial kustom: kode di atas = username; password tampil terpisah. */}
                {active.customPass ? (
                  <div className="tile flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Password</p>
                      <p className="font-mono text-base font-bold">
                        {active.customPass}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void copyAllCodes([String(active.customPass)])
                      }
                    >
                      <Copy />
                      Salin
                    </Button>
                  </div>
                ) : null}
                {active.partial ? (
                  <div className="flex gap-3 rounded-xl border border-warning/25 bg-warning/10 p-3.5">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                    <p className="text-sm leading-relaxed">
                      Baru {codes.length} dari {qtyOf(active)} voucher yang
                      terbit. Sisanya sedang diproses admin dan akan dikirim ke
                      WhatsApp Anda — tidak perlu membeli ulang.
                    </p>
                  </div>
                ) : null}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Salinannya juga dikirim ke WhatsApp Anda
                  {notifyPhone ? ` (${notifyPhone})` : ""}. Simpan sebagai
                  bukti.
                </p>
              </div>
            ) : (
              <div className="flex gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-3.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm leading-relaxed">
                  Sebutkan nomor Ref{" "}
                  <span className="tabular font-semibold">{active.reff}</span>{" "}
                  saat menghubungi admin agar lebih cepat ditelusuri.
                </p>
              </div>
            )}

            <Invoice
              purchase={active}
              packageName={packageNameFor(active.prof)}
            />

            {isDone ? <HowToUse /> : null}

            <Button
              type="button"
              className="w-full"
              onClick={() => void startOver()}
            >
              {isDone ? "Beli Voucher Lagi" : "Selesai"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Langkah 1: katalog + riwayat. Riwayat jadi tab tersendiri, bukan dikubur di
  //    bawah daftar paket, supaya pelanggan tahu kode lamanya bisa dilihat lagi. ───
  return (
    <div className="space-y-6">
      {header}
      <Tabs defaultValue="beli">
        <TabsList className="w-full">
          <TabsTrigger value="beli" className="flex-1">
            Beli Voucher
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="flex-1">
            Riwayat
            {history.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-brand/15 px-1.5 py-0.5 text-[11px] font-bold text-brand">
                {history.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="beli" className="space-y-3 pt-4">
          <SectionHeading
            title="Pilih paket"
            description="Biaya admin QRIS ditampilkan di langkah berikutnya, sebelum Anda membayar."
          />
          {packages.length > 0 ? (
            <div className="grid gap-3 xs:grid-cols-2 lg:grid-cols-3">
              {packages.map((item) => (
                <PackageCard
                  key={item.prof}
                  item={item}
                  disabled={false}
                  onPick={pickPackage}
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
        </TabsContent>

        <TabsContent value="riwayat" className="space-y-3 pt-4">
          <SectionHeading
            title="Riwayat pembelian"
            description="20 transaksi terakhir Anda, beserta kode vouchernya."
          />
          {history.length > 0 ? (
            <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border">
              {history.map((row) => (
                <HistoryRow key={row.reff} row={row} />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Receipt}
              title="Belum ada pembelian"
              description="Voucher yang Anda beli akan muncul di sini beserta kodenya, jadi kode lama tidak akan hilang."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
