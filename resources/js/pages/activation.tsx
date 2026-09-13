import { Head } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { useGtm } from '@/hooks/use-gtm';
import { 
    CheckCircle2, 
    ArrowRight, 
    ShieldCheck, 
    Zap, 
    Clock, 
    Users, 
    BarChart3, 
    Layers, 
    Settings, 
    Headphones, 
    Lock, 
    FileText, 
    LayoutDashboard, 
    PlayCircle, 
    Sun, 
    Moon, 
    MessageSquare, 
    Menu, 
    X, 
    ChevronRight, 
    Sparkles, 
    RefreshCw, 
    Sliders, 
    Target,
    HelpCircle,
    Calendar,
    PhoneCall
} from 'lucide-react';

interface Props {
    whatsappNumber?: string;
    whatsappDefaultMessage?: string;
}

export default function ActivationPage({ 
    whatsappNumber = '6281234567890', 
    whatsappDefaultMessage = 'Halo Genial Digital Solution, saya ingin berkonsultasi mengenai alur aktivasi kerjasama digital marketing' 
}: Props) {
    useGtm();
    const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'steps' | 'deliverables' | 'maintenance'>('steps');

    useEffect(() => {
        const savedTheme = localStorage.getItem('genial_theme') as 'dark' | 'light';
        if (savedTheme) {
            setThemeMode(savedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setThemeMode(prefersDark ? 'dark' : 'light');
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(nextTheme);
        localStorage.setItem('genial_theme', nextTheme);
    };

    const isDark = themeMode === 'dark';

    const cleanWaNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(whatsappDefaultMessage)}`;

    // Theme tokens
    const bgClass = isDark ? 'bg-[#000000] text-slate-100' : 'bg-[#f8fafc] text-slate-900';
    const cardBg = isDark ? 'bg-[#0c1322] border-slate-800' : 'bg-white border-slate-200/80 shadow-xl shadow-slate-200/60';
    const cardInnerBg = isDark ? 'bg-[#050914] border-slate-800/80' : 'bg-slate-50 border-slate-200/80';
    const textPrimary = isDark ? 'text-white' : 'text-slate-900';
    const textMuted = isDark ? 'text-slate-300' : 'text-slate-600';
    const headerBg = isDark ? 'bg-[#000000]/80 border-slate-800/80' : 'bg-white/80 border-slate-200/80';
    const navText = isDark ? 'text-slate-300 hover:text-[#00A9E7]' : 'text-slate-700 hover:text-[#2D90CA]';

    const activationSteps = [
        {
            number: '01',
            title: 'Konsultasi & Free Digital Audit',
            duration: 'Hari ke-1',
            tag: 'Tahap Awal',
            icon: Target,
            description: 'Tim ahli kami menganalisis aset digital Anda (sosial media, website, iklan berjalan, & target market) untuk menemukan bottleneck dan peluang omset terbesar.',
            details: [
                'Audit kesehatan akun sosial media & iklan',
                'Analisis kompetitor & positioning produk',
                'Penentuan target KPI & estimasi ROAS'
            ]
        },
        {
            number: '02',
            title: 'Penentuan Strategi & MoU Kerjasama',
            duration: 'Hari ke-2',
            tag: 'Kesepakatan',
            icon: FileText,
            description: 'Kami menyusun proposal strategi custom sesuai kebutuhan bisnis Anda dan menandatangani perjanjian kerjasama resmi (MoU) untuk keamanan kedua belah pihak.',
            details: [
                'Penyusunan Media Plan & Content Roadmap',
                'Penandatanganan Kontrak Kerja (MoU)',
                'Pembayaran & Invoicing Transparan'
            ]
        },
        {
            number: '03',
            title: 'Setup System & Account Onboarding',
            duration: 'Hari ke-3',
            tag: 'Integrasi',
            icon: Settings,
            description: 'Tim teknis kami menyiapkan seluruh infrastruktur pendukung: Project Board Kanban, Meta CAPI Tracking, Google Analytics, & WhatsApp Group Komunikasi.',
            details: [
                'Pemberian akses ke Dashboard Project Flow',
                'Integrasi Meta Pixel & Conversion API (CAPI)',
                'Pembentukan WhatsApp Group dedicated & tim spesialis'
            ]
        },
        {
            number: '04',
            title: 'Kick-Off Meeting & Approval Konten',
            duration: 'Hari ke-4',
            tag: 'Eksekusi',
            icon: Users,
            description: 'Diskusi bersama Dedicated Account Manager untuk mematangkan visual tone, copywriting, serta menyetujui jadwal tayang konten & campaign iklan.',
            details: [
                'Review Moodboard & Design Guideline',
                'Approval Batch Konten & Copywriting',
                'Setup Ad Sets, Audience Targeting, & Budgeting'
            ]
        },
        {
            number: '05',
            title: 'Official Launch & Live Performance',
            duration: 'Hari ke-5 Seterusnya',
            tag: 'Going Live',
            icon: PlayCircle,
            description: 'Campaign resmi dijalankan! Anda dapat memantau progres durasi task, pengerjaan tim, serta laporan hasil iklan secara real-time dari mana saja.',
            details: [
                'Publishing konten sesuai jadwal',
                'Running iklan di Meta, TikTok, Shopee, / Google',
                'Live monitoring pada Client Dashboard'
            ]
        }
    ];

    const deliverables = [
        {
            icon: LayoutDashboard,
            title: 'Akses Client Dashboard Real-Time',
            description: 'Anda mendapatkan portal khusus untuk memantau status project, Kanban task board, Gantt Chart timeline, dan alokasi dana secara terbuka 24/7.'
        },
        {
            icon: Users,
            title: 'Dedicated Expert Team Assigned',
            description: 'Tim khusus profesional terdiri dari Account Manager, Content Creator, Copywriter, Media Buyer (Ads Specialist), dan Web Developer.'
        },
        {
            icon: ShieldCheck,
            title: 'Hak Cipta & Asset Kreatif 100%',
            description: 'Seluruh materi iklan, video reels/TikTok, desain feed, dan copywriting yang telah dibuat menjadi hak milik penuh brand Anda.'
        },
        {
            icon: BarChart3,
            title: 'Laporan Performa Transparan',
            description: 'Laporan mingguan & bulanan mencakup biaya iklan (Ad Spend), jumlah Lead, Conversions, CPR (Cost Per Result), dan tingkat ROAS.'
        },
        {
            icon: Zap,
            title: 'Integrasi Meta CAPI Advanced',
            description: 'Pemasangan Conversion API tingkat lanjut untuk menangkap data pembelian secara akurat tanpa terhalang pembatas browser iOS.'
        },
        {
            icon: Headphones,
            title: 'Fast Track WhatsApp Group Support',
            description: 'Grup komunikasi privat langsung bersama tim pelaksana untuk koordinasi cepat, revisi mendadak, dan ide strategi baru.'
        }
    ];

    const maintenanceItems = [
        {
            icon: RefreshCw,
            title: 'Daily Optimization & A/B Testing',
            description: 'Setiap hari tim Media Buyer memantau performa iklan, mematikan ad set yang mahal, dan melipatgandakan budget pada materi iklan dengan konversi tertinggi.'
        },
        {
            icon: Sliders,
            title: 'Refreshed Content & Creative Variation',
            description: 'Untuk mencegah ad fatigue (kejenuhan audiens), tim kreatif memproduksi variasi sudut pandang copywriting dan hook visual baru secara berkala.'
        },
        {
            icon: Lock,
            title: 'Server & Website Maintenance',
            description: 'Pemeriksaan rutin kecepatan loading website, jaminan keamanan SSL, proteksi dari serangan malware, dan backup database mingguan.'
        },
        {
            icon: Calendar,
            title: 'Monthly Strategy & Evaluation Meeting',
            description: 'Meeting bulanan via Zoom/Meet untuk mengevaluasi pencapaian omset, membedah data analitik, dan menentukan arah strategi bulan berikutnya.'
        }
    ];

    const faqs = [
        {
            q: 'Berapa lama proses dari konsultasi hingga iklan/konten bisa berjalan?',
            a: 'Proses aktivasi membutuhkan waktu rata-rata 3 hingga 5 hari kerja, mulai dari audit awal, kesepakatan strategi, setup sistem tracking, hingga persetujuan materi sebelum launched.'
        },
        {
            q: 'Bagaimana jika saya belum memiliki asset seperti foto produk atau video?',
            a: 'Tim Genial menyediakan layanan produksi konten lengkap, mulai dari penyusunan naskah script, pemilihan talent, photoshoot/videoshoot, hingga editing profesional.'
        },
        {
            q: 'Apakah saya bisa memantau budget iklan yang terpakai?',
            a: 'Ya, seluruh transparansi biaya iklan (Ad Spend) dapat Anda akses secara langsung melalui akun iklan Anda atau melalui dashboard sistem alokasi kebidangan kami.'
        },
        {
            q: 'Bagaimana cara melakukan klaim garansi atau perpanjangan jasa?',
            a: 'Di akhir periode setiap bulan, Account Manager Anda akan menyajikan laporan performa dan mendiskusikan rencana perpanjangan kerjasama atau skema pembagian komisi/bonus.'
        }
    ];

    return (
        <div className={`min-h-screen font-sans ${bgClass} transition-colors duration-300 selection:bg-[#00A9E7] selection:text-white`}>
            <Head>
                <title>Alur Aktivasi & Maintenance Kerjasama - Genial Digital Solution</title>
                <meta name="description" content="Pelajari langkah demi langkah alur aktivasi kerjasama digital marketing bersama Genial. Ketahui apa saja yang akan Anda dapatkan dan bagaimana sistem maintenance berkelanjutan kami." />
            </Head>

            {/* NAVIGATION HEADER */}
            <header className={`sticky top-0 z-50 backdrop-blur-xl ${headerBg} transition-all duration-300 border-b`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-3 group">
                        <img 
                            src="/logo.png" 
                            alt="Genial Digital Solution" 
                            className="h-10 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
                        />
                    </a>

                    {/* Desktop Nav Items */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a href="/" className={navText}>Beranda</a>
                        <a href="/how-we-work" className={navText}>Metode & Funnel</a>
                        <a href="/activation" className="text-[#00A9E7] font-bold border-b-2 border-[#00A9E7] pb-1">Cara Aktivasi</a>
                    </nav>

                    {/* Action Buttons & Theme Switcher */}
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${
                                isDark 
                                    ? 'bg-[#0c1322] border-slate-800 text-[#FAD03D] hover:bg-slate-900' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
                            }`}
                            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
                        >
                            {isDark ? <Sun className="w-5 h-5 text-[#FAD03D]" /> : <Moon className="w-5 h-5 text-[#2D90CA]" />}
                        </button>

                        <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm ${
                                isDark 
                                    ? 'text-emerald-400 border-slate-800 bg-[#0c1322] hover:bg-slate-900' 
                                    : 'text-emerald-600 border-slate-200 bg-white hover:bg-slate-100'
                            }`}
                            title="Konsultasi WhatsApp"
                        >
                            <MessageSquare className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                        </a>
                        
                        <a 
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-md shadow-[#00A9E7]/25 hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <span>Mulai Aktivasi</span>
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex md:hidden items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800 text-[#FAD03D]' : 'bg-white border-slate-200 text-slate-700'}`}
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className={`md:hidden ${isDark ? 'bg-[#000000] border-slate-800' : 'bg-white border-slate-200'} border-b px-4 pt-3 pb-6 space-y-3`}>
                        <a href="/" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navText}`}>Beranda</a>
                        <a href="/how-we-work" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navText}`}>Metode & Funnel Strategy</a>
                        <a href="/activation" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#00A9E7] font-bold">Cara Aktivasi & Onboarding</a>
                        <div className="pt-2">
                            <a 
                                href={waUrl} 
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full text-center block py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] shadow-md"
                            >
                                Hubungi Tim Aktivasi WhatsApp
                            </a>
                        </div>
                    </div>
                )}
            </header>

            {/* HERO BANNER SECTION */}
            <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
                
                {/* Subtle Background Glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#2D90CA]/20 via-[#00A9E7]/20 to-[#FAD03D]/15 blur-[120px] rounded-full pointer-events-none" />

                <div className="text-center relative z-10 max-w-3xl mx-auto">
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00A9E7]/30 bg-[#00A9E7]/10 text-[#00A9E7] text-xs font-bold mb-6 shadow-sm">
                        <Sparkles className="w-4 h-4 text-[#FAD03D]" />
                        <span>Panduan Transparan & Akses Sistem Real-Time</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                        Alur <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0]">Aktivasi Kerjasama</span> & Pendampingan Genial
                    </h1>

                    <p className={`mt-6 text-base sm:text-lg ${textMuted} leading-relaxed`}>
                        Proses bergabung yang cepat, transparan, dan terstruktur. Ketahui langkah demi langkah mulai dari audit awal, fasilitas yang didapatkan, hingga sistem maintenance iklan & website Anda.
                    </p>

                    {/* Quick Stat Highlights */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
                        <div className={`p-4 rounded-2xl border ${cardBg}`}>
                            <div className="text-xl sm:text-2xl font-black text-[#00A9E7]">3-5 Hari</div>
                            <div className="text-xs text-muted-foreground font-medium mt-0.5">Waktu Aktivasi</div>
                        </div>
                        <div className={`p-4 rounded-2xl border ${cardBg}`}>
                            <div className="text-xl sm:text-2xl font-black text-emerald-500">24/7</div>
                            <div className="text-xs text-muted-foreground font-medium mt-0.5">Pantau Dashboard</div>
                        </div>
                        <div className={`p-4 rounded-2xl border ${cardBg}`}>
                            <div className="text-xl sm:text-2xl font-black text-[#FAD03D]">100%</div>
                            <div className="text-xs text-muted-foreground font-medium mt-0.5">Hak Cipta Asset</div>
                        </div>
                        <div className={`p-4 rounded-2xl border ${cardBg}`}>
                            <div className="text-xl sm:text-2xl font-black text-[#2D90CA]">Dedicated</div>
                            <div className="text-xs text-muted-foreground font-medium mt-0.5">Tim Spesialis</div>
                        </div>
                    </div>

                </div>
            </section>

            {/* TAB SELECTOR SECTION */}
            <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/40">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                    <button
                        onClick={() => setActiveTab('steps')}
                        className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                            activeTab === 'steps' 
                                ? 'bg-gradient-to-r from-[#2D90CA] to-[#00A9E7] text-white shadow-lg shadow-[#00A9E7]/20 scale-105' 
                                : `${isDark ? 'bg-[#0c1322] text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900'} border`
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        <span>1. Step-by-Step Aktivasi</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('deliverables')}
                        className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                            activeTab === 'deliverables' 
                                ? 'bg-gradient-to-r from-[#2D90CA] to-[#00A9E7] text-white shadow-lg shadow-[#00A9E7]/20 scale-105' 
                                : `${isDark ? 'bg-[#0c1322] text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900'} border`
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>2. Apa Yang Didapatkan</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('maintenance')}
                        className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
                            activeTab === 'maintenance' 
                                ? 'bg-gradient-to-r from-[#2D90CA] to-[#00A9E7] text-white shadow-lg shadow-[#00A9E7]/20 scale-105' 
                                : `${isDark ? 'bg-[#0c1322] text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900'} border`
                        }`}
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>3. Sistem Maintenance</span>
                    </button>
                </div>
            </section>

            {/* TAB CONTENT 1: STEP-BY-STEP ACTIVATION */}
            {activeTab === 'steps' && (
                <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-extrabold">Alur Langkah demi Langkah Aktivasi</h2>
                        <p className={`mt-2 text-sm ${textMuted}`}>Proses onboarding cepat tanpa ribet dalam 5 tahap terstruktur</p>
                    </div>

                    <div className="space-y-6 relative">
                        
                        {/* Connecting Line for desktop */}
                        <div className="hidden lg:block absolute left-9 top-10 bottom-10 w-0.5 bg-gradient-to-b from-[#2D90CA] via-[#00A9E7] to-[#FAD03D] opacity-40 pointer-events-none" />

                        {activationSteps.map((step, idx) => {
                            const IconComponent = step.icon;
                            return (
                                <div 
                                    key={step.number} 
                                    className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 hover:border-[#00A9E7]/50 ${cardBg} relative overflow-hidden group`}
                                >
                                    <div className="flex flex-col md:flex-row items-start gap-6">
                                        
                                        {/* Step Icon Badge */}
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2D90CA] to-[#05BAF0] text-slate-900 flex items-center justify-center font-black text-xl shadow-lg shadow-[#00A9E7]/20 group-hover:scale-110 transition-transform">
                                                <IconComponent className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="md:hidden">
                                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#00A9E7]/10 text-[#00A9E7] border border-[#00A9E7]/30">
                                                    {step.duration}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Step Details */}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-4 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-extrabold text-[#FAD03D] uppercase tracking-wider font-mono">
                                                        PROSES {step.number}
                                                    </span>
                                                    <h3 className="text-xl font-bold">{step.title}</h3>
                                                </div>
                                                <span className="hidden md:inline-block text-xs font-bold px-3 py-1 rounded-full bg-[#00A9E7]/10 text-[#00A9E7] border border-[#00A9E7]/30">
                                                    {step.duration}
                                                </span>
                                            </div>

                                            <p className={`text-sm ${textMuted} leading-relaxed mb-4`}>
                                                {step.description}
                                            </p>

                                            {/* Sub Points */}
                                            <div className={`p-4 rounded-2xl ${cardInnerBg} border space-y-2`}>
                                                {step.details.map((detail, dIdx) => (
                                                    <div key={dIdx} className="flex items-center gap-2.5 text-xs font-semibold">
                                                        <CheckCircle2 className="w-4 h-4 text-[#00A9E7] shrink-0" />
                                                        <span>{detail}</span>
                                                    </div>
                                                ))}
                                            </div>

                                        </div>

                                    </div>
                                </div>
                            );
                        })}

                    </div>
                </section>
            )}

            {/* TAB CONTENT 2: DELIVERABLES & WHAT YOU GET */}
            {activeTab === 'deliverables' && (
                <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    
                    <div className="text-center mb-12 max-w-2xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-extrabold">Apa Saja Yang Didapatkan Setelah Aktivasi?</h2>
                        <p className={`mt-2 text-sm ${textMuted}`}>Fasilitas lengkap dan transparansi sistem digital agency profesional</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {deliverables.map((item, idx) => {
                            const IconComp = item.icon;
                            return (
                                <div 
                                    key={idx}
                                    className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${cardBg}`}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2D90CA]/20 to-[#05BAF0]/20 border border-[#00A9E7]/30 text-[#00A9E7] flex items-center justify-center mb-5">
                                        <IconComp className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                    <p className={`text-xs ${textMuted} leading-relaxed`}>
                                        {item.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Interactive Preview Notice */}
                    <div className={`mt-12 p-8 rounded-3xl border ${cardBg} bg-gradient-to-r from-[#2D90CA]/10 via-[#00A9E7]/10 to-transparent flex flex-col md:flex-row items-center justify-between gap-6`}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#00A9E7] text-slate-900 font-bold flex items-center justify-center shrink-0">
                                <LayoutDashboard className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-base">Portal Monitoring Klien Berbasis Web</h4>
                                <p className={`text-xs ${textMuted} mt-0.5`}>
                                    Akses status tugas tim, kalender konten, Gantt Chart timeline, dan komisi referral agent dalam satu tampilan modern.
                                </p>
                            </div>
                        </div>
                        <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-3 rounded-2xl text-xs font-bold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-md shrink-0"
                        >
                            Minta Demo Portal Client
                        </a>
                    </div>

                </section>
            )}

            {/* TAB CONTENT 3: MAINTENANCE SYSTEM */}
            {activeTab === 'maintenance' && (
                <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                    
                    <div className="text-center mb-12 max-w-2xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-extrabold">Bagaimana Sistem Maintenance & Pendampingannya?</h2>
                        <p className={`mt-2 text-sm ${textMuted}`}>Optimasi berkelanjutan untuk memastikan ROI & kesehatan aset digital Anda tetap terjaga</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {maintenanceItems.map((m, idx) => {
                            const IconM = m.icon;
                            return (
                                <div 
                                    key={idx}
                                    className={`p-6 sm:p-8 rounded-3xl border ${cardBg} flex items-start gap-5`}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FAD03D]/20 to-[#00A9E7]/20 border border-[#FAD03D]/30 text-[#FAD03D] flex items-center justify-center shrink-0">
                                        <IconM className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold mb-2">{m.title}</h3>
                                        <p className={`text-xs ${textMuted} leading-relaxed`}>
                                            {m.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Maintenance SLA Promise Card */}
                    <div className={`mt-10 p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-6`}>
                        <div className="flex items-center gap-4">
                            <ShieldCheck className="w-10 h-10 text-emerald-500 shrink-0" />
                            <div>
                                <h4 className="font-extrabold text-sm sm:text-base text-emerald-500">Service Level Agreement (SLA) & Responsif Guarantee</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Respon kendala teknis atau masalah iklan darurat maksimal 30 menit melalui WhatsApp Group Support resmi.
                                </p>
                            </div>
                        </div>
                        <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all shrink-0"
                        >
                            Konsultasi SLA & Kontrak
                        </a>
                    </div>

                </section>
            )}

            {/* FAQ SECTION */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-800/40">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-extrabold flex items-center justify-center gap-2">
                        <HelpCircle className="w-6 h-6 text-[#00A9E7]" />
                        <span>Pertanyaan Umum seputar Aktivasi</span>
                    </h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className={`p-6 rounded-2xl border ${cardBg}`}>
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <span className="text-[#00A9E7]">Q:</span> {faq.q}
                            </h3>
                            <p className={`mt-2 text-xs ${textMuted} leading-relaxed pl-5 border-l-2 border-[#00A9E7]/40`}>
                                {faq.a}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FINAL CALL TO ACTION */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className={`p-8 sm:p-12 lg:p-16 rounded-3xl bg-gradient-to-r from-[#0c1322] via-[#050914] to-[#000000] border border-[#2D90CA]/40 text-center relative overflow-hidden shadow-2xl`}>
                    
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#00A9E7]/15 blur-[100px] rounded-full pointer-events-none" />
                    
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                        Siap Mengakselerasi Bisnis Anda Bersama <span className="text-[#00A9E7]">Genial</span>?
                    </h2>
                    
                    <p className="mt-4 text-sm text-slate-300 max-w-2xl mx-auto">
                        Dapatkan audit digital gratis dan diskusi alur aktivasi khusus sesuai dengan niche bisnis Anda hari ini.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-xl shadow-[#00A9E7]/30 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <PhoneCall className="w-5 h-5" />
                            <span>Hubungi Tim Aktivasi via WhatsApp</span>
                        </a>

                        <a 
                            href="/#packages"
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-slate-200 border border-slate-700 bg-slate-900/60 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            <span>Lihat Paket Harga Kerjasama</span>
                        </a>
                    </div>

                </div>
            </section>

            {/* FOOTER */}
            <footer className={`py-12 border-t ${isDark ? 'bg-[#000000] border-slate-900' : 'bg-slate-100 border-slate-200'} text-xs text-slate-400 transition-colors`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Genial Logo" className="h-8 w-auto object-contain" />
                        <span>© {new Date().getFullYear()} Genial Digital Solution. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-6 font-semibold">
                        <a href="/" className="hover:text-[#00A9E7]">Beranda</a>
                        <a href="/activation" className="hover:text-[#00A9E7]">Cara Aktivasi</a>
                        <a href="/#packages" className="hover:text-[#00A9E7]">Paket Harga</a>
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#00A9E7]">Kontak WA</a>
                    </div>
                </div>
            </footer>

        </div>
    );
}
