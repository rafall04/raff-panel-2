"use client";

import type { LucideIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
      "Buka menu Wi-Fi di bawah, pilih SSID, lalu isi nama baru dan/atau kata sandi baru dan tekan Simpan. Perubahan diterapkan langsung ke perangkat Anda.",
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

export default function KnowledgeBasePage() {
  const { openDialog } = useReportDialog();

  return (
    <div className="space-y-5">
      <PageHeader
        icon={HelpCircle}
        title="Pusat Bantuan"
        description="Temukan jawaban cepat, atau hubungi kami langsung."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="icon-chip">
              <BookOpen className="h-5 w-5" />
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
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="flex items-center gap-2.5">
                    <faq.icon className="h-4 w-4 shrink-0 text-brand" />
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pl-6 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand/10 to-transparent p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-brand-foreground shadow-brand-glow">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">Masih butuh bantuan?</p>
              <p className="text-sm text-muted-foreground">
                Kirim laporan gangguan dan tim kami akan menindaklanjuti
                secepatnya.
              </p>
            </div>
          </div>
          <Button onClick={openDialog} className="mt-4 w-full">
            <MessageSquareWarning className="mr-2 h-4 w-4" /> Laporkan Masalah
          </Button>
        </div>
      </Card>
    </div>
  );
}
