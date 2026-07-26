"use client";

import React, { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import {
  ArrowRight,
  Smartphone,
  Key,
  Loader2,
  Router,
  Pencil,
  RotateCw,
  Eye,
  EyeOff,
  Activity,
  Receipt,
  Wifi,
  ShieldCheck,
} from "lucide-react";
import { requestOtp } from "@/utils/auth.server";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isValidIndonesianPhone, normalizePhoneNumber } from "@/lib/phone";

/** Seconds before the customer may ask for another OTP. */
const RESEND_COOLDOWN_SECONDS = 60;

/** Mirrors the backend's 5-minute OTP TTL so we can stop claiming it is valid. */
const OTP_VALID_SECONDS = 5 * 60;

const HIGHLIGHTS = [
  {
    icon: Activity,
    title: "Pantau koneksi real-time",
    body: "Status jaringan, perangkat terhubung, dan pemakaian data.",
  },
  {
    icon: Receipt,
    title: "Tagihan & riwayat transparan",
    body: "Paket aktif, jatuh tempo, dan seluruh riwayat dalam satu tempat.",
  },
  {
    icon: Wifi,
    title: "Kendali penuh atas Wi-Fi",
    body: "Ubah nama & kata sandi, reboot router, laporkan gangguan.",
  },
];

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function LoginForm({
  companyName,
  reason,
}: {
  companyName: string;
  reason: string | null;
}) {
  const isDevelopment = process.env.NODE_ENV === "development";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);

  const [loading, setLoading] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // One ticker drives both countdowns; it only runs while an OTP is outstanding.
  useEffect(() => {
    if (!otpSent) {
      return;
    }

    const intervalId = setInterval(() => {
      setResendIn((current) => (current > 0 ? current - 1 : 0));
      setOtpExpiresIn((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [otpSent]);

  // Put the cursor where the customer is about to type instead of making them
  // hunt for the field after switching back from WhatsApp.
  useEffect(() => {
    if (otpSent) {
      otpInputRef.current?.focus();
    }
  }, [otpSent]);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("username-password", {
        redirect: false,
        username,
        password,
      });

      if (result?.ok) {
        toast.success("Berhasil masuk. Mengalihkan...");
        window.location.href = "/dashboard";
        return;
      }

      toast.error(result?.error || "Username atau password salah.");
    } catch {
      // signIn fetches under the hood and rejects when the connection drops —
      // the normal case for an ISP portal, since customers open it precisely
      // when their internet is broken. Without this the button would spin
      // forever, disabled, with no message and no way out but a reload.
      toast.error("Tidak bisa terhubung ke server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (isResend: boolean) => {
    // Normalize first: the backend validates the raw string against
    // /^(\+62|62|0)[0-9]{9,12}$/ before its own sanitizer runs, so anything with
    // a space or dash would be rejected there.
    const normalized = normalizePhoneNumber(phoneNumber);

    if (!isValidIndonesianPhone(normalized)) {
      toast.error(
        "Nomor WhatsApp belum benar. Contoh: 0812 3456 7890 atau +62 812 3456 7890.",
      );
      return;
    }

    setLoading(true);
    try {
      const result = await requestOtp(normalized);

      if (!result.ok) {
        toast.error(result.message || "Gagal mengirim kode OTP.");
        return;
      }

      setPhoneNumber(normalized);
      setOtpSent(true);
      setResendIn(RESEND_COOLDOWN_SECONDS);
      setOtpExpiresIn(OTP_VALID_SECONDS);
      toast.success(
        isResend
          ? "Kode OTP baru sudah dikirim ke WhatsApp Anda."
          : result.message || "Kode OTP sudah dikirim ke WhatsApp Anda.",
      );
    } catch {
      // requestOtp swallows backend errors itself, but the server-action call
      // can still reject on a dropped connection. A bare `finally` here let that
      // escape as an unhandled rejection: spinner stops, no OTP, no message —
      // so the customer taps again and burns the backend's 3-per-hour quota.
      toast.error("Tidak bisa terhubung ke server. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp("");
    setResendIn(0);
    setOtpExpiresIn(0);
  };

  const handleWhatsAppLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{4,8}$/.test(otp.trim())) {
      toast.error("Kode OTP harus 4-8 angka.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("otp", {
        redirect: false,
        phoneNumber: normalizePhoneNumber(phoneNumber),
        otp: otp.trim(),
      });

      if (result?.ok) {
        toast.success("Berhasil masuk. Mengalihkan...");
        window.location.href = "/dashboard";
        return;
      }

      const errorMessage = result?.error || "Kode OTP atau nomor tidak cocok.";
      if (isDevelopment) {
        console.error("[CLIENT OTP LOGIN] Login failed:", errorMessage);
      }
      toast.error(errorMessage);
    } catch (error) {
      if (isDevelopment) {
        console.error(
          "[CLIENT OTP LOGIN] Exception:",
          error instanceof Error ? error.message : String(error),
        );
      }
      toast.error("Terjadi kesalahan saat masuk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-dvh w-full grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* ── Brand panel (lg and up) ─────────────────────────────────────── */}
      <div className="relative hidden overflow-hidden bg-brand-gradient p-12 text-brand-foreground lg:flex lg:flex-col lg:justify-between xl:p-16">
        {/* Layered light. Radial gradients rather than blurred divs: same
            depth, none of the compositing cost. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(50% 45% at 85% 8%, rgba(255,255,255,0.22), transparent 70%), radial-gradient(45% 45% at 5% 100%, rgba(0,0,0,0.22), transparent 70%)",
          }}
        />
        {/* Faint grid — reads as "network infrastructure" without a stock photo. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(75% 65% at 50% 40%, black, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(75% 65% at 50% 40%, black, transparent 78%)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25">
            <Router className="h-6 w-6" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            {companyName}
          </span>
        </div>

        <div className="relative max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-foreground/70">
            Portal Pelanggan
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] xl:text-[44px]">
            Internet Anda,
            <br />
            sepenuhnya dalam kendali.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-brand-foreground/85">
            Satu tempat untuk memantau koneksi, mengatur Wi-Fi, dan mengurus
            tagihan — kapan pun, dari perangkat apa pun.
          </p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20">
                  <item.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">{item.title}</span>
                  <span className="block text-sm text-brand-foreground/75">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-brand-foreground/70">
          © {new Date().getFullYear()} {companyName}
        </p>
      </div>

      {/* ── Form panel ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center px-gutter py-10">
        <div className="w-full max-w-md">
          {/* The brand panel is hidden below lg, so without this the whole
              brand disappears on exactly the devices most customers use. */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <span className="icon-chip-solid mb-4 h-16 w-16 rounded-2xl">
              <Router className="h-8 w-8" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">{companyName}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Masuk ke portal pelanggan Anda
            </p>
          </div>

          <div className="mb-6 hidden lg:block">
            <h2 className="text-2xl font-bold tracking-tight">
              Masuk ke akun Anda
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Pilih cara masuk yang paling praktis untuk Anda.
            </p>
          </div>

          {reason === "session-expired" && (
            <Alert className="mb-4">
              <AlertDescription>
                Sesi Anda sudah berakhir. Silakan masuk kembali.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="otp" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="otp">
                <Smartphone />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="password">
                <Key />
                Password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="otp">
              <Card>
                <CardHeader>
                  <CardTitle>Masuk lewat WhatsApp</CardTitle>
                  <CardDescription>
                    Kami kirim kode sekali pakai (OTP) ke nomor WhatsApp Anda
                    yang terdaftar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      void handleWhatsAppLogin(e);
                    }}
                    className="space-y-4"
                    noValidate
                  >
                    <div className="space-y-2">
                      <Label htmlFor="phone">Nomor WhatsApp</Label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="0812 3456 7890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        disabled={loading || otpSent}
                      />
                      {!otpSent && (
                        <p className="text-xs text-muted-foreground">
                          Boleh ditulis 0812…, 62812…, atau +62 812…
                        </p>
                      )}
                    </div>

                    {!otpSent ? (
                      <Button
                        type="button"
                        onClick={() => {
                          void sendOtp(false);
                        }}
                        className="w-full"
                        disabled={!phoneNumber || loading}
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Smartphone />
                        )}
                        Kirim Kode OTP
                      </Button>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="otp">Kode OTP</Label>
                          <Input
                            id="otp"
                            ref={otpInputRef}
                            type="text"
                            inputMode="numeric"
                            // Lets Android offer the code straight from the
                            // WhatsApp notification instead of app-switching.
                            autoComplete="one-time-code"
                            pattern="[0-9]*"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => {
                              setOtp(e.target.value.replace(/\D/g, ""));
                            }}
                            required
                            disabled={loading}
                            maxLength={8}
                            // Wide tracking + centred: a one-time code reads as
                            // discrete digits, not a word.
                            className="h-14 text-center text-2xl font-bold tracking-[0.5em] tabular md:text-2xl"
                          />
                          <p className="text-xs text-muted-foreground">
                            {otpExpiresIn > 0
                              ? `Kode berlaku ${formatCountdown(otpExpiresIn)} lagi.`
                              : "Kode mungkin sudah kedaluwarsa. Kirim ulang untuk mendapat kode baru."}
                          </p>
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={otp.trim().length < 4 || loading}
                        >
                          {loading ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Key />
                          )}
                          Masuk
                        </Button>

                        {/* Without these two the customer is stuck: a mistyped
                            number cannot be fixed and an OTP that never arrives
                            cannot be re-requested — only a page reload escapes,
                            and reloads burn the backend's 3-per-hour quota. */}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            className="flex-1"
                            onClick={handleChangeNumber}
                            disabled={loading}
                          >
                            <Pencil />
                            Ubah nomor
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="flex-1"
                            onClick={() => {
                              void sendOtp(true);
                            }}
                            disabled={loading || resendIn > 0}
                          >
                            <RotateCw />
                            {resendIn > 0
                              ? `Kirim ulang (${resendIn})`
                              : "Kirim ulang"}
                          </Button>
                        </div>
                      </>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Masuk dengan Password</CardTitle>
                  <CardDescription>
                    Gunakan username dan password yang diberikan admin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      void handleCredentialsLogin(e);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        autoComplete="username"
                        placeholder="username_anda"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={loading}
                          className="pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword
                              ? "Sembunyikan kata sandi"
                              : "Tampilkan kata sandi"
                          }
                          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!username || !password || loading}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <ArrowRight />
                      )}
                      Masuk
                    </Button>
                    <p className="text-center text-xs leading-relaxed text-muted-foreground">
                      Belum punya password atau lupa? Gunakan tab WhatsApp untuk
                      masuk dengan kode OTP.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Koneksi aman. Butuh bantuan? Hubungi admin lewat WhatsApp.
          </p>
        </div>
      </div>
    </main>
  );
}
