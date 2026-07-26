"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  BookOpen,
  LifeBuoy,
  MessageSquareWarning,
  Info,
  Wifi,
  Gauge,
  Rocket,
  Settings,
  ChevronRight,
  History,
} from "lucide-react";
import { useReportDialog } from "../report-dialog-context";

const faqData: {
  id: string;
  icon: LucideIcon;
  question: string;
  answer: string;
}[] = [
  {
    id: "item-1",
    icon: Info,
    question: "Apa itu portal pelanggan ini?",
    answer:
      "Portal pelanggan adalah aplikasi untuk mengelola layanan internet Anda: memantau status koneksi & perangkat, melihat tagihan, mengubah WiFi, dan mengirim laporan gangguan.",
  },
  {
    id: "item-2",
    icon: Wifi,
    question: "Bagaimana cara mengubah nama & kata sandi Wi-Fi saya?",
    answer:
      "Buka menu Wi-Fi, pilih jaringan yang ingin diubah, lalu isi nama baru dan/atau kata sandi baru dan tekan Simpan. Perubahan diterapkan langsung ke perangkat Anda.",
  },
  {
    id: "item-3",
    icon: Gauge,
    question: "Mengapa kecepatan internet saya lambat?",
    answer:
      "Kecepatan lambat bisa disebabkan oleh jarak dari router, banyaknya perangkat terhubung, atau gangguan jaringan. Coba reboot router dari menu Pengaturan. Jika masih bermasalah, kirim Laporan Masalah.",
  },
  {
    id: "item-4",
    icon: Rocket,
    question: "Bagaimana cara menggunakan Speed Boost?",
    answer:
      'Jika tersedia untuk paket Anda, menu "Boost" akan muncul di navigasi. Pilih boost, lakukan pembayaran bila diperlukan, dan kecepatan akan ditingkatkan sementara.',
  },
];

/** Shortcuts to the page that actually solves each common request. */
const SHORTCUTS: { href: string; icon: LucideIcon; title: string }[] = [
  { href: "/dashboard/wifi", icon: Wifi, title: "Ubah Wi-Fi" },
  { href: "/dashboard/history", icon: History, title: "Cek Tagihan" },
  { href: "/dashboard/settings", icon: Settings, title: "Reboot Router" },
];

export default function KnowledgeBasePage() {
  const { openDialog } = useReportDialog();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={HelpCircle}
        eyebrow="Dukungan"
        title="Pusat Bantuan"
        description="Temukan jawaban cepat, atau hubungi kami langsung."
      />

      <section className="space-y-3">
        <SectionHeading title="Pintasan" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SHORTCUTS.map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="tile-interactive flex items-center gap-3"
            >
              <span className="icon-chip h-9 w-9">
                <shortcut.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {shortcut.title}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <span className="icon-chip h-9 w-9">
              <BookOpen className="h-[18px] w-[18px]" />
            </span>
            Pertanyaan Umum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion
            type="single"
            collapsible
            defaultValue="item-1"
            className="w-full"
          >
            {faqData.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>
                  <span className="flex items-start gap-3">
                    <faq.icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand" />
                    <span className="min-w-0">{faq.question}</span>
                  </span>
                </AccordionTrigger>
                {/* Indented to the question's text column so the answer reads
                    as belonging to it rather than starting a new block. */}
                <AccordionContent className="pl-[30px] text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand/12 via-brand/[0.04] to-transparent p-5 sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full"
            style={{
              backgroundImage:
                "radial-gradient(closest-side, hsl(var(--brand) / 0.22), transparent)",
            }}
          />
          <div className="relative flex items-start gap-3.5">
            <span className="icon-chip-solid">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">Masih butuh bantuan?</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Kirim laporan gangguan dan tim kami akan menindaklanjuti
                secepatnya.
              </p>
            </div>
          </div>
          <Button
            onClick={openDialog}
            className="relative mt-5 w-full sm:w-auto"
          >
            <MessageSquareWarning />
            Laporkan Masalah
          </Button>
        </div>
      </Card>
    </div>
  );
}
