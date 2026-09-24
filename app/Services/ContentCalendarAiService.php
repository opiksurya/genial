<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ContentCalendarAiService
{
    /**
     * Generate content calendar items for a given month and configuration.
     *
     * @param array $params
     * @return array
     */
    public function generateCalendar(array $params): array
    {
        $provider = $params['provider'] ?? Setting::get('ai_default_provider', 'gemini');
        $apiKey = $params['api_key'] ?? $this->getApiKeyForProvider($provider);
        $model = $params['model'] ?? $this->getDefaultModelForProvider($provider);

        $month = (int) ($params['month'] ?? Carbon::now()->month);
        $year = (int) ($params['year'] ?? Carbon::now()->year);
        $brandName = $params['brand_name'] ?? 'Hoof ID';
        $businessNiche = $params['niche'] ?? 'Pabrik Konveksi, Sablon Kaos & Apparel Garmen';
        $platforms = $params['platforms'] ?? ['TikTok', 'Shopee Video', 'Instagram Reels'];
        $frequency = $params['frequency'] ?? 'daily'; // daily, weekdays, custom
        $pillars = $params['pillars'] ?? ['Product Showcase', 'Edukasi', 'Behind The Scene', 'Promo', 'Tips & Trik', 'Testimonial'];
        $tone = $params['tone'] ?? 'Kasual, Edukatif & Persuasif';
        $customPrompt = $params['custom_prompt'] ?? '';

        // Calculate target dates
        $targetDates = $this->calculateTargetDates($year, $month, $frequency);

        $prompt = $this->buildGenerationPrompt([
            'year' => $year,
            'month' => $month,
            'month_name' => Carbon::createFromDate($year, $month, 1)->translatedFormat('F Y'),
            'brand_name' => $brandName,
            'niche' => $businessNiche,
            'platforms' => $platforms,
            'dates' => $targetDates,
            'pillars' => $pillars,
            'tone' => $tone,
            'custom_prompt' => $customPrompt,
        ]);

        if (empty($apiKey)) {
            // If no API key configured, generate a rich contextual default schedule
            return $this->generateDefaultFallbackCalendar($targetDates, $brandName, $businessNiche, $platforms, $pillars);
        }

        try {
            $rawResponse = match ($provider) {
                'gemini' => $this->callGemini($apiKey, $model, $prompt),
                'claude' => $this->callClaude($apiKey, $model, $prompt),
                'openai', 'openrouter' => $this->callOpenAiCompatible($provider, $apiKey, $model, $prompt),
                default => $this->callGemini($apiKey, $model, $prompt),
            };

            $parsedItems = $this->parseJsonItems($rawResponse);
            if (!empty($parsedItems)) {
                return $parsedItems;
            }
        } catch (\Throwable $e) {
            Log::error('AI Content Calendar Generation Error: ' . $e->getMessage(), [
                'provider' => $provider,
                'model' => $model,
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // Return fallback if API call fails
        return $this->generateDefaultFallbackCalendar($targetDates, $brandName, $businessNiche, $platforms, $pillars);
    }

    /**
     * Refine or rewrite a single content item.
     */
    public function refineContentItem(array $itemData, string $instruction, ?string $provider = null, ?string $apiKey = null): array
    {
        $provider = $provider ?? Setting::get('ai_default_provider', 'gemini');
        $apiKey = $apiKey ?? $this->getApiKeyForProvider($provider);
        $model = $this->getDefaultModelForProvider($provider);

        if (empty($apiKey)) {
            // Return modified mock response
            return [
                'title' => $itemData['title'] ?? 'Judul Konten',
                'visual_detail' => ($itemData['visual_detail'] ?? '') . "\n[AI Refined]: Tambahkan transisi dinamis zoom-in di 3 detik pertama.",
                'wording' => ($itemData['wording'] ?? '') . " 🔥 Wajib tonton sampai akhir!",
                'copywriting' => ($itemData['copywriting'] ?? '') . "\n\nYuk konsultasikan kebutuhan custom sekarang juga! Hubungi link di bio.",
                'hashtags' => ($itemData['hashtags'] ?? '#viral #konten'),
            ];
        }

        $prompt = <<<PROMPT
Anda adalah Social Media Strategist & Copywriting Expert untuk video pendek (TikTok, Reels, Shopee Video).
Perbaiki/kembangkan ide konten berikut berdasarkan instruksi user:

DATA KONTEN SAAT INI:
- Judul: {$itemData['title']}
- Platform: {$itemData['platform']}
- Format: {$itemData['format']}
- Pilar: {$itemData['pillar']}
- Visual Detail: {$itemData['visual_detail']}
- Wording / Text on Screen: {$itemData['wording']}
- Copywriting / Caption: {$itemData['copywriting']}
- Hashtags: {$itemData['hashtags']}

INSTRUKSI REVISI DARI USER:
"{$instruction}"

Keluarkan HANYA JSON murni (tanpa teks pembuka atau markdown penutup) dengan struktur:
{
  "title": "...",
  "visual_detail": "...",
  "wording": "...",
  "copywriting": "...",
  "hashtags": "..."
}
PROMPT;

        try {
            $rawResponse = match ($provider) {
                'gemini' => $this->callGemini($apiKey, $model, $prompt),
                'claude' => $this->callClaude($apiKey, $model, $prompt),
                'openai', 'openrouter' => $this->callOpenAiCompatible($provider, $apiKey, $model, $prompt),
                default => $this->callGemini($apiKey, $model, $prompt),
            };

            $cleaned = $this->cleanJsonString($rawResponse);
            $decoded = json_decode($cleaned, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        } catch (\Throwable $e) {
            Log::error('AI Single Item Refinement Error: ' . $e->getMessage());
        }

        return $itemData;
    }

    /**
     * Call Google Gemini API.
     */
    protected function callGemini(string $apiKey, string $model, string $prompt): string
    {
        // Gemini model aliases
        $modelName = $model ?: 'gemini-1.5-flash';
        if ($modelName === 'gemini-2.0-flash-exp' || $modelName === 'gemini-2.0-flash') {
            $modelName = 'gemini-2.0-flash';
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:generateContent?key={$apiKey}";

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->timeout(60)->post($url, [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'responseMimeType' => 'application/json',
            ],
        ]);

        if (!$response->successful()) {
            throw new \Exception('Gemini API Error: ' . $response->body());
        }

        $json = $response->json();
        return $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
    }

    /**
     * Call Anthropic Claude API.
     */
    protected function callClaude(string $apiKey, string $model, string $prompt): string
    {
        $modelName = $model ?: 'claude-3-5-sonnet-20241022';
        $url = 'https://api.anthropic.com/v1/messages';

        $response = Http::withHeaders([
            'x-api-key' => $apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ])->timeout(60)->post($url, [
            'model' => $modelName,
            'max_tokens' => 8192,
            'temperature' => 0.7,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ],
        ]);

        if (!$response->successful()) {
            throw new \Exception('Claude API Error: ' . $response->body());
        }

        $json = $response->json();
        return $json['content'][0]['text'] ?? '';
    }

    /**
     * Call OpenAI / OpenRouter API.
     */
    protected function callOpenAiCompatible(string $provider, string $apiKey, string $model, string $prompt): string
    {
        $url = $provider === 'openrouter' 
            ? 'https://openrouter.ai/api/v1/chat/completions' 
            : 'https://api.openai.com/v1/chat/completions';
            
        $modelName = $model ?: ($provider === 'openrouter' ? 'google/gemini-2.0-flash-001' : 'gpt-4o-mini');

        $headers = [
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ];

        if ($provider === 'openrouter') {
            $headers['HTTP-Referer'] = config('app.url', 'http://localhost');
            $headers['X-Title'] = 'Genial Content Calendar';
        }

        $response = Http::withHeaders($headers)->timeout(60)->post($url, [
            'model' => $modelName,
            'temperature' => 0.7,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are a master social media content planner that outputs strictly valid JSON.'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'response_format' => ['type' => 'json_object']
        ]);

        if (!$response->successful()) {
            throw new \Exception("{$provider} API Error: " . $response->body());
        }

        $json = $response->json();
        return $json['choices'][0]['message']['content'] ?? '';
    }

    /**
     * Build the generation prompt for LLM.
     */
    protected function buildGenerationPrompt(array $data): string
    {
        $datesList = implode(', ', $data['dates']);
        $platformsList = implode(', ', $data['platforms']);
        $pillarsList = implode(', ', $data['pillars']);

        return <<<PROMPT
Anda adalah Social Media Content Director & Creative Copywriter kelas atas untuk agensi digital marketing dan brand retail/konveksi/manufaktur.
Tugas Anda adalah merancang Kalender Konten bulanan lengkap dengan ide visual, arahan kamera, teks di layar (wording on-screen), copywriting caption berbobot, link inspirasi TikTok/search query, dan format yang terbukti viral & konversi tinggi.

SPESIFIKASI TARGET:
- Brand / Bisnis: {$data['brand_name']}
- Industri / Niche: {$data['niche']}
- Periode: Bulan {$data['month_name']}
- Daftar Tanggal Posting (format YYYY-MM-DD): [{$datesList}]
- Platform Utama: {$platformsList}
- Pilar Konten yang Harus Didistribusikan: {$pillarsList}
- Tone of Voice: {$data['tone']}
- Arahan Tambahan / Event / Campaign: {$data['custom_prompt']}

ATURAN STRUKTUR SETIAP ITEM KONTEN:
1. "scheduled_date": Tanggal sesuai daftar tanggal (YYYY-MM-DD).
2. "platform": Salah satu dari: {$platformsList}.
3. "format": Format konten, misal: "Video", "Carousel", "Image", "Story".
4. "pillar": Salah satu dari pilar: {$pillarsList}.
5. "title": Judul konten yang catchy & ringkas (contoh: "Showcase Jaket Windbreaker Custom", "Combed 24s vs 30s Bagus Mana?", "Spill Seragam PDH Kualitas Pabrik").
6. "reference_link": Link pencarian inspirasi TikTok atau referensi relevan (contoh: "https://www.tiktok.com/search?q=custom%20windbreaker%20jacket").
7. "visual_detail": Arahan visual/kamera detail (contoh: "Video memperlihatkan efek air memantul di bahan kain taslan (water repellent) dan detail resleting waterproof dengan lighting studio tajam.").
8. "wording": Teks hook utama yang muncul di video/gambar (contoh: "Jaket Custom Water-Repellent Anti Angin & Hujan Gerimis!").
9. "copywriting": Teks caption lengkap bahasa Indonesia yang persuasif, ada hook, value/story, dan call-to-action (CTA).
10. "hashtags": 4-6 hashtag relevan dipisah spasi (contoh: "#jaketcustom #windbreaker #pabrikjaket #konveksijaket").
11. "status": "Draft".

FORMAT OUTPUT:
Wajib memberikan output HANYA JSON murni (JSON Object dengan key "items" berisi array of objects).
Contoh:
{
  "items": [
    {
      "scheduled_date": "2026-07-01",
      "platform": "TikTok",
      "format": "Video",
      "pillar": "Product Showcase",
      "title": "Spill Seragam PDH Kualitas Pabrik",
      "reference_link": "https://www.tiktok.com/search?q=seragam%20pdh%20kantor",
      "visual_detail": "Close-up detail jahitan bartek di saku kemeja PDH, dilanjutkan adegan uji kekuatan kancing dan tekstur bahan drill anti kusut.",
      "wording": "Kemeja PDH Kantor Rapi Seharian Tanpa Kusut!",
      "copywriting": "Kemeja PDH dengan jahitan dobel dan bahan American Drill Grade A. Bikin tim kamu tampil makin kompak & profesional saat ketemu klien! Mau bikin seragam custom logo bordir komputer? Hubungi kami sekarang!",
      "hashtags": "#seragampdh #kemejakantor #konveksiseragam #pabrikbaju",
      "status": "Draft"
    }
  ]
}
PROMPT;
    }

    /**
     * Clean and parse json array from LLM response.
     */
    protected function parseJsonItems(string $raw): array
    {
        $cleaned = $this->cleanJsonString($raw);
        $decoded = json_decode($cleaned, true);

        if (is_array($decoded)) {
            if (isset($decoded['items']) && is_array($decoded['items'])) {
                return $decoded['items'];
            }
            // Check if it's already an indexed array
            if (isset($decoded[0]) && is_array($decoded[0])) {
                return $decoded;
            }
        }

        return [];
    }

    /**
     * Clean markdown code blocks and wrappers.
     */
    protected function cleanJsonString(string $text): string
    {
        $text = trim($text);
        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/i', $text, $matches)) {
            $text = trim($matches[1]);
        }
        return $text;
    }

    /**
     * Calculate target dates for generation.
     */
    protected function calculateTargetDates(int $year, int $month, string $frequency): array
    {
        $dates = [];
        $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $date = Carbon::createFromDate($year, $month, $day);
            if ($frequency === 'weekdays' && ($date->isSaturday() || $date->isSunday())) {
                continue;
            }
            if ($frequency === '3x_week' && !in_array($date->dayOfWeek, [1, 3, 5])) { // Mon, Wed, Fri
                continue;
            }
            $dates[] = $date->format('Y-m-d');
        }

        return $dates;
    }

    /**
     * Get API key from database setting or .env.
     */
    protected function getApiKeyForProvider(string $provider): ?string
    {
        return match ($provider) {
            'gemini' => Setting::get('gemini_api_key', env('GEMINI_API_KEY')),
            'claude' => Setting::get('claude_api_key', env('CLAUDE_API_KEY', env('ANTHROPIC_API_KEY'))),
            'openai' => Setting::get('openai_api_key', env('OPENAI_API_KEY')),
            'openrouter' => Setting::get('openrouter_api_key', env('OPENROUTER_API_KEY')),
            default => Setting::get('gemini_api_key', env('GEMINI_API_KEY')),
        };
    }

    /**
     * Get default model string for provider.
     */
    protected function getDefaultModelForProvider(string $provider): string
    {
        return match ($provider) {
            'gemini' => Setting::get('gemini_model', 'gemini-2.0-flash'),
            'claude' => Setting::get('claude_model', 'claude-3-5-sonnet-20241022'),
            'openai' => Setting::get('openai_model', 'gpt-4o-mini'),
            'openrouter' => Setting::get('openrouter_model', 'google/gemini-2.0-flash-001'),
            default => 'gemini-2.0-flash',
        };
    }

    /**
     * Generate fallback calendar with rich realistic sample data (matching screenshots).
     */
    public function generateDefaultFallbackCalendar(array $dates, string $brandName, string $niche, array $platforms, array $pillars): array
    {
        $sampleTemplates = [
            [
                'title' => 'Spill Seragam PDH Kualitas Pabrik',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Product Showcase',
                'reference_link' => 'https://www.tiktok.com/search?q=seragam%20pdh%20kualitas%20pabrik',
                'visual_detail' => 'Video memperlihatkan proses finishing kemeja PDH, detail kerapian obras dalam, dan pengujian bahan drill tahan kusut.',
                'wording' => 'Rahasia Kemeja PDH Rapi & Kokoh Dipakai Seharian!',
                'copywriting' => "Seragam PDH bukan sekadar pakaian kantor biasa, tapi identitas profesional tim kamu! Kami menggunakan bahan American Drill tebal dan breathable dengan jahitan presisi mesin garmen. Mau custom logo bordir komputer? Konsultasikan sekarang! #seragampdh #konveksiseragam #pabrikbaju #apparel",
                'hashtags' => '#seragampdh #konveksiseragam #pabrikbaju #apparel',
            ],
            [
                'title' => 'Combed 24s vs 30s, Bagus Mana?',
                'platform' => 'Instagram Reels',
                'format' => 'Carousel',
                'pillar' => 'Edukasi',
                'reference_link' => 'https://www.tiktok.com/search?q=combed%2024s%20vs%2030s',
                'visual_detail' => 'Perbandingan side-by-side ketebalan kain Cotton Combed 24s dan 30s di bawah sorotan lampu, serta tes serap keringat.',
                'wording' => 'Jangan Salah Pilih Bahan Kaos Distro Kamu!',
                'copywriting' => "Mau bikin brand kaos tapi bingung pilih 24s atau 30s? Slide sampai akhir buat tahu perbedaan gramasi, kelembutan, dan iklim penggunaan yang paling pas buat target market kamu! #edukasikonveksi #cottoncombed #kaosdistro #sablonkaos",
                'hashtags' => '#edukasikonveksi #cottoncombed #kaosdistro #sablonkaos',
            ],
            [
                'title' => 'Dapur Pabrik Saat Mengejar Deadline',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Behind The Scene',
                'reference_link' => 'https://www.tiktok.com/search?q=behind%20the%20scenes%20garment%20factory',
                'visual_detail' => 'Montage ritme kerja cepat tim sablon manual, operator bordir 12 kepala, dan tumpukan potongan kain yang siap jahit.',
                'wording' => 'Detik-detik Kejar Deadline 1000 Pcs Baju Komunitas!',
                'copywriting' => "Di balik seragam keren kamu, ada kerja keras tim produksi yang bekerja presisi & tepat waktu. Terima kasih untuk kepercayaan ribuan klien kami! #behindthescenes #pabrikgarmen #produksikaos #konveksiterpercaya",
                'hashtags' => '#behindthescenes #pabrikgarmen #produksikaos #konveksiterpercaya',
            ],
            [
                'title' => 'A Day in Quality Control',
                'platform' => 'Shopee Video',
                'format' => 'Video',
                'pillar' => 'Behind The Scene',
                'reference_link' => 'https://www.tiktok.com/search?q=garment%20quality%20control',
                'visual_detail' => 'Tim QC memeriksa ketepatan ukuran (size chart), kekuatan tarikan jahitan leher, dan pembersihan sisa benang.',
                'wording' => 'Standard QC Ketat Sebelum Paket Dikirim ke Pelanggan!',
                'copywriting' => "Setiap lembar pakaian melewati 3 lapis pemeriksaan QC untuk memastikan zero-defect. Kualitas pelanggan adalah prioritas no. 1 kami. #qualitycontrol #pabrikgarmen #garansikualitas",
                'hashtags' => '#qualitycontrol #pabrikgarmen #garansikualitas',
            ],
            [
                'title' => 'Unboxing Sampel Baju Distro Client',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Product Showcase',
                'reference_link' => 'https://www.tiktok.com/search?q=unboxing%20clothing%20sample',
                'visual_detail' => 'Unboxing box sampel kaos dengan sablon plastisol raster bergradasi halus dan hangtag label eksklusif.',
                'wording' => 'Hasil Sampel Kaos Distro Brand Klien Baru!',
                'copywriting' => "Sampel pertama untuk brand lokal streetwear asal Bandung! Sablon plastisol doff dengan feel kain super lembut Cotton Combed 24s. Mau rilis brand clothing sendiri? Kita bantu dari nol! #kaosdistro #brandlokal #streetwear #konveksibandung",
                'hashtags' => '#kaosdistro #brandlokal #streetwear #konveksibandung',
            ],
            [
                'title' => 'Cara Hitung HPP Kaos untuk Brand Lokal',
                'platform' => 'Instagram Reels',
                'format' => 'Carousel',
                'pillar' => 'Edukasi',
                'reference_link' => 'https://www.tiktok.com/search?q=cara%20hitung%20hpp%20kaos',
                'visual_detail' => 'Infografis breakdown biaya bahan kain + ongkos jahit + sablon + packaging + margin profit sehat untuk clothing brand.',
                'wording' => 'Formula Menghitung HPP Kaos Supaya Bisnis Gak Boncos!',
                'copywriting' => "Banyak owner clothing gulung tikar karena salah hitung HPP! Simak panduan hitung biaya produksi riil dan penetapan harga jual ideal di postingan ini. Simpan postingan ini buat referensi! #tipsbisnis #clothingbrand #edukasibisnis #hppkaos",
                'hashtags' => '#tipsbisnis #clothingbrand #edukasibisnis #hppkaos',
            ],
            [
                'title' => 'Promo Mega 7.7 Konveksi Batch Juli',
                'platform' => 'Shopee Video',
                'format' => 'Video',
                'pillar' => 'Promo',
                'reference_link' => 'https://www.tiktok.com/search?q=promo%20konveksi%20baju',
                'visual_detail' => 'Display banner animasi promo diskon 15% untuk minimal order 50 pcs + gratis desain & free ongkir pulau Jawa.',
                'wording' => 'Promo Spesial Mega 7.7: Diskon Order Konveksi Terbatas!',
                'copywriting' => "Kabar gembira buat kamu yang mau bikin merchandise komunitas atau seragam kantor! Dapatkan potongan harga spesial Mega 7.7 hingga 15% untuk order minggu ini. Slot produksi terbatas! #promobatch #diskonkonveksi #seragammurah #merchandise",
                'hashtags' => '#promobatch #diskonkonveksi #seragammurah #merchandise',
            ],
            [
                'title' => 'Showcase Jaket Windbreaker Custom',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Product Showcase',
                'reference_link' => 'https://www.tiktok.com/search?q=custom%20windbreaker%20jacket',
                'visual_detail' => 'Video memperlihatkan efek air memantul di bahan kain taslan (water repellent) dan detail resleting waterproof.',
                'wording' => 'Jaket Custom Water-Repellent Anti Angin & Hujan Gerimis!',
                'copywriting' => "Jaket Windbreaker berbahan Parasut Despo/Taslan cocok banget buat apparel kantor atau merch komunitas. Tahan angin dan water-repellent! Mau buat juga? #jaketcustom #windbreaker #pabrikjaket #konveksijaket",
                'hashtags' => '#jaketcustom #windbreaker #pabrikjaket #konveksijaket',
            ],
            [
                'title' => 'Klien Minta Desain Unik, Bisakah Pabrik Eksekusi?',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Behind The Scene',
                'reference_link' => 'https://www.tiktok.com/search?q=custom%20embroidery%20process',
                'visual_detail' => 'Proses digitalisasi desain vektor menjadi file pola bordir mesin Tajima 12 warna dengan akurasi 99%.',
                'wording' => 'Desain Rumit? Tenang, Mesin Bordir Komputer Kami Siap Eksekusi!',
                'copywriting' => "Tantangan desain detail tingkat tinggi bukan masalah lagi! Dengan mesin bordir komputer mutakhir, gradasi dan garis halus tetap terbaca rapi. Kirim desain kamu sekarang untuk uji sampel! #bordirkomputer #pabrikseragam #konveksiprofesional",
                'hashtags' => '#bordirkomputer #pabrikseragam #konveksiprofesional',
            ],
            [
                'title' => 'Jumat Berkah bersama Tim Cutting Pabrik',
                'platform' => 'Instagram Reels',
                'format' => 'Video',
                'pillar' => 'Testimonial',
                'reference_link' => 'https://www.tiktok.com/search?q=pabrik%20garmen%20indonesia',
                'visual_detail' => 'Kegiatan sharing dan kebersamaan seluruh kru produksi pabrik di hari Jumat dengan senyum hangat.',
                'wording' => 'Energi Positif & Komitmen Kualitas dari Kru Terbaik Kami!',
                'copywriting' => "Kebersamaan dan ketulusan tim di balik setiap helai pakaian yang kami produksi. Kerja dengan hati, hasilkan karya berkualitas tinggi untuk seluruh pelanggan di Indonesia. #kebersamaan #budayakerja #timhebat",
                'hashtags' => '#kebersamaan #budayakerja #timhebat',
            ],
            [
                'title' => '3 Jenis Sablon Terfavorit 2026',
                'platform' => 'Instagram Reels',
                'format' => 'Carousel',
                'pillar' => 'Edukasi',
                'reference_link' => 'https://www.tiktok.com/search?q=jenis%20sablon%20kaos%20terbaik',
                'visual_detail' => 'Perbandingan visual Sablon DTF High Density, Plastisol Doff, dan Discharge Cabut Warna pada kain gelap.',
                'wording' => 'Pilih Sablon yang Tepat untuk Desain Brand Kamu!',
                'copywriting' => "Bingung mau pakai DTF, Plastisol, atau Discharge? Cek kelebihan dan kekurangan masing-masing sablon di slide berikut supaya hasil cetak sesuai ekspektasi! #sablonkaos #sablonplastisol #sablondtf #edukasikonveksi",
                'hashtags' => '#sablonkaos #sablonplastisol #sablondtf #edukasikonveksi',
            ],
            [
                'title' => 'Selamat Hari Koperasi Nasional - Bikin Seragam Bareng',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Promo',
                'reference_link' => 'https://www.tiktok.com/search?q=seragam%20koperasi%20batik',
                'visual_detail' => 'Showcase seragam batik kombinasi drill untuk instansi koperasi dan UKM daerah.',
                'wording' => 'Spesial Hari Koperasi: Solusi Seragam Kompak & Berwibawa!',
                'copywriting' => "Dukung kemajuan koperasi Indonesia dengan seragam berwibawa dan nyaman dipakai seharian. Dapatkan paket bundling seragam batik kombinasi sekarang! #harikoperasi #seragamkoperasi #bikinbaju",
                'hashtags' => '#harikoperasi #seragamkoperasi #bikinbaju',
            ],
            [
                'title' => 'Review Jujur Brand Lokal Langganan',
                'platform' => 'Shopee Video',
                'format' => 'Video',
                'pillar' => 'Testimonial',
                'reference_link' => 'https://www.tiktok.com/search?q=review%20konveksi%20baju%20distro',
                'visual_detail' => 'Cuplikan interview singkat pemilik brand clothing lokal yang menceritakan repeat order 5 batch berturut-turut.',
                'wording' => 'Kenapa Brand Ini Selalu Repeat Order di Tempat Kami?',
                'copywriting' => "Konsistensi ukuran, ketahanan sablon cuci berkali-kali, dan kepastian jadwal kirim jadi alasan utama brand clothing terus mempercayakan produksinya kepada kami. #reviewklien #testimonikonveksi #brandlokal",
                'hashtags' => '#reviewklien #testimonikonveksi #brandlokal',
            ],
            [
                'title' => 'Showcase Polo Shirt Bordir Komputer',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Product Showcase',
                'reference_link' => 'https://www.tiktok.com/search?q=polo%20shirt%20bordir%20custom',
                'visual_detail' => 'Kamera menyorot detail kerah rajut elastis, placket kancing rapi, dan bordir logo dada yang sangat presisi.',
                'wording' => 'Polo Shirt Premium Lacoste CVC: Adem & Elegan!',
                'copywriting' => "Polo shirt berbahan Lacoste CVC premium dengan daya serap tinggi. Pilihan tepat untuk seragam dinas harian, event golf, atau gathering perusahaan! #poloshirt #kaoswangki #seragampolo #bordirlogo",
                'hashtags' => '#poloshirt #kaoswangki #seragampolo #bordirlogo',
            ],
            [
                'title' => 'POV: Kamu Main ke Pabrik Konveksi Kami',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Behind The Scene',
                'reference_link' => 'https://www.tiktok.com/search?q=pov%20pabrik%20konveksi',
                'visual_detail' => 'Kamera First-Person View (FPV) berjalan menyusuri area pemotongan kain, meja sablon manual panjang, hingga ruang steam uap.',
                'wording' => 'Tour Singkat Fasilitas Pabrik Produksi Garmen Kami!',
                'copywriting' => "Mau tahu bagaimana ribuan pcs pakaian diproduksi setiap harinya? Yuk ikut virtual tour mengelilingi pabrik konveksi modern kami! #virtualtour #pabrikgarmen #garmenindonesia",
                'hashtags' => '#virtualtour #pabrikgarmen #garmenindonesia',
            ],
            [
                'title' => 'Ciri Jahitan Rantai Berkualitas pada Kaos',
                'platform' => 'Instagram Reels',
                'format' => 'Image',
                'pillar' => 'Edukasi',
                'reference_link' => 'https://www.tiktok.com/search?q=jahitan%20rantai%20kaos',
                'visual_detail' => 'Foto macro close-up jahitan rantai pundak kaos yang padat dan rapi tanpa ada benang lompat.',
                'wording' => 'Kenapa Kaos Bagus Wajib Punya Jahitan Rantai di Pundak?',
                'copywriting' => "Jahitan rantai di bagian bahu bukan sekadar hiasan, melainkan penguat struktur kaos agar tidak mudah melar saat sering dicuci. Pastikan kaos produksi kamu punya standard ini! #edukasikonveksi #tipsclothing #jahitanrantai",
                'hashtags' => '#edukasikonveksi #tipsclothing #jahitanrantai',
            ],
            [
                'title' => 'Cerita Kerugian Gara-gara Kain Cacat & Solusinya',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Behind The Scene',
                'reference_link' => 'https://www.tiktok.com/search?q=masalah%20kain%20konveksi',
                'visual_detail' => 'Penjelasan visual cara mendeteksi kain bolong mikro atau belang warna sebelum naik ke meja cutting.',
                'wording' => 'Cara Kami Menghindari Kain Cacat Lolos ke Konsumen!',
                'copywriting' => "Proses inspeksi kain roll adalah garda terdepan kami. Setiap rol kain diinspeksi di meja lampu khusus sebelum dipotong demi mencegah cacat produksi. #tipsgarmen #inspeksikain #kualitasterjamin",
                'hashtags' => '#tipsgarmen #inspeksikain #kualitasterjamin',
            ],
            [
                'title' => 'Tips Memilih Vendor Garment untuk Pemula',
                'platform' => 'Instagram Reels',
                'format' => 'Carousel',
                'pillar' => 'Edukasi',
                'reference_link' => 'https://www.tiktok.com/search?q=tips%20memilih%20vendor%20konveksi',
                'visual_detail' => 'Carousel 5 slide tips: periksa portofolio riil, minta sampel kain, cek legalitas & alamat pabrik, tanyakan garansi reject.',
                'wording' => '5 Checklist Wajib Sebelum Transfer DP ke Vendor Konveksi!',
                'copywriting' => "Jangan sampai tertipu vendor abal-abal! Ikuti 5 tips krusial ini sebelum memutuskan bekerjasama dengan pabrik konveksi untuk brand atau acaramu. #tipsbisnis #carivendor #konveksiterpercaya",
                'hashtags' => '#tipsbisnis #carivendor #konveksiterpercaya',
            ],
            [
                'title' => 'Kemeja Tactical / PDL Outdoor Spesifikasi Militer',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Product Showcase',
                'reference_link' => 'https://www.tiktok.com/search?q=kemeja%20tactical%20outdoor',
                'visual_detail' => 'Uji ketahanan gesek kain Ripstop Tornado dan demonstrasi ventilasi jaring punggung saat dipakai outdoor.',
                'wording' => 'Kemeja Tactical Tangguh Buat Segala Medan Ekstrem!',
                'copywriting' => "Kemeja PDL Tactical dengan bahan Ripstop tebal anti sobek, airflow punggung anti gerah, dan multi-pocket fungsional. Siap kirim ke seluruh Indonesia! #kemejatactical #pdloutdoor #konveksitactical",
                'hashtags' => '#kemejatactical #pdloutdoor #konveksitactical',
            ],
            [
                'title' => 'Keseruan Lembur Tim Finishing Pabrik',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Behind The Scene',
                'reference_link' => 'https://www.tiktok.com/search?q=keseruan%20kerja%20pabrik',
                'visual_detail' => 'Suasana hangat tim finishing melipat baju, menyetrika uap, dan menyemprotkan parfum laundry eksklusif.',
                'wording' => 'Setiap Baju Kami Berikan Sentuhan Wangi & Rapi!',
                'copywriting' => "Sentuhan akhir yang bikin baju langsung siap pakai begitu tiba di tangan customer. Rapi, higienis, dan wangi khas garmen premium. #finishingbaju #pabrikkaos #steamclothing",
                'hashtags' => '#finishingbaju #pabrikkaos #steamclothing',
            ],
            [
                'title' => 'Kain Drill vs Tropical untuk Kemeja Kantor',
                'platform' => 'Instagram Reels',
                'format' => 'Carousel',
                'pillar' => 'Edukasi',
                'reference_link' => 'https://www.tiktok.com/search?q=kain%20drill%20vs%20tropical',
                'visual_detail' => 'Perbandingan serat rajutan kain Nagata Drill vs Taipan Tropical dengan zoom mikroskop.',
                'wording' => 'Nagata Drill atau Taipan Tropical? Mana yang Lebih Nyaman?',
                'copywriting' => "Kedua kain ini adalah primadona untuk kemeja seragam kantor. Yuk kenali kelebihan masing-masing agar pas dengan budget dan kenyamanan kerja tim kamu! #kaindrill #kaintropical #seragamkantor",
                'hashtags' => '#kaindrill #kaintropical #seragamkantor',
            ],
            [
                'title' => 'Spill Pesanan Baju Komunitas Motor',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Product Showcase',
                'reference_link' => 'https://www.tiktok.com/search?q=kaos%20komunitas%20motor',
                'visual_detail' => 'Showcase 200 pcs kaos komunitas bikers dengan sablon plastisol emas mengkilap dan box packaging custom.',
                'wording' => 'Hasil Produksi Kaos Anniversary Bikers Club!',
                'copywriting' => "Terima kasih untuk Komunitas Motor Indonesia yang telah mempercayakan merchandise anniversary-nya kepada kami! Keren, solid, dan berkelas! #kaoskomunitas #bikersindonesia #merchandiseclub",
                'hashtags' => '#kaoskomunitas #bikersindonesia #merchandiseclub',
            ],
            [
                'title' => 'Hari Anak Nasional - Produksi Baju Anak Super Nyaman',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Promo',
                'reference_link' => 'https://www.tiktok.com/search?q=baju%20anak%20katun%20bambu',
                'visual_detail' => 'Showcase setelan baju anak berbahan katun bambu organik yang super lembut, anti bakteri, dan bersertifikat OEKO-TEX.',
                'wording' => 'Spesial Hari Anak: Pakaian Anak Anti Alergi & Super Lembut!',
                'copywriting' => "Kulit anak sensitif? Kami sediakan bahan Cotton Bamboo 30s alami yang super adem dan aman untuk kulit si kecil. Konsultasikan order brand baju anak sekarang! #bajuanak #katunbambu #harianaknasional",
                'hashtags' => '#bajuanak #katunbambu #harianaknasional',
            ],
            [
                'title' => 'Dari Mesin Jahit Portable Sampai Punya Pabrik Sendiri',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Testimonial',
                'reference_link' => 'https://www.tiktok.com/search?q=kisah%20sukses%20pengusaha%20konveksi',
                'visual_detail' => 'Dokumentasi perjalanan awal mula usaha dari 1 mesin jahit di garasi hingga berkembang menjadi pabrik dengan puluhan operator.',
                'wording' => 'Perjalanan 8 Tahun Membangun Pabrik Garmen Terpercaya!',
                'copywriting' => "Bermula dari mimpi kecil dan komitmen menjaga amanah setiap jahitan. Terima kasih untuk seluruh partner setia yang terus bertumbuh bersama kami! #kisahsukses #kisahpengusaha #umkmindonesia",
                'hashtags' => '#kisahsukses #kisahpengusaha #umkmindonesia',
            ],
            [
                'title' => 'Payday Promo Special Batch Agustus',
                'platform' => 'Shopee Video',
                'format' => 'Video',
                'pillar' => 'Promo',
                'reference_link' => 'https://www.tiktok.com/search?q=payday%20promo%20konveksi',
                'visual_detail' => 'Banner promosi flash deal gajian dengan voucher cashback order seragam dan free sample kit bahan kain.',
                'wording' => 'Gajian Tiba! Waktunya Amankan Slot Produksi Seragam!',
                'copywriting' => "Jangan lewatkan Payday Promo minggu ini! Dapatkan free sample kit kain dan potongan ongkir ke seluruh Indonesia untuk setiap pemesanan seragam institusi. #paydaysale #promogajian #seragamkantor",
                'hashtags' => '#paydaysale #promogajian #seragamkantor',
            ],
            [
                'title' => '5 Prediksi Tren Apparel Semester 2 2026',
                'platform' => 'Instagram Reels',
                'format' => 'Carousel',
                'pillar' => 'Edukasi',
                'reference_link' => 'https://www.tiktok.com/search?q=trend%20fashion%20apparel%202026',
                'visual_detail' => 'Slide presentasi moodboard tren warna earth tone, siluet oversized boxy cut, dan bahan fungsional tahan air.',
                'wording' => 'Bocoran Tren Fashion Streetwear Semester 2 Tahun 2026!',
                'copywriting' => "Siapkan koleksi clothing brand kamu dengan tren siluet dan palet warna terpanas tahun ini. Slide sampai selesai untuk melihat inspirasi cutting-nya! #fashiontrend2026 #streetwearstyle #boxytee #brandlokal",
                'hashtags' => '#fashiontrend2026 #streetwearstyle #boxytee #brandlokal',
            ],
            [
                'title' => 'Berapa Lama Pengerjaan 500 Pcs Kaos?',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Edukasi',
                'reference_link' => 'https://www.tiktok.com/search?q=waktu%20produksi%20kaos',
                'visual_detail' => 'Timeline animasi tahapan produksi dari sampling (2 hari), cutting & sablon (4 hari), sewing (3 hari), QC & packing (1 hari).',
                'wording' => 'Estimasi Waktu Produksi Ratusan Pcs Kaos di Pabrik Kami!',
                'copywriting' => "Punya event mepet? Kami sediakan layanan Express Production dengan kapasitas ribuan pcs per minggu tanpa mengorbankan kualitas sedikit pun. #waktuproduksi #pabrikkaos #konveksicepat",
                'hashtags' => '#waktuproduksi #pabrikkaos #konveksicepat',
            ],
            [
                'title' => 'Showcase Jersey Full Printing Custom',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Product Showcase',
                'reference_link' => 'https://www.tiktok.com/search?q=jersey%20sublim%20printing%20custom',
                'visual_detail' => 'Warna tajam hasil mesin cetak sublimasi Mimaki pada kain Milano Dry-Fit dengan detail jahitan elastis.',
                'wording' => 'Jersey Futsal & Sepeda Printing: Warna Tajam & Anti Pudar!',
                'copywriting' => "Jersey printing dengan teknologi tinta sublimasi Jepang. Warna cerah tidak akan luntur meski dicuci ratusan kali. Cocok buat tim futsal, esport, atau running! #jerseysublim #jerseyprinting #jerseyfutsal #konveksijersey",
                'hashtags' => '#jerseysublim #jerseyprinting #jerseyfutsal #konveksijersey',
            ],
            [
                'title' => 'Tipe-Tipe Penjahit di Pabrik Garment',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Tren',
                'reference_link' => 'https://www.tiktok.com/search?q=humor%20penjahit%20pabrik',
                'visual_detail' => 'Video komedi/relatable tentang tingkah laku penjahit master vs penjahit pemula yang menghibur.',
                'wording' => 'Kamu Tipe Penjahit yang Santai atau yang Super Perfeksionis?',
                'copywriting' => "Di balik keseriusan produksi, selalu ada tawa dan kekompakan di lantai pabrik! Mana nih yang paling mirip sama kamu? Tulis di kolom komentar ya! #humorkerja #pabrikgarmen #karyawanpabrik",
                'hashtags' => '#humorkerja #pabrikgarmen #karyawanpabrik',
            ],
            [
                'title' => 'Unboxing Merchandise Event BUMN',
                'platform' => 'Shopee Video',
                'format' => 'Video',
                'pillar' => 'Product Showcase',
                'reference_link' => 'https://www.tiktok.com/search?q=unboxing%20merchandise%20bumn',
                'visual_detail' => 'Unboxing souvenir pouch, polo shirt bordir, dan lanyard custom yang dipacking dalam hardbox eksklusif.',
                'wording' => 'Paket Merchandise Eksklusif untuk Event BUMN Selesai!',
                'copywriting' => "Satu paket komplit merchandise instansi: Polo shirt, tote bag kanvas, dan lanyard premium. Siap membuat event perusahaan Anda makin berkesan dan prestisius! #merchandisebumn #souvenirkantor #corporateevent",
                'hashtags' => '#merchandisebumn #souvenirkantor #corporateevent',
            ],
            [
                'title' => 'Recap Produksi Pabrik Bulan Ini',
                'platform' => 'TikTok',
                'format' => 'Video',
                'pillar' => 'Behind The Scene',
                'reference_link' => 'https://www.tiktok.com/search?q=recap%20produksi%20pabrik',
                'visual_detail' => 'Kompilasi cepat (fast cuts) seluruh pesanan yang selesai dikirim bulan ini dan testimoni kepuasan klien.',
                'wording' => 'Total 15.000 Pcs Pakaian Terkirim Bulan Ini! Terima Kasih!',
                'copywriting' => "Bulan yang penuh pencapaian dan kebahagiaan! Terima kasih kepada seluruh klien institusi, brand clothing, dan komunitas di seluruh pelosok Indonesia. Sampai jumpa di batch bulan depan! #recapbulan #pabrikgarmen #produksisukses",
                'hashtags' => '#recapbulan #pabrikgarmen #produksisukses',
            ],
        ];

        $items = [];
        $templateCount = count($sampleTemplates);

        foreach ($dates as $index => $dateStr) {
            $template = $sampleTemplates[$index % $templateCount];
            // Rotate platform if user selected multiple platforms
            $selectedPlatform = !empty($platforms) ? $platforms[$index % count($platforms)] : $template['platform'];
            
            $items[] = [
                'scheduled_date' => $dateStr,
                'platform' => $selectedPlatform,
                'format' => $template['format'],
                'pillar' => $template['pillar'],
                'title' => $template['title'],
                'reference_link' => $template['reference_link'],
                'visual_detail' => $template['visual_detail'],
                'wording' => $template['wording'],
                'copywriting' => $template['copywriting'],
                'hashtags' => $template['hashtags'],
                'status' => 'Draft',
            ];
        }

        return $items;
    }
}
