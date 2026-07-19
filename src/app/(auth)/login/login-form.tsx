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
  CheckCircle2,
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
    <main className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      {/* Desktop brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-gradient p-12 text-brand-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-black/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/25">
            <Router className="h-6 w-6" />
          </span>
          <span className="text-lg font-semibold">{companyName}</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Portal Pelanggan {companyName}
          </h1>
          <p className="mt-4 text-lg text-brand-foreground/80">
            Kelola layanan internet Anda dengan mudah — WiFi, tagihan, dan
            laporan gangguan dalam satu tempat.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Pantau status koneksi &amp; perangkat secara real-time
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Cek tagihan, paket, dan riwayat dalam satu tempat
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Kelola WiFi &amp; laporkan gangguan kapan saja
            </li>
          </ul>
        </div>
        <p className="relative text-sm text-brand-foreground/70">
          © {new Date().getFullYear()} {companyName}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* The desktop panel is hidden below lg, so without this the whole
              brand disappears on exactly the devices most customers use. */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-brand-foreground shadow-brand-glow">
              <Router className="h-8 w-8" />
            </span>
            <h1 className="text-2xl font-bold">{companyName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Masuk ke portal pelanggan Anda
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
                <Smartphone className="mr-2 h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="password">
                <Key className="mr-2 h-4 w-4" />
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
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Smartphone className="mr-2 h-4 w-4" />
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
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Key className="mr-2 h-4 w-4" />
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
                            <Pencil className="mr-2 h-4 w-4" />
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
                            <RotateCw className="mr-2 h-4 w-4" />
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
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!username || !password || loading}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      Masuk
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
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
