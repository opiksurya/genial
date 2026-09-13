import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { 
    TrendingUp, 
    ArrowUpRight, 
    Calendar, 
    User, 
    Tag, 
    CheckCircle2, 
    ArrowRight, 
    MessageSquare, 
    Sun, 
    Moon, 
    Menu, 
    X, 
    Zap,
    BarChart3,
    Sparkles,
    ShieldCheck,
    ArrowLeft,
    Clock,
    FileText
} from 'lucide-react';
import { useGtm } from '@/hooks/use-gtm';

interface ProjectData {
    id: number;
    name: string;
    client: string;
    client_logo?: string;
    slug?: string;
    category?: string;
    status?: string;
    description?: string;
    article_title?: string;
    article_subtitle?: string;
    article_content?: string;
    initial_revenue?: string;
    current_revenue?: string;
    initial_roas?: string;
    current_roas?: string;
    growth_percentage?: string;
    collaboration_story?: string;
    key_results?: string;
}

interface CaseStudyProps {
    project: ProjectData;
    whatsappNumber?: string;
    whatsappDefaultMessage?: string;
}

export default function CaseStudyPage({
    project,
    whatsappNumber = '6281234567890',
    whatsappDefaultMessage = 'Halo Genial Digital Solution, saya ingin konsultasi mengenai studi kasus ' + (project?.client || 'brand')
}: CaseStudyProps) {
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
                label: `Case Study Page (${project?.client}) - ${sourceLocation}`,
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

    const keyResultsList = project.key_results 
        ? project.key_results.split('\n').filter(item => item.trim() !== '')
        : [];

    return (
        <div className={`min-h-screen font-sans ${bgClass} transition-colors duration-300 selection:bg-[#00A9E7] selection:text-white`}>
            <Head>
                <title>{project.article_title || `Studi Kasus Transformaasi ${project.client}`} - Genial Digital Solution</title>
                <meta name="description" content={project.article_subtitle || `Pelajari kisah sukses dan data perubahan omset ${project.client} setelah berkolaborasi dengan Genial Digital Solution.`} />
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
                        <a href="/our-story" className={navText}>Cerita & Filosofi</a>
                        <a href="/how-we-work" className={navText}>Metode & Funnel</a>
                        <a href="/activation" className={navText}>Cara Aktivasi</a>
                        <a href="/support" className={navText}>Penunjang Bisnis & ERP</a>
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
                            onClick={() => handleWaClick('Header Icon')}
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
                            onClick={() => handleWaClick('Header Button')}
                            className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-md shadow-[#00A9E7]/25 hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <span>Konsultasi Strategi</span>
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
                        <a href="/our-story" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navText}`}>Cerita & Filosofi</a>
                        <a href="/how-we-work" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navText}`}>Metode & Funnel Strategy</a>
                        <a href="/activation" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navText}`}>Cara Aktivasi & Onboarding</a>
                        <a href="/support" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navText}`}>Penunjang Bisnis & ERP</a>
                        <div className="pt-2">
                            <a 
                                href={waUrl} 
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                    handleWaClick('Mobile Menu');
                                    setMobileMenuOpen(false);
                                }}
                                className="w-full text-center block py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] shadow-md"
                            >
                                Hubungi Genial via WhatsApp
                            </a>
                        </div>
                    </div>
                )}
            </header>

            {/* BREADCRUMB & BACK BUTTON */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <a 
                    href="/" 
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#00A9E7] hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Beranda</span>
                </a>
            </div>

            {/* CASE STUDY HERO HEADER */}
            <section className="pt-6 pb-12 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 border-b border-slate-800/80 pb-8">
                        <div className="space-y-4 max-w-3xl">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00A9E7]/15 text-[#00A9E7] border border-[#00A9E7]/30">
                                    Studi Kasus Portfolio
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                                    {project.category || 'Digital Marketing'}
                                </span>
                                {project.growth_percentage && (
                                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span>Growth {project.growth_percentage}</span>
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                                {project.article_title || `Studi Kasus: Akselerasi Bisnis ${project.client}`}
                            </h1>

                            {project.article_subtitle && (
                                <p className={`text-base sm:text-lg ${textMuted} leading-relaxed`}>
                                    {project.article_subtitle}
                                </p>
                            )}
                        </div>

                        {/* Client Brand Logo Card */}
                        <div className={`p-6 rounded-2xl border ${cardBg} flex items-center justify-center min-w-[200px] shrink-0`}>
                            {project.client_logo ? (
                                <img 
                                    src={project.client_logo} 
                                    alt={project.client} 
                                    className="max-h-16 w-auto object-contain" 
                                />
                            ) : (
                                <div className="text-xl font-bold text-[#00A9E7]">{project.client}</div>
                            )}
                        </div>
                    </div>

                    {/* BEFORE VS AFTER DATA COMPARISON CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        
                        {/* Initial Revenue */}
                        <div className={`p-6 rounded-2xl border ${cardBg} relative overflow-hidden`}>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Angka Omset Awal</span>
                            <div className="text-2xl font-bold text-slate-400">{project.initial_revenue || 'Stok / Data Awal'}</div>
                            <div className="mt-2 text-xs text-slate-500">Sebelum Ditangani Genial</div>
                        </div>

                        {/* Current Revenue */}
                        <div className={`p-6 rounded-2xl border border-emerald-500/40 ${isDark ? 'bg-emerald-950/20' : 'bg-emerald-50'} relative overflow-hidden`}>
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">Omset Sekarang (Post-Genial)</span>
                            <div className="text-2xl font-extrabold text-emerald-400">{project.current_revenue || 'Penjualan Stabil'}</div>
                            <div className="mt-2 text-xs text-emerald-500 font-semibold flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>Peningkatan Signifikan</span>
                            </div>
                        </div>

                        {/* Initial ROAS */}
                        <div className={`p-6 rounded-2xl border ${cardBg} relative overflow-hidden`}>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">ROAS / Performa Awal</span>
                            <div className="text-2xl font-bold text-slate-400">{project.initial_roas || 'Standard'}</div>
                            <div className="mt-2 text-xs text-slate-500">Efisiensi Iklan Awal</div>
                        </div>

                        {/* Current ROAS */}
                        <div className={`p-6 rounded-2xl border border-[#00A9E7]/40 ${isDark ? 'bg-[#00A9E7]/10' : 'bg-sky-50'} relative overflow-hidden`}>
                            <span className="text-xs font-bold text-[#00A9E7] uppercase tracking-wider block mb-1">ROAS Iklan Sekarang</span>
                            <div className="text-2xl font-extrabold text-[#00A9E7]">{project.current_roas || 'High CVR'}</div>
                            <div className="mt-2 text-xs text-[#00A9E7] font-semibold flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-[#FAD03D]" />
                                <span>Return On Ad Spend Optimal</span>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ARTICLE CONTENT SECTION */}
            <section className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    
                    {/* COLLABORATION JOURNEY / AWAL BERTEMU GENIAL */}
                    {project.collaboration_story && (
                        <div className={`p-8 rounded-3xl border ${cardInnerBg} space-y-4`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#00A9E7]/20 border border-[#00A9E7]/40 flex items-center justify-center text-[#00A9E7]">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <h3 className={`text-xl font-extrabold ${textPrimary}`}>Perjalanan Awal Bertemu Genial</h3>
                            </div>
                            <p className={`${textMuted} text-base leading-relaxed whitespace-pre-line`}>
                                {project.collaboration_story}
                            </p>
                        </div>
                    )}

                    {/* MAIN ARTICLE BODY */}
                    {project.article_content && (
                        <div className="space-y-6">
                            <h3 className={`text-2xl font-extrabold ${textPrimary} border-b border-slate-800 pb-3`}>
                                Narasi & Eksekusi Strategi
                            </h3>
                            <div className={`prose ${isDark ? 'prose-invert' : ''} max-w-none text-base ${textMuted} leading-relaxed whitespace-pre-line`}>
                                {project.article_content}
                            </div>
                        </div>
                    )}

                    {/* KEY RESULTS SUMMARY LIST */}
                    {keyResultsList.length > 0 && (
                        <div className={`p-8 rounded-3xl border ${cardBg} space-y-6`}>
                            <h3 className={`text-xl font-bold ${textPrimary} flex items-center gap-2`}>
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                <span>Poin Perubahan Utama yang Dicapai:</span>
                            </h3>

                            <ul className="space-y-3">
                                {keyResultsList.map((result, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm font-medium">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                            ✓
                                        </div>
                                        <span className={textPrimary}>{result.replace(/^-\s*/, '')}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#2D90CA]/25 via-[#00A9E7]/30 to-[#FAD03D]/20 blur-[130px] rounded-full pointer-events-none -z-10" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
                        Ingin Mencapai Pertumbuhan Bisnis Seperti <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#FAD03D]">{project.client}?</span>
                    </h2>

                    <p className={`text-base sm:text-lg max-w-2xl mx-auto ${textMuted} mb-10`}>
                        Konsultasikan strategi digital marketing dan sistem operasional bisnis Anda bersama tim Genial Digital Solution.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={() => handleWaClick('Case Study Bottom CTA')}
                            className="w-full sm:w-auto px-9 py-4 rounded-xl text-base font-extrabold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-xl shadow-[#00A9E7]/35 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <MessageSquare className="w-5 h-5 text-slate-900 fill-slate-900/20" />
                            <span>Konsultasikan Brand Anda via WA</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className={`border-t ${isDark ? 'border-slate-800/80 bg-[#000000]' : 'border-slate-200 bg-white'} py-12`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Genial Logo" className="h-8 w-auto object-contain" />
                        <span className={`text-sm ${textMuted}`}>&copy; {new Date().getFullYear()} Genial Digital Solution. All rights reserved.</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
                        <a href="/" className={navText}>Beranda</a>
                        <a href="/our-story" className={navText}>Cerita & Filosofi</a>
                        <a href="/how-we-work" className={navText}>Metode & Funnel</a>
                        <a href="/activation" className={navText}>Cara Aktivasi</a>
                        <a href="/support" className={navText}>Penunjang Bisnis & ERP</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
