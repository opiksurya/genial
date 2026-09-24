<?php

namespace Database\Seeders;

use App\Models\CreativeService;
use Illuminate\Database\Seeder;

class CreativeServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            // Video Production
            [
                'name' => 'Video Reels / TikTok Hook Dinamis (30-60s)',
                'category' => 'Video Production',
                'format' => 'Video',
                'description' => 'Video pendek vertikal dengan hook visual menarik pada 3 detik pertama, transisi dinamis, text pop-up, background music trending, dan CTA terarah.',
                'deliverables' => 'Format MP4 1080x1920 (9:16), Durasi 30-60 detik, Sound Design/SFX, Subtitle Hook Dinamis, Color Grading, 2x Revisi Minor.',
                'client_price' => 350000,
                'freelancer_cost' => 150000,
                'unit' => 'per video',
                'turnaround_days' => 2,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Video Cinematic B-Roll Produk (15-30s)',
                'category' => 'Video Production',
                'format' => 'Video',
                'description' => 'Video cinematic showcase detail produk dengan lighting pro, macro shots, pergerakan gimbal halus, dan editing elegan.',
                'deliverables' => 'Format MP4 1080x1920 / 4K, Color Graded Log LUT, Slow-mo 60/120fps, Royalty Free Cinematic Audio, 2x Revisi.',
                'client_price' => 550000,
                'freelancer_cost' => 250000,
                'unit' => 'per video',
                'turnaround_days' => 3,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Video Edukasi / Talking Head + Ilustrasi Pop-up',
                'category' => 'Video Production',
                'format' => 'Video',
                'description' => 'Format video edukasi atau tips bisnis dengan pembicara di kamera, dilengkapi overlay grafis animasi, teks keyword, dan b-roll pendukung.',
                'deliverables' => 'Format MP4 1080x1920, Noise Reduction Audio, Auto-captioning bergaya Alex Hormozi/Ali Abdaal, Zoom In/Out effect, 2x Revisi.',
                'client_price' => 300000,
                'freelancer_cost' => 125000,
                'unit' => 'per video',
                'turnaround_days' => 2,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Video Story Ads / Shopee Video Hard-Selling (15s)',
                'category' => 'Video Production',
                'format' => 'Story',
                'description' => 'Format promosi cepat dengan penawaran diskon, showcase produk kilat, urgensi promo & swipe-up / klik keranjang kuning.',
                'deliverables' => 'Format MP4 1080x1920 (9:16), Durasi 15 detik, Badge Promo, Voice Prompt, 2x Revisi.',
                'client_price' => 200000,
                'freelancer_cost' => 90000,
                'unit' => 'per video',
                'turnaround_days' => 1,
                'is_active' => true,
                'sort_order' => 4,
            ],

            // Photo & Graphic Design
            [
                'name' => 'Desain Carousel Feed Edukasi / Storytelling (5-7 Slide)',
                'category' => 'Photo & Design',
                'format' => 'Carousel',
                'description' => 'Postingan multi-slide di Instagram / TikTok yang mengupas masalah audiens, solusi, dan CTA panduan dengan desain seamless swipe visual.',
                'deliverables' => '5-7 File PNG 1080x1350 (4:5) / 1080x1080, Desain Seamless Slide, Tipografi Hirarki Jelas, Cover Hook Menarik, 2x Revisi.',
                'client_price' => 250000,
                'freelancer_cost' => 100000,
                'unit' => 'per carousel (5-7 slide)',
                'turnaround_days' => 2,
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'name' => 'Photoshoot Katalog Produk Studio (10 Foto Retouched)',
                'category' => 'Photo & Design',
                'format' => 'Image',
                'description' => 'Foto produk studio dengan lighting teratur, background clean/seamless, komposisi komersial, dan retouching detail highlight/shadow.',
                'deliverables' => '10 File Foto High-Resolution JPG/PNG, Color Corrected & Retouched, Background White/Pastel Clean, Resolusi 4000px+.',
                'client_price' => 600000,
                'freelancer_cost' => 250000,
                'unit' => 'per paket (10 foto)',
                'turnaround_days' => 3,
                'is_active' => true,
                'sort_order' => 6,
            ],
            [
                'name' => 'Photoshoot Produk On-Location dengan Model (15 Foto)',
                'category' => 'Photo & Design',
                'format' => 'Image',
                'description' => 'Sesi foto lifestyle produk bersama model di lokasi outdoor/cafe/studio tematik untuk branding otentik dan feed estetis.',
                'deliverables' => '15 File Foto Lifestyle High-Res, Retouching Kulit & Tone Estetik, Variasi Angle Pemakaian Produk, Termasuk Model Fee Sharing.',
                'client_price' => 1200000,
                'freelancer_cost' => 550000,
                'unit' => 'per sesi (15 foto)',
                'turnaround_days' => 4,
                'is_active' => true,
                'sort_order' => 7,
            ],
            [
                'name' => 'Single Post Banner Promosi / Ads Poster (1 Desain)',
                'category' => 'Photo & Design',
                'format' => 'Image',
                'description' => 'Desain visual poster promosi, flash sale, launching produk baru, atau quote inspiratif siap tayang di Feed & Story.',
                'deliverables' => 'File PNG 1080x1080 (1:1) dan 1080x1920 (9:16), Resolusi Tinggi, Termasuk Asset Vektor/3D Elemen, 2x Revisi.',
                'client_price' => 120000,
                'freelancer_cost' => 50000,
                'unit' => 'per desain',
                'turnaround_days' => 1,
                'is_active' => true,
                'sort_order' => 8,
            ],

            // UGC & Talent
            [
                'name' => 'Video UGC Review & Unboxing + Creator Talent (45-60s)',
                'category' => 'UGC & Talent',
                'format' => 'Video',
                'description' => 'Video testimoni otentik dari talent creator (unboxing, first impression, cara pakai, before-after) untuk meningkatkan trust pembeli & ads conversion.',
                'deliverables' => 'Video MP4 1080x1920 Vertikal, Termasuk Fee Talent & Shooting di rumah/studio talent, Subtitle Dinamis, Voice Talent Jelas, Raw Clip Backup.',
                'client_price' => 500000,
                'freelancer_cost' => 225000,
                'unit' => 'per video UGC',
                'turnaround_days' => 3,
                'is_active' => true,
                'sort_order' => 9,
            ],
            [
                'name' => 'Video UGC Skit / Drama Pendek Relatable (60s)',
                'category' => 'UGC & Talent',
                'format' => 'Video',
                'description' => 'Konsep video komedi/drama relatable seputar masalah sehari-hari yang diselesaikan oleh produk brand (soft-selling viral).',
                'deliverables' => 'Video MP4 1080x1920, Multi-scene akting, Dialog natural, Subtitle, Efek suara komedi/SFX, 2x Revisi.',
                'client_price' => 650000,
                'freelancer_cost' => 300000,
                'unit' => 'per video',
                'turnaround_days' => 4,
                'is_active' => true,
                'sort_order' => 10,
            ],

            // Copywriting & Voice Over
            [
                'name' => 'Copywriting Script Video TikTok / Reels (1 Naskah Hook + Isi + CTA)',
                'category' => 'Copywriting & Script',
                'format' => 'Script',
                'description' => 'Riset angle konten, formula 3 detik hook viral, alur visual & narasi, serta call-to-action (CTA) konversi tinggi.',
                'deliverables' => 'Dokumen Script (Hook 3 variasi, Visual Scene Direction, Wording Narasi, Rekomendasi Audio/Soundtrack).',
                'client_price' => 75000,
                'freelancer_cost' => 35000,
                'unit' => 'per script',
                'turnaround_days' => 1,
                'is_active' => true,
                'sort_order' => 11,
            ],
            [
                'name' => 'Voice Over Talent Profesional (Bahasa Indonesia / English, max 60s)',
                'category' => 'Copywriting & Script',
                'format' => 'VoiceOver',
                'description' => 'Rekaman suara profesional dengan artikulasi jelas, intonasi persuasif/enerjik/hangat sesuai karakter brand.',
                'deliverables' => 'File WAV & MP3 Mastered High-Quality (24bit/48kHz), Noise Free, Termasuk 2 Opsi Intonasi, 2x Revisi Bacaan.',
                'client_price' => 200000,
                'freelancer_cost' => 90000,
                'unit' => 'per menit audio',
                'turnaround_days' => 1,
                'is_active' => true,
                'sort_order' => 12,
            ],

            // Motion & Animation
            [
                'name' => 'Motion Graphic 2D Explainer / Logo Bumper (10-30s)',
                'category' => 'Motion & 3D',
                'format' => 'Video',
                'description' => 'Animasi grafis vektor 2D, kinetic typography, transisi animasi logo, atau visualisasi cara kerja fitur aplikasi/produk.',
                'deliverables' => 'Video MP4 1080x1920 / 1920x1080 (60fps), Sound Effects terintegrasi, Source File After Effects (opsional), 2x Revisi.',
                'client_price' => 750000,
                'freelancer_cost' => 350000,
                'unit' => 'per video',
                'turnaround_days' => 4,
                'is_active' => true,
                'sort_order' => 13,
            ],

            // Live Streaming & Host
            [
                'name' => 'Live Streaming Host TikTok / Shopee (Sesi 2 Jam)',
                'category' => 'Live Streaming',
                'format' => 'Live',
                'description' => 'Host profesional yang aktif memandu live stream penjualan, interaksi penonton, spill keranjang kuning, dan build hype promo.',
                'deliverables' => '2 Jam Live Streaming Non-Stop, Persiapan Script Produk, Laporan Ringkas Penjualan & Engagement Live pasca sesi.',
                'client_price' => 400000,
                'freelancer_cost' => 180000,
                'unit' => 'per sesi (2 jam)',
                'turnaround_days' => 1,
                'is_active' => true,
                'sort_order' => 14,
            ],
        ];

        foreach ($services as $service) {
            CreativeService::updateOrCreate(
                ['name' => $service['name']],
                $service
            );
        }
    }
}
