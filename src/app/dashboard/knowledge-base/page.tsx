import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    id: "item-1",
    question: 'Apa itu RAF Client?',
    answer: 'RAF Client adalah aplikasi panel pelanggan untuk mengelola layanan internet Anda, memantau penggunaan, dan mendapatkan dukungan.',
  },
  {
    id: "item-2",
    question: 'Bagaimana cara mengubah kata sandi Wi-Fi saya?',
    answer: 'Anda dapat mengubah kata sandi Wi-Fi Anda melalui menu Pengaturan > Wi-Fi. Ikuti petunjuk untuk memasukkan kata sandi baru Anda.',
  },
  {
    id: "item-3",
    question: 'Mengapa kecepatan internet saya lambat?',
    answer: 'Kecepatan lambat bisa disebabkan oleh banyak faktor, termasuk jarak dari router, jumlah perangkat yang terhubung, atau masalah pada jaringan. Coba restart router Anda terlebih dahulu. Jika masalah berlanjut, hubungi dukungan melalui formulir laporan.',
  },
  {
    id: "item-4",
    question: 'Bagaimana cara menggunakan Speed Boost?',
    answer: 'Fitur Speed Boost tersedia di halaman utama. Cukup tekan tombol "Boost" untuk mendapatkan peningkatan kecepatan sementara sesuai dengan paket layanan Anda.',
  }
];

export default function KnowledgeBasePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Pusat Bantuan
      </h1>
      <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
        {faqData.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
