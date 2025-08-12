import React from 'react';

const faqData = [
  {
    question: 'Apa itu RAF Client?',
    answer: 'RAF Client adalah aplikasi panel pelanggan untuk mengelola layanan internet Anda, memantau penggunaan, dan mendapatkan dukungan.',
  },
  {
    question: 'Bagaimana cara mengubah kata sandi Wi-Fi saya?',
    answer: 'Anda dapat mengubah kata sandi Wi-Fi Anda melalui menu Pengaturan > Wi-Fi. Ikuti petunjuk untuk memasukkan kata sandi baru Anda.',
  },
  {
    question: 'Mengapa kecepatan internet saya lambat?',
    answer: 'Kecepatan lambat bisa disebabkan oleh banyak faktor, termasuk jarak dari router, jumlah perangkat yang terhubung, atau masalah pada jaringan. Coba restart router Anda terlebih dahulu. Jika masalah berlanjut, hubungi dukungan melalui formulir laporan.',
  },
  {
    question: 'Bagaimana cara menggunakan Speed Boost?',
    answer: 'Fitur Speed Boost tersedia di halaman utama. Cukup tekan tombol "Boost" untuk mendapatkan peningkatan kecepatan sementara sesuai dengan paket layanan Anda.',
  }
];

export default function KnowledgeBasePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">
        Pusat Bantuan
      </h1>
      <div className="space-y-4">
        {faqData.map((faq, index) => (
          <div key={index} className="collapse collapse-plus bg-white/10 backdrop-blur-lg border border-white/20">
            <input type="radio" name="my-accordion-3" defaultChecked={index === 0} />
            <div className="collapse-title text-xl font-medium text-white">
              {faq.question}
            </div>
            <div className="collapse-content">
              <p className="text-white/80">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
