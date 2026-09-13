<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

class CaseStudySeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();
        $startDate = now()->subMonths(6)->startOfMonth();
        $endDate = now()->endOfMonth();

        // 1. GLOWING ID CASE STUDY
        Project::updateOrCreate(
            ['slug' => 'glowing-id'],
            [
                'name' => 'SEO & Performance Marketing Campaign',
                'client' => 'GlowingID',
                'client_logo' => '/images/brands/skincare.svg',
                'description' => 'Akselerasi omset brand skincare melalui strategi Omni-Channel Funnel, Meta CAPI, dan Video UGC.',
                'category' => 'Performance Marketing',
                'status' => 'Completed',
                'priority' => 'High',
                'progress' => 100,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'is_show_on_home' => true,
                'manager_id' => $user?->id,
                'article_title' => 'Akselerasi Omset Skincare GlowingID: Dari Rp 35 Juta Menjadi Rp 168 Juta per Bulan Melalui Omni-Channel Funnel & UGC Meta CAPI',
                'article_subtitle' => 'Bagaimana kolaborasi strategis Genial Digital Solution bersama GlowingID merevolusi saluran penjualan digital, mengoptimalkan return on ad spend (ROAS) dari 1.8x menjadi 4.5x, dan membangun pertumbuhan bisnis berkelanjutan.',
                'initial_revenue' => 'Rp 35.000.000 / bln',
                'current_revenue' => 'Rp 168.000.000 / bln',
                'initial_roas' => '1.8x ROAS',
                'current_roas' => '4.5x ROAS',
                'growth_percentage' => '+380%',
                'collaboration_story' => "Pertama kali founder GlowingID berkonsultasi dengan tim Genial pada pertengahan 2023, bisnis skincare ini menghadapi tantangan serius: biaya iklan Meta (Facebook & Instagram Ads) yang terus membengkak tanpa kenaikan konversi yang sepadan. Rasio iklan (ROAS) hanya bertengger di angka 1.8x, stok produk sering menumpuk di gudang karena estimasi permintaan yang tidak akurat, dan tim customer service kewalahan melayani pesan tanpa sistem pengelolaan order yang terintegrasi.\n\nMelihat potensi besar pada kualitas formulasi produk GlowingID, Genial merancang pendekatan holistik. Bukan sekadar \"menjalankan iklan\", kami melakukan pembenahan fundamental pada 3 pilar: Creative UGC Engine, Tracking Presisi (Meta Conversions API + GTM), dan Integrasi Database Order.",
                'key_results' => "- Lonjakan Omset dari Rp 35 Juta menjadi Rp 168 Juta / bulan (+380% Growth)\n- ROAS Iklan naik dari 1.8x menjadi 4.5x secara konsisten dalam 60 hari\n- Produksi 15+ Video UGC High-Converting setiap bulan\n- Integrasi Meta CAPI Server-Side Tracking dengan akurasi 98.2%\n- Efisiensi penanganan chat CS meningkat 4x lebih cepat dengan bot order dispatching",
                'article_content' => '<h2>1. Analisis Kendala & Tantangan Awal</h2>
<p>Sebelum intervensi strategi dari <strong>Genial Digital Solution</strong>, GlowingID sangat bergantung pada metode pemasaran konvensional dan materi iklan statis yang kurang relevan bagi audiens Gen-Z dan Milenial. Beberapa masalah utama yang diidentifikasi meliputi:</p>
<ul>
  <li><strong>Iklan Jenuh (Ad Fatigue):</strong> Visual iklan yang kaku menyebabkan Click-Through Rate (CTR) drop di bawah 0.9%.</li>
  <li><strong>Data Tracking Bocor:</strong> Kebijakan iOS 14.5 menyebabkan pelacakan pixel standar kehilangan hingga 35% data konversi pembelian.</li>
  <li><strong>Funnel Pembelian Panjang:</strong> Calon pembeli harus melewati 4 langkah manual sebelum akhirnya melakukan pembayaran di WhatsApp.</li>
</ul>

<p><img src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80" alt="Produk Skincare GlowingID Premium Formulation" /></p>

<h2>2. Strategi Eksekusi: Transformasi 3 Pilar Utama</h2>
<p>Genial mengimplementasikan rencana aksi terstruktur selama 90 hari untuk merevolusi funnel penjualan GlowingID:</p>

<h3>A. Creative UGC & Short Video Engine</h3>
<p>Kami memproduksi 15+ variasi video pendek berformat <em>User Generated Content (UGC)</em> yang otentik. Video berfokus pada visual <strong>before-after real</strong>, edukasi bahan aktif niacinamide, dan perbandingan tekstur serum. Pendekatan ini berhasil meningkatkan CTR iklan dari 0.9% menjadi 3.4% dalam 2 minggu pertama.</p>

<p><img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80" alt="Sesi Foto & Video Production UGC GlowingID" /></p>

<h3>B. Tracking Server-Side via Meta Conversions API (CAPI)</h3>
<p>Untuk mengatasi data tracking yang hilang, kami mengintegrasikan <strong>Meta CAPI server-side tracking</strong> secara langsung ke sistem order. Hasilnya, akurasi data pembeli meningkat hingga 98.2%, memungkinkan algoritma Meta Ads melakukan optimasi target audiens dengan jauh lebih cerdas dan presisi.</p>

<p><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80" alt="Dashboard Analisis Analytics & Growth Data GlowingID" /></p>

<h3>C. Otomatisasi Lead & Funnel Order WhatsApp</h3>
<p>Kami memangkas langkah checkout dengan sistem formulir cepat yang terhubung ke bot auto-assign CS. Pelanggan kini dapat langsung terhubung ke CS terdekat dalam waktu kurang dari 10 detik setelah mengeklik iklan.</p>

<p><img src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80" alt="Perawatan Skincare GlowingID Result" /></p>

<h2>3. Hasil & Peningkatan Performa Signifikan</h2>
<p>Setelah 6 bulan berjalan bersama skema penunjang dan pendampingan Genial, GlowingID mencatatkan pertumbuhan rekor tertinggi sejak brand ini pertama kali berdiri:</p>
<ul>
  <li><strong>Omset Bulanan:</strong> Melonjak dari <strong>Rp 35.000.000 / bulan</strong> menjadi <strong>Rp 168.000.000 / bulan</strong> (+380% Growth).</li>
  <li><strong>Efisiensi ROAS:</strong> ROAS rata-rata meningkat pesat dari <strong>1.8x</strong> menjadi <strong>4.5x</strong>.</li>
  <li><strong>Repeat Order Rate:</strong> Naik menjadi 38% berkat database pelanggan yang terorganisasi rapi.</li>
</ul>

<blockquote>
  <p>"Kerjasama dengan Genial bukan hanya mengubah cara kami beriklan, tapi mengubah cara kami memandang pertumbuhan bisnis secara menyeluruh. Tim Genial sangat proaktif dan transparan dalam setiap keputusan strategi."</p>
  <cite>— Founder & CEO GlowingID</cite>
</blockquote>',
            ]
        );

        // 2. BATIKKU INDONESIA CASE STUDY
        Project::updateOrCreate(
            ['slug' => 'batikku-indonesia'],
            [
                'name' => 'E-Commerce Website & Omnichannel Growth',
                'client' => 'BatikKu Indonesia',
                'client_logo' => '/images/brands/fashion.svg',
                'description' => 'Digitalisasi brand batik warisan budaya lokal ke kancah e-commerce nasional dengan integrasi payment otomatis.',
                'category' => 'Website Development',
                'status' => 'Completed',
                'priority' => 'High',
                'progress' => 100,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'is_show_on_home' => true,
                'manager_id' => $user?->id,
                'article_title' => 'Transformasi Digital BatikKu Indonesia: Menjangkau Pasar Nasional & Ekspor Melalui Platform E-Commerce Modern',
                'article_subtitle' => 'Bagaimana sistem toko online berkecepatan tinggi & integrasi payment gateway Midtrans mendongkrak transaksi sebesar 413% dalam rentang waktu kurang dari 5 bulan.',
                'initial_revenue' => 'Rp 45.000.000 / bln',
                'current_revenue' => 'Rp 230.000.000 / bln',
                'initial_roas' => '2.1x ROAS',
                'current_roas' => '5.2x ROAS',
                'growth_percentage' => '+413%',
                'collaboration_story' => "BatikKu Indonesia berawal dari toko fisik tradisional di Bandung yang berjuang mempertahankan omset di tengah peralihan perilaku belanja masyarakat ke ranah digital. Sebelum bertemu Genial, BatikKu hanya berjualan lewat chat manual di Instagram yang membutuhkan waktu berjam-jam untuk mengonfirmasi transaksi satu per satu.\n\nGenial merancang toko online custom yang sangat ringan, cepat, dan dilengkapi fitur cek ongkir otomatis serta pembayaran instant QRIS & Bank VA.",
                'key_results' => "- Kenaikan Omset Bulanan hingga Rp 230 Juta / bulan (+413% Growth)\n- Pemangkasan Waktu Proses Order dari 20 Menit menjadi 30 Detik secara otomatis\n- Skala Ekspor Produk Batik Tulis ke Singapore & Malaysia\n- Loading Speed Website di bawah 1.2 detik (SEO Optimized)",
                'article_content' => '<h2>1. Tantangan Penjualan Tradisional</h2>
<p>Sebelum kerjasama dengan Genial, BatikKu Indonesia mengalami kendala operasional yang menghambat skalabilitas bisnis mereka:</p>
<ul>
  <li><strong>Sistem Pembayaran Manual:</strong> CS harus mengecek mutasi rekening bank satu per satu secara manual.</li>
  <li><strong>Kehilangan Pembeli (Cart Abandonment):</strong> Pelanggan sering membatalkan pesanan karena balasan chat CS yang lambat saat jam sibuk.</li>
</ul>

<p><img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80" alt="E-Commerce Fashion BatikKu Store" /></p>

<h2>2. Solusi Website Custom & Digital Marketing</h2>
<p>Tim Genial membangun platform web e-commerce modern yang dilengkapi dengan fitur-fitur kelas atas:</p>

<h3>A. Integrasi Payment Gateway & Ekspedisi Otomatis</h3>
<p>Setiap pesanan kini terintegrasi langsung dengan Midtrans & RajaOngkir. Pembeli cukup memilih produk, memilih kurir, dan bayar lewat QRIS. Resi pengiriman langsung terbit dan dikirimkan otomatis ke WhatsApp pelanggan.</p>

<p><img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80" alt="Showroom BatikKu Digital Exhibition" /></p>

<h2>3. Pencapaian Rekor Omset</h2>
<p>Dalam kurun waktu 5 bulan, BatikKu Indonesia mencatatkan peningkatan omset dari Rp 45 Juta per bulan menjadi Rp 230 Juta per bulan dengan rasio kepuasan pelanggan mencapai 99.4%.</p>',
            ]
        );
    }
}
