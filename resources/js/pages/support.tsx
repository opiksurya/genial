import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { 
    Palette, 
    Database, 
    Video, 
    Camera, 
    Sparkles, 
    Layers, 
    TrendingUp, 
    CheckCircle2, 
    ArrowRight, 
    MessageSquare, 
    Sun, 
    Moon, 
    Menu, 
    X, 
    ShieldCheck, 
    BarChart3, 
    Box, 
    DollarSign, 
    Users, 
    FileText, 
    Zap,
    Cpu,
    Smartphone,
    LayoutDashboard
} from 'lucide-react';
import { useGtm } from '@/hooks/use-gtm';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';

interface SupportProps {
    whatsappNumber?: string;
    whatsappDefaultMessage?: string;
}

export default function SupportPage({
    whatsappNumber = '6281234567890',
    whatsappDefaultMessage = 'Halo Genial Digital Solution, saya ingin konsultasi mengenai Penunjang Bisnis (Digital Creative & Sistem ERP)'
}: SupportProps) {
    const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'creative' | 'erp'>('all');

    // Initialize GTM tracking
    useGtm();

    // System theme sync
    useEffect(() => {
        const savedTheme = localStorage.getItem('genial_theme') as 'dark' | 'light' | null;
        if (savedTheme) {
            setThemeMode(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            setThemeMode('light');
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(nextTheme);
        localStorage.setItem('genial_theme', nextTheme);
    };

    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappDefaultMessage)}`;

    const handleWaClick = (sourceLocation: string) => {
        if (typeof window !== 'undefined') {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'generate_lead',
                category: 'Engagement',
                action: 'Click WhatsApp',
                label: `Support Page - ${sourceLocation}`,
            });
        }
    };

    // Styling constants
    const isDark = themeMode === 'dark';
    const bgClass = isDark ? 'bg-[#000000] text-slate-100' : 'bg-[#f8fafc] text-slate-900';
    const cardBg = isDark ? 'bg-[#0c1322] border-slate-800' : 'bg-white border-slate-200/80 shadow-xl shadow-slate-200/60';
    const cardInnerBg = isDark ? 'bg-[#050914] border-slate-800/80' : 'bg-slate-50 border-slate-200/80';
    const textPrimary = isDark ? 'text-white' : 'text-slate-900';
    const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
    const headerBg = isDark ? 'bg-[#000000]/85 border-slate-800/80' : 'bg-white/85 border-slate-200/80';
    const navText = isDark ? 'text-slate-300 hover:text-[#05BAF0]' : 'text-slate-600 hover:text-[#2D90CA]';

    const creativeFeatures = [
        {
            icon: Video,
            title: 'High-Converting UGC & TikTok/Reels Video',
            desc: 'Produksi video pendek berdurasi 15-60 detik berkonsep User Generated Content (UGC), dikemas dengan visual hook kuat yang langsung menghentikan scroll audiens.'
        },
        {
            icon: Camera,
            title: 'Photoshoot & Videoshoot Produk Professional',
            desc: 'Tim kreatif Genial menangani langsung sesi pemotretan dan pengambilan gambar produk skala studio untuk menghasilkan materi iklan visual yang mewah & terpercaya.'
        },
        {
            icon: Sparkles,
            title: 'Copywriting Sakti & Scriptwriting Psikologi',
            desc: 'Naskah video dan penulisan teks iklan disusun menggunakan formula psikologi penjualan (AIDA/PAS Framework) yang memicu urgensi calon pembeli.'
        },
        {
            icon: Layers,
            title: 'A/B Testing Creative Matrix Berkelanjutan',
            desc: 'Setiap minggu kami memproduksi 3-5 variasi sudut pandang (angle) materi iklan baru untuk menguji performa CTR dan mencegah kejenuhan audiens (Ad Fatigue).'
        },
        {
            icon: Palette,
            title: 'Brand Visual Standards & Graphic Design',
            desc: 'Desain grafis banner iklan, carousel catalog, hingga feed sosial media yang konsisten sesuai identitas visual brand Anda.'
        }
    ];

    const erpFeatures = [
        {
            icon: Box,
            title: 'Manajemen Stok & Inventaris Real-Time',
            desc: 'Pantau stok barang masuk dan keluar di berbagai gudang secara akurat. Dapatkan notifikasi otomatis jika persediaan barang sudah mencapai ambang batas minimum.'
        },
        {
            icon: DollarSign,
            title: 'Pencatatan Penjualan & Laporan Keuangan Otomatis',
            desc: 'Integrasi laporan omset harian, alokasi biaya iklan (Ad Spend), pengeluaran operasional, hingga kalkulasi Laba/Rugi Bersih (Net Profit Margin) tanpa rumus Excel.'
        },
        {
            icon: LayoutDashboard,
            title: 'Executive Dashboard & Analitik Kinerja',
            desc: 'Dashboard visual intuitif yang menampilkan perkembangan statistik bisnis, tren transaksi bulanan, hingga perhitungan Return on Investment (ROI) secara transparan.'
        },
        {
            icon: Users,
            title: 'Pengelolaan Hak Akses & Multi-User Team',
            desc: 'Sistem pengaturan role fleksibel untuk Owner, Tim CS, Finance, hingga Media Buyer sehingga kerahasiaan data perusahaan tetap aman terkendali.'
        },
        {
            icon: FileText,
            title: 'Manajemen Pesanan & Resi Pengiriman CS',
            desc: 'Memudahkan tim Customer Service menginput pesanan masuk, mencetak label alamat pengiriman, serta melakukan tracking resi paket secara efisien.'
        }
    ];

    return (
        <div className={`min-h-screen font-sans ${bgClass} transition-colors duration-300 selection:bg-[#00A9E7] selection:text-white`}>
            <Head>
                <title>Penunjang Bisnis & Sistem ERP - Genial Digital Solution</title>
                <meta name="description" content="Jelajahi fasilitas penunjang bisnis dari Genial: Layanan produksi Digital Creative (video UGC, photoshoot, copywriting) dan Pengelolaan Data Menggunakan Aplikasi ERP." />
            </Head>

            {/* NAVIGATION HEADER */}
            <PublicHeader 
                whatsappNumber={whatsappNumber}
                whatsappDefaultMessage={whatsappDefaultMessage}
                themeMode={themeMode}
                onToggleTheme={toggleTheme}
            />

            {/* HERO SECTION */}
            <section className="relative pt-16 pb-20 overflow-hidden">
                {/* Gradient Blur Background Glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#2D90CA]/20 via-[#00A9E7]/25 to-[#FAD03D]/15 blur-[120px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00A9E7]/40 bg-[#00A9E7]/10 backdrop-blur-md text-xs font-semibold text-[#00A9E7] mb-6">
                        <Sparkles className="w-4 h-4 text-[#FAD03D]" />
                        <span>Ekosistem Penunjang Operasional & Kreatif Client</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto mb-6">
                        Bukan Sekadar Iklan, Kami Sediakan <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0]">Ekosistem Penunjang Lengkap</span> Untuk Bisnis Anda
                    </h1>

                    <p className={`text-base sm:text-lg lg:text-xl max-w-3xl mx-auto ${textMuted} mb-10 leading-relaxed`}>
                        Selama bekerjasama dengan Genial, bisnis Anda ditopang oleh <strong className={textPrimary}>Dua Pilar Utama</strong>: Pasokan materi <strong className="text-[#00A9E7]">Digital Creative berkualitas tinggi</strong> untuk menarik pembeli, dan <strong className="text-[#FAD03D]">Aplikasi ERP Terintegrasi</strong> untuk kerapian stok, pesanan, & laporan keuangan.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={() => handleWaClick('Hero CTA')}
                            className="px-8 py-4 rounded-xl text-sm font-bold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-lg shadow-[#00A9E7]/30 hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            <MessageSquare className="w-5 h-5 text-slate-900 fill-slate-900/20" />
                            <span>Konsultasikan Kebutuhan Bisnis Anda</span>
                        </a>
                        <a 
                            href="#pillars" 
                            className={`px-8 py-4 rounded-xl text-sm font-semibold border transition-all ${isDark ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'}`}
                        >
                            Jelajahi 2 Pilar Penunjang ↓
                        </a>
                    </div>
                </div>
            </section>

            {/* DUAL PILLARS SUMMARY CARDS */}
            <section id="pillars" className="py-12 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Pillar 1: Digital Creative */}
                        <div className={`p-8 rounded-3xl border ${cardBg} relative overflow-hidden group hover:border-[#00A9E7]/60 transition-all duration-300`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00A9E7]/20 to-transparent rounded-bl-full pointer-events-none" />
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2D90CA] to-[#00A9E7] flex items-center justify-center text-white mb-6 shadow-md shadow-[#00A9E7]/30">
                                <Palette className="w-7 h-7" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#00A9E7] mb-2 block">Pilar Penunjang #1</span>
                            <h2 className={`text-2xl font-bold ${textPrimary} mb-4`}>Digital Creative Production</h2>
                            <p className={`${textMuted} text-sm leading-relaxed mb-6`}>
                                Iklan tidak akan mengkonversi tanpa materi visual yang kuat. Kami memproduksi konten video UGC, visual photoshoot studio, copywriting persuasif, hingga desain banner yang siap mendominasi pasar.
                            </p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-3 text-sm font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Video Shorts, UGC, & Reels Ads High CTR</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Studio Photoshoot & Videoshoot Produk</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Scriptwriting Psikologi & Rotasi Creative Matrix</span>
                                </li>
                            </ul>
                            <button 
                                onClick={() => setActiveTab('creative')} 
                                className="inline-flex items-center gap-2 text-sm font-bold text-[#00A9E7] hover:underline"
                            >
                                <span>Lihat Rincian Penawaran Kreatif</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Pillar 2: ERP Application */}
                        <div className={`p-8 rounded-3xl border ${cardBg} relative overflow-hidden group hover:border-[#FAD03D]/60 transition-all duration-300`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FAD03D]/20 to-transparent rounded-bl-full pointer-events-none" />
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00A9E7] to-[#FAD03D] flex items-center justify-center text-slate-900 mb-6 shadow-md shadow-[#FAD03D]/30">
                                <Database className="w-7 h-7" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#FAD03D] mb-2 block">Pilar Penunjang #2</span>
                            <h2 className={`text-2xl font-bold ${textPrimary} mb-4`}>Pengelolaan Data dengan Aplikasi ERP</h2>
                            <p className={`${textMuted} text-sm leading-relaxed mb-6`}>
                                Penjualan naik tanpa pencatatan data yang baik bisa menyebabkan kebocoran stok dan kebingungan profit. Kami lengkapi bisnis Anda dengan Aplikasi ERP modern untuk mengontrol inventaris, transaksi, dan keuangan.
                            </p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-3 text-sm font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Manajemen Stok & Gudang Multi-Warehouse</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Laporan Keuangan, Omset, & Net Profit Real-Time</span>
                                </li>
                                <li className="flex items-center gap-3 text-sm font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>Input Order CS & Dashboard Performa Bisnis</span>
                                </li>
                            </ul>
                            <button 
                                onClick={() => setActiveTab('erp')} 
                                className="inline-flex items-center gap-2 text-sm font-bold text-[#FAD03D] hover:underline"
                            >
                                <span>Lihat Fitur Sistem ERP</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                    </div>
                </div>
            </section>

            {/* TAB FILTER CONTROL */}
            <section className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center gap-2 p-1.5 rounded-2xl bg-[#0c1322]/60 border border-slate-800 max-w-md mx-auto">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-gradient-to-r from-[#2D90CA] to-[#00A9E7] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            Semua Penunjang
                        </button>
                        <button
                            onClick={() => setActiveTab('creative')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === 'creative' ? 'bg-[#00A9E7] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            Digital Creative
                        </button>
                        <button
                            onClick={() => setActiveTab('erp')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === 'erp' ? 'bg-[#FAD03D] text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            Aplikasi ERP
                        </button>
                    </div>
                </div>
            </section>

            {/* DETAILED FEATURES BREAKDOWN */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                    
                    {/* SECTION 1: DIGITAL CREATIVE PRODUCTION */}
                    {(activeTab === 'all' || activeTab === 'creative') && (
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-[#00A9E7]/20 border border-[#00A9E7]/40 flex items-center justify-center text-[#00A9E7]">
                                    <Palette className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={`text-2xl font-extrabold ${textPrimary}`}>Fasilitas 1: Digital Creative & Asset Production</h3>
                                    <p className={`text-sm ${textMuted}`}>Layanan pembuat materi iklan visual & naskah kreatif yang dirancang khusus untuk meningkatkan Angka Konversi (CVR) & Click-Through Rate (CTR).</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {creativeFeatures.map((item, idx) => {
                                    const IconComp = item.icon;
                                    return (
                                        <div key={idx} className={`p-6 rounded-2xl border ${cardBg} hover:border-[#00A9E7]/50 transition-all duration-300 flex flex-col justify-between`}>
                                            <div>
                                                <div className="w-12 h-12 rounded-xl bg-[#00A9E7]/10 border border-[#00A9E7]/30 flex items-center justify-center text-[#00A9E7] mb-4">
                                                    <IconComp className="w-6 h-6" />
                                                </div>
                                                <h4 className={`text-lg font-bold ${textPrimary} mb-2`}>{item.title}</h4>
                                                <p className={`text-sm ${textMuted} leading-relaxed`}>{item.desc}</p>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-xs font-semibold text-[#00A9E7]">
                                                <Sparkles className="w-3.5 h-3.5 text-[#FAD03D]" />
                                                <span>Termasuk dalam Paket Kerjasama</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: ERP DATA MANAGEMENT */}
                    {(activeTab === 'all' || activeTab === 'erp') && (
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-[#FAD03D]/20 border border-[#FAD03D]/40 flex items-center justify-center text-[#FAD03D]">
                                    <Database className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={`text-2xl font-extrabold ${textPrimary}`}>Fasilitas 2: Pengelolaan Data Menggunakan Aplikasi ERP</h3>
                                    <p className={`text-sm ${textMuted}`}>Sistem aplikasi ERP Cloud untuk kerapian pencatatan stok, pesanan CS, alokasi biaya pengeluaran, serta grafik profitabilitas bisnis secara real-time.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {erpFeatures.map((item, idx) => {
                                    const IconComp = item.icon;
                                    return (
                                        <div key={idx} className={`p-6 rounded-2xl border ${cardBg} hover:border-[#FAD03D]/50 transition-all duration-300 flex flex-col justify-between`}>
                                            <div>
                                                <div className="w-12 h-12 rounded-xl bg-[#FAD03D]/10 border border-[#FAD03D]/30 flex items-center justify-center text-[#FAD03D] mb-4">
                                                    <IconComp className="w-6 h-6" />
                                                </div>
                                                <h4 className={`text-lg font-bold ${textPrimary} mb-2`}>{item.title}</h4>
                                                <p className={`text-sm ${textMuted} leading-relaxed`}>{item.desc}</p>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-xs font-semibold text-[#FAD03D]">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>Akses Sistem ERP untuk Klien</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>
            </section>

            {/* WHY THIS MATTERS / BUSINESS IMPACT */}
            <section className="py-16 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`p-8 sm:p-12 rounded-3xl border ${cardInnerBg} text-center relative overflow-hidden`}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00A9E7]/30 bg-[#00A9E7]/10 text-xs font-semibold text-[#00A9E7] mb-6">
                            <TrendingUp className="w-4 h-4 text-[#FAD03D]" />
                            <span>Dampak Langsung Bagi Bisnis Client</span>
                        </div>

                        <h2 className={`text-2xl sm:text-4xl font-extrabold ${textPrimary} mb-6 max-w-3xl mx-auto`}>
                            Mengapa Kombinasi <span className="text-[#00A9E7]">Digital Creative</span> & <span className="text-[#FAD03D]">Sistem ERP</span> Sangat Penting?
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-8">
                            <div className={`p-6 rounded-2xl border ${cardBg}`}>
                                <div className="text-3xl font-extrabold text-[#00A9E7] mb-2">3x CVR</div>
                                <h4 className={`font-bold ${textPrimary} mb-2`}>Konversi Iklan Melonjak</h4>
                                <p className={`text-xs ${textMuted} leading-relaxed`}>Materi visual segar dan video UGC mencegah kejenuhan iklan (Ad Fatigue) sehingga angka konversi tetap konsisten tinggi.</p>
                            </div>
                            <div className={`p-6 rounded-2xl border ${cardBg}`}>
                                <div className="text-3xl font-extrabold text-[#FAD03D] mb-2">0% Leakage</div>
                                <h4 className={`font-bold ${textPrimary} mb-2`}>Bebas Kebocoran Stok & Omset</h4>
                                <p className={`text-xs ${textMuted} leading-relaxed`}>Semua stok barang dan pesanan tercatat di aplikasi ERP, menghilangkan risiko barang hilang atau selisih uang kas.</p>
                            </div>
                            <div className={`p-6 rounded-2xl border ${cardBg}`}>
                                <div className="text-3xl font-extrabold text-emerald-400 mb-2">100% Focus</div>
                                <h4 className={`font-bold ${textPrimary} mb-2`}>Owner Fokus Scaling Bisnis</h4>
                                <p className={`text-xs ${textMuted} leading-relaxed`}>Anda tidak perlu pusing memikirkan teknis pembuatan naskah video atau pengolahan data rumit di Excel.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#2D90CA]/25 via-[#00A9E7]/30 to-[#FAD03D]/20 blur-[130px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
                        Siap Mengakselerasi Bisnis Anda dengan <br className="hidden sm:block" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#FAD03D]">Ekosistem Penunjang Terlengkap?</span>
                    </h2>

                    <p className={`text-base sm:text-lg max-w-2xl mx-auto ${textMuted} mb-10`}>
                        Dapatkan pasokan Digital Creative secara berkala dan nikmati kemudahan pengelolaan data usaha Anda menggunakan Aplikasi ERP dari Genial Digital Solution.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={() => handleWaClick('Bottom CTA')}
                            className="w-full sm:w-auto px-9 py-4 rounded-xl text-base font-extrabold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-xl shadow-[#00A9E7]/35 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <MessageSquare className="w-5 h-5 text-slate-900 fill-slate-900/20" />
                            <span>Konsultasi Penunjang Bisnis via WA</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <PublicFooter themeMode={themeMode} />
        </div>
    );
}
