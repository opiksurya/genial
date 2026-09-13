import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Heart, 
    GraduationCap, 
    Sparkles, 
    Compass, 
    Users, 
    TrendingUp, 
    Award, 
    Calendar, 
    CheckCircle2, 
    ArrowRight, 
    MessageSquare, 
    Sun, 
    Moon, 
    Menu, 
    X, 
    ShieldCheck, 
    Quote,
    MapPin,
    Target,
    Handshake,
    Lightbulb
} from 'lucide-react';
import { useGtm } from '@/hooks/use-gtm';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';

interface OurStoryProps {
    whatsappNumber?: string;
    whatsappDefaultMessage?: string;
}

export default function OurStoryPage({
    whatsappNumber = '6281234567890',
    whatsappDefaultMessage = 'Halo Genial Digital Solution, saya tertarik dengan cerita & filosofi Genial dan ingin berdiskusi lebih lanjut'
}: OurStoryProps) {
    const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                label: `Our Story Page - ${sourceLocation}`,
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

    const journeyMilestones = [
        {
            year: 'Awal Langkah',
            badge: 'Bandung & SMA TI Multimedia',
            icon: GraduationCap,
            title: 'Berawal dari Bangku Sekolah & Realita UMKM',
            description: 'Kisah Genial berakar dari Kota Bandung. Sejak duduk di bangku Sekolah Menengah Atas (SMA) jurusan TI & Multimedia, Founder dan Co-founder Genial telah akrab dengan dunia teknologi digital visual. Namun yang paling membekas adalah realita hidup sehari-hari sebagai anak dari pelaku UMKM — melihat langsung perjuangan, kelelahan, dan ketidakpastian yang dihadapi orang tua dalam menjalankan usaha.'
        },
        {
            year: 'Awal Gerakan',
            badge: 'Niat Tulus & Empati Keluarga',
            icon: Heart,
            title: 'Tergerak Membantu Orang Tua & Pelaku Usaha',
            description: 'Berawal dari keinginan yang sangat tulus: bagaimana memanfaatkan keahlian teknologi dan multimedia untuk memajukan usaha orang tua agar lebih ringan dan berkembang. Niat sederhana ini bertransformasi menjadi empati yang besar untuk membantu lebih banyak pelaku UMKM Indonesia yang mengalami tantangan serupa dalam mengembangkan bisnis mereka.'
        },
        {
            year: 'Sejak 2012',
            badge: 'Belajar dari Kasus & Solusi Nyata',
            icon: Calendar,
            title: 'Ditempa Pengalaman Lebih dari 1 Dekade',
            description: 'Sejak tahun 2012, kami belajar langsung dari lapangan — menghadapi berbagai dinamika industri, pergantian algoritma iklan, tantangan konversi, hingga manajemen operasional. Setiap kasus dan kegagalan dijadikan pelajaran berharga untuk merumuskan metode, skema funnel, dan ekosistem penunjang terbaik yang telah teruji secara ilmiah dan empiris.'
        },
        {
            year: 'Nilai Sosial',
            badge: 'Sinergi & Ikhtiar Bersama',
            icon: Users,
            title: 'Pentingnya Kolaborasi & Hubungan Sosial',
            description: 'Kami menyadari bahwa bisnis tidak berdiri sendiri di atas angka. Keberhasilan sejati lahir dari kolaborasi yang kuat dan hubungan sosial yang harmonis di tengah masyarakat. Perniagaan adalah salah satu ikhtiar terbaik untuk saling menguatkan, menciptakan lapangan kerja, dan membawa keberkahan bersama.'
        },
        {
            year: 'Filosofi Utuh',
            badge: 'Teman Seperjalanan (Growth Partner)',
            icon: Compass,
            title: 'Bukan Sekadar Pekerjaan, Tapi Teman Seperjalanan',
            description: 'Inilah filosofi tertinggi di Genial Digital Solution. Kami tidak pernah memandang Anda sekadar sebagai "klien" atau nomor kontrak pekerjaan. Kami memosisikan diri sebagai Teman Seperjalanan — mitra yang siap berjalan di samping Anda, saling bahu-membahu dalam suka dan duka, hingga mencapai titik sukses yang dicita-citakan bersama.'
        }
    ];

    const coreValues = [
        {
            icon: Heart,
            title: 'Empathetic Understanding',
            desc: 'Kami memahami rasa lelah dan perjuangan Anda karena kami tumbuh dari keluarga pelaku usaha.'
        },
        {
            icon: Lightbulb,
            title: 'Real-world Experience Since 2012',
            desc: 'Metode yang kami gunakan bukan sekadar teori buku, melainkan hasil tempaan pengalaman nyata lebih dari 10 tahun.'
        },
        {
            icon: Handshake,
            title: 'True Partnership Culture',
            desc: 'Kami hadir sebagai teman diskusi yang terbuka, transparan, dan berjuang bersama untuk tujuan yang sama.'
        },
        {
            icon: Target,
            title: 'Impact-Driven Execution',
            desc: 'Fokus kami adalah pertumbuhan omset dan kesehatan operasional bisnis Anda secara berkelanjutan.'
        }
    ];

    return (
        <div className={`min-h-screen font-sans ${bgClass} transition-colors duration-300 selection:bg-[#00A9E7] selection:text-white`}>
            <Head>
                <title>Cerita & Filosofi Kelahiran - Genial Digital Solution</title>
                <meta name="description" content="Pelajari kisah dibalik lahirnya Genial Digital Solution: Berawal dari anak pelaku UMKM di Bandung, ditempa pengalaman sejak 2012, hingga menjadi Teman Seperjalanan pertumbuhan bisnis Anda." />
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
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-[#2D90CA]/20 via-[#00A9E7]/25 to-[#FAD03D]/20 blur-[130px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00A9E7]/40 bg-[#00A9E7]/10 backdrop-blur-md text-xs font-semibold text-[#00A9E7] mb-6">
                        <Heart className="w-4 h-4 text-[#FAD03D] fill-[#FAD03D]" />
                        <span>Kisah & Filosofi Dibaik Lahirnya Genial</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto mb-6">
                        Lahir dari Empati Nyata, <br />
                        Tumbuh Sebagai <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#FAD03D]">Teman Seperjalanan UMKM</span>
                    </h1>

                    <p className={`text-base sm:text-lg lg:text-xl max-w-3xl mx-auto ${textMuted} mb-10 leading-relaxed`}>
                        Genial Digital Solution tidak dibangun di dalam ruang rapat yang dingin. Kami lahir dari realita keluarga pelaku UMKM di Bandung, ditempa pengalaman nyata sejak 2012, dan didorong niat tulus untuk berjalan bersama memajukan usaha Indonesia.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <a 
                            href="#story-timeline" 
                            className="px-8 py-4 rounded-xl text-sm font-bold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-lg shadow-[#00A9E7]/30 hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            <span>Baca Perjalanan Kami</span>
                            <ArrowRight className="w-4 h-4 text-slate-900" />
                        </a>
                        <a 
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleWaClick('Hero WhatsApp')}
                            className={`px-8 py-4 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2 ${isDark ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200' : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'}`}
                        >
                            <MessageSquare className="w-4 h-4 text-emerald-500" />
                            <span>Diskusi Santai via WA</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* MANIFESTO / FOUNDER QUOTE CARD */}
            <section className="py-8 relative">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`p-8 sm:p-12 rounded-3xl border ${cardInnerBg} relative overflow-hidden text-center`}>
                        <Quote className="w-12 h-12 text-[#00A9E7]/30 mx-auto mb-4" />
                        <blockquote className={`text-lg sm:text-2xl font-semibold italic ${textPrimary} leading-relaxed mb-6`}>
                            &ldquo;Bagi kami, pertumbuhan bisnis tidak boleh berhenti sekadar sebagai transaksi angka. Kami percaya bahwa perniagaan adalah ikhtiar luhur, dan setiap klien yang datang adalah teman seperjalanan untuk tumbuh dan berhasil bersama.&rdquo;
                        </blockquote>
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#2D90CA] to-[#00A9E7] flex items-center justify-center text-white font-bold text-sm">
                                G
                            </div>
                            <div className="text-left">
                                <div className={`text-sm font-bold ${textPrimary}`}>Founder & Co-founder</div>
                                <div className="text-xs text-[#00A9E7]">Genial Digital Solution</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TIMELINE / THE 5 MILESTONES */}
            <section id="story-timeline" className="py-16 relative">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#00A9E7] mb-2 block">Rekam Perjalanan & Akar Pemikiran</span>
                        <h2 className={`text-3xl sm:text-4xl font-extrabold ${textPrimary}`}>Mengapa Genial Lahir?</h2>
                    </div>

                    <div className="relative border-l-2 border-[#00A9E7]/30 ml-4 sm:ml-32 space-y-12 pl-6 sm:pl-10">
                        {journeyMilestones.map((item, index) => {
                            const IconComp = item.icon;
                            return (
                                <div key={index} className="relative group">
                                    {/* Timeline Marker Dot */}
                                    <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-8 h-8 rounded-full bg-gradient-to-br from-[#2D90CA] to-[#00A9E7] border-4 border-[#000000] flex items-center justify-center text-white shadow-md shadow-[#00A9E7]/40 group-hover:scale-110 transition-transform">
                                        <IconComp className="w-4 h-4" />
                                    </div>

                                    {/* Year Label for Desktop */}
                                    <div className="hidden sm:block absolute -left-36 top-2 text-right w-24">
                                        <span className="text-xs font-extrabold text-[#00A9E7] uppercase tracking-wider">{item.year}</span>
                                    </div>

                                    {/* Content Card */}
                                    <div className={`p-6 sm:p-8 rounded-2xl border ${cardBg} hover:border-[#00A9E7]/60 transition-all duration-300`}>
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span className="sm:hidden text-xs font-extrabold text-[#00A9E7] uppercase tracking-wider mr-2">{item.year}</span>
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00A9E7]/15 text-[#00A9E7] border border-[#00A9E7]/30">
                                                {item.badge}
                                            </span>
                                        </div>

                                        <h3 className={`text-xl font-bold ${textPrimary} mb-3`}>{item.title}</h3>
                                        <p className={`${textMuted} text-sm leading-relaxed`}>{item.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CORE VALUES GRID */}
            <section className="py-16 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#FAD03D] mb-2 block">Prinsip & Nilai Dasar</span>
                        <h2 className={`text-3xl sm:text-4xl font-extrabold ${textPrimary}`}>Empat Pilar Komitmen Kami</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {coreValues.map((val, idx) => {
                            const IconComp = val.icon;
                            return (
                                <div key={idx} className={`p-6 rounded-2xl border ${cardBg} hover:border-[#FAD03D]/60 transition-all duration-300`}>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00A9E7]/20 to-[#FAD03D]/20 border border-[#FAD03D]/40 flex items-center justify-center text-[#FAD03D] mb-4">
                                        <IconComp className="w-6 h-6" />
                                    </div>
                                    <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>{val.title}</h3>
                                    <p className={`text-xs ${textMuted} leading-relaxed`}>{val.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#2D90CA]/25 via-[#00A9E7]/30 to-[#FAD03D]/20 blur-[130px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
                        Mari Menjadi <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#FAD03D]">Teman Seperjalanan</span> Kami
                    </h2>

                    <p className={`text-base sm:text-lg max-w-2xl mx-auto ${textMuted} mb-10`}>
                        Setiap usaha memiliki cerita perjuangannya sendiri. Kami hadir di sini untuk mendengarkan, mendampingi, dan mengakselerasi pertumbuhan bisnis Anda.
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
                            <span>Mulai Diskusi & Silaturahmi via WhatsApp</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <PublicFooter themeMode={themeMode} />
        </div>
    );
}
