import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import { 
    TrendingUp, 
    Zap, 
    Target, 
    BarChart3, 
    CheckCircle2, 
    ArrowRight, 
    Sparkles, 
    ShieldCheck, 
    MessageSquare, 
    Phone, 
    Activity, 
    Users, 
    Award, 
    Check, 
    X, 
    ShoppingBag, 
    Video, 
    Share2, 
    Search,
    Menu,
    ChevronRight,
    Star,
    ExternalLink
} from 'lucide-react';

interface PageProps {
    flash?: {
        success?: string;
        whatsapp_url?: string;
    };
    [key: string]: any;
}

export default function Welcome() {
    const { flash } = usePage<PageProps>().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'shopee' | 'tiktok' | 'meta' | 'google'>('shopee');
    const [activeBeforeAfter, setActiveBeforeAfter] = useState<'roas' | 'sales' | 'cpc'>('roas');

    // Audit Form Inertia state
    const { data, setData, post, processing, errors, reset, errors: formErrors } = useForm({
        name: '',
        whatsapp: '',
        website_marketplace: '',
        business_type: '',
        target_sales: '',
    });

    const [formSubmitted, setFormSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/audit-request', {
            onSuccess: () => {
                setFormSubmitted(true);
                reset();
            },
        });
    };

    // Campaign Mockup Data for Hero/Solution Section
    const campaignMetrics = {
        shopee: {
            title: 'Shopee Ads Performance',
            roas: '8.4x',
            sales: 'Rp 142.500.000',
            cpr: 'Rp 1.200',
            growth: '+340%',
            color: 'from-orange-500 to-amber-500',
            icon: ShoppingBag
        },
        tiktok: {
            title: 'TikTok Viral Ads Performance',
            roas: '7.2x',
            sales: 'Rp 189.000.000',
            cpr: 'Rp 850',
            growth: '+420%',
            color: 'from-pink-500 to-rose-600',
            icon: Video
        },
        meta: {
            title: 'Meta Ads Conversion Funnel',
            roas: '6.9x',
            sales: 'Rp 215.800.000',
            cpr: 'Rp 3.400',
            growth: '+280%',
            color: 'from-blue-600 to-cyan-500',
            icon: Share2
        },
        google: {
            title: 'Google Search & PMax Ads',
            roas: '9.1x',
            sales: 'Rp 310.000.000',
            cpr: 'Rp 4.100',
            growth: '+390%',
            color: 'from-emerald-500 to-teal-600',
            icon: Search
        }
    };

    // Schema.org JSON-LD for Agency SEO
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "Genial Digital Solution",
        "image": "https://genialdigitalsolution.com/logo.png",
        "url": "https://genialdigitalsolution.com",
        "telephone": "+6281234567890",
        "priceRange": "$$",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "ID"
        },
        "description": "Digital Marketing Agency Indonesia berpengalaman dalam Shopee Ads, TikTok Ads, Meta Ads, dan Google Ads berbasis data & ROI tinggi.",
        "sameAs": [
            "https://instagram.com/genialdigitalsolution",
            "https://tiktok.com/@genialdigital"
        ]
    };

    return (
        <>
            <Head>
                <title>Genial Digital Solution | Digital Marketing Agency High Conversion & ROI</title>
                <meta name="description" content="Naikkan penjualan online bisnis Anda melalui kombinasi strategi SEO, Google Ads, Meta Ads, TikTok Ads, dan Shopee Ads berbasis data dari Genial Digital Solution." />
                <script type="application/ld+json">
                    {JSON.stringify(schemaData)}
                </script>
            </Head>

            <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans selection:bg-blue-500 selection:text-white relative overflow-hidden">
                
                {/* Background Ambient Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-indigo-500/10 to-emerald-500/20 blur-[130px] rounded-full pointer-events-none -z-10" />
                <div className="absolute top-[35%] right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />
                <div className="absolute top-[70%] left-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />

                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

                {/* NAVIGATION HEADER */}
                <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070b14]/80 border-b border-slate-800/80 transition-all">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                        
                        {/* Logo */}
                        <a href="#" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 p-[2px] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-blue-400" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1">
                                    Genial <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-extrabold">Digital</span>
                                </span>
                                <span className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">Solution</span>
                            </div>
                        </a>

                        {/* Desktop Nav Items */}
                        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                            <a href="#services" className="hover:text-blue-400 transition-colors">Layanan</a>
                            <a href="#audit" className="hover:text-blue-400 transition-colors">Gratis Audit</a>
                            <a href="#why-us" className="hover:text-blue-400 transition-colors">Keunggulan</a>
                            <a href="#results" className="hover:text-blue-400 transition-colors">Case Study</a>
                            <a href="#packages" className="hover:text-blue-400 transition-colors">Paket Harga</a>
                            <a href="#testimonials" className="hover:text-blue-400 transition-colors">Testimoni</a>
                        </nav>

                        {/* Action Buttons */}
                        <div className="hidden md:flex items-center gap-4">
                            <a 
                                href="https://wa.me/6281234567890?text=Halo%20Genial%20Digital%20Solution,%20saya%20ingin%20konsultasi%20strategi%20marketing" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-200 border border-slate-700 bg-slate-900/60 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                            >
                                <Phone className="w-4 h-4 text-emerald-400" />
                                <span>WA Konsultasi</span>
                            </a>
                            <a 
                                href="#audit" 
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 hover:opacity-95 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
                            >
                                <span>Klaim Audit Gratis</span>
                                <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Mobile Menu dropdown */}
                    {mobileMenuOpen && (
                        <div className="md:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
                            <a href="#services" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-blue-400">Layanan</a>
                            <a href="#audit" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-blue-400">Gratis Audit</a>
                            <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-blue-400">Keunggulan</a>
                            <a href="#results" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-blue-400">Case Study</a>
                            <a href="#packages" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-blue-400">Paket Harga</a>
                            <div className="pt-2 flex flex-col gap-2">
                                <a 
                                    href="#audit" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-500 shadow-md"
                                >
                                    Klaim Audit Gratis
                                </a>
                            </div>
                        </div>
                    )}
                </header>


                {/* SECTION 1: HERO SECTION */}
                <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                        
                        {/* Hero Text */}
                        <div className="lg:col-span-7 space-y-8 text-left">
                            
                            {/* Top Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs sm:text-sm font-medium">
                                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                                <span>Premier Digital Growth & Performance Marketing Agency</span>
                            </div>

                            {/* Main Headline */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
                                Naikkan Penjualan Online dengan Strategi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">Digital Marketing Terukur</span>
                            </h1>

                            {/* Subheadline */}
                            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
                                Kami membantu bisnis berkembang melalui kombinasi strategi <strong>SEO, Google Ads, Meta Ads, TikTok Ads,</strong> dan <strong>Shopee Ads</strong> berbasis data untuk menghasilkan traffic, leads, dan penjualan nyata.
                            </p>

                            {/* CTA Group */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                                <a 
                                    href="#audit"
                                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
                                >
                                    <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
                                    <span>Gratis Audit Digital Bisnis Anda</span>
                                </a>
                                <a 
                                    href="https://wa.me/6281234567890?text=Halo%20Genial%20Digital%20Solution,%20saya%20ingin%20konsultasi%20strategi%20pemasaran%20digital"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold text-slate-200 border border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:text-white transition-all"
                                >
                                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                                    <span>Konsultasi Strategi Sekarang</span>
                                </a>
                            </div>

                            {/* Social Proof Stats */}
                            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
                                <div>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-white">500+</div>
                                    <div className="text-xs text-slate-400 mt-1">Campaign Dikelola</div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">8.4x</div>
                                    <div className="text-xs text-slate-400 mt-1">Rata-rata ROAS</div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">Rp 25B+</div>
                                    <div className="text-xs text-slate-400 mt-1">Revenue Client</div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">98.5%</div>
                                    <div className="text-xs text-slate-400 mt-1">Kepuasan Klien</div>
                                </div>
                            </div>

                        </div>

                        {/* Hero Visual Mockup */}
                        <div className="lg:col-span-5 relative">
                            <div className="relative rounded-2xl p-6 bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
                                
                                {/* Header Bar */}
                                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                                        <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                                        <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                                        <span className="ml-2 text-xs font-mono text-slate-400">campaign-analytics.live</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                        Live ROI Tracking
                                    </span>
                                </div>

                                {/* Platform Selector */}
                                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl mb-6 border border-slate-800/60">
                                    {(['shopee', 'tiktok', 'meta', 'google'] as const).map((key) => {
                                        const ItemIcon = campaignMetrics[key].icon;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setActiveTab(key)}
                                                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                                                    activeTab === key
                                                        ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                                                        : 'text-slate-400 hover:text-slate-200'
                                                }`}
                                            >
                                                <ItemIcon className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">{key}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Active Metrics Display */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                                {campaignMetrics[activeTab].title}
                                            </h4>
                                            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                                                {campaignMetrics[activeTab].sales}
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                            {campaignMetrics[activeTab].growth}
                                        </span>
                                    </div>

                                    {/* Simulated Performance Bars */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                                            <div className="text-[11px] text-slate-400">Target ROAS</div>
                                            <div className="text-xl font-bold text-amber-400 mt-0.5">
                                                {campaignMetrics[activeTab].roas}
                                            </div>
                                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                                <div className="bg-amber-400 h-full w-[85%]" />
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                                            <div className="text-[11px] text-slate-400">Cost Per Lead</div>
                                            <div className="text-xl font-bold text-emerald-400 mt-0.5">
                                                {campaignMetrics[activeTab].cpr}
                                            </div>
                                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                                <div className="bg-emerald-400 h-full w-[70%]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mockup Graph Bars */}
                                    <div className="pt-4 border-t border-slate-800/80">
                                        <div className="text-[11px] text-slate-400 mb-3 flex items-center justify-between">
                                            <span>Tren Penjualan Bulanan</span>
                                            <span className="text-blue-400 font-semibold">High Conversion Funnel</span>
                                        </div>
                                        <div className="h-28 flex items-end justify-between gap-2 px-1">
                                            {[35, 48, 42, 65, 78, 92, 110].map((val, idx) => (
                                                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                                                    <div 
                                                        className={`w-full rounded-t-md transition-all duration-500 bg-gradient-to-t ${campaignMetrics[activeTab].color} group-hover:brightness-125`}
                                                        style={{ height: `${val}%` }}
                                                    />
                                                    <span className="text-[9px] text-slate-400 font-mono">B{idx + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Badge */}
                                <div className="absolute -bottom-6 -left-6 bg-slate-900 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl flex items-center gap-3 hidden sm:flex">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-400">Konversi Rata-rata</div>
                                        <div className="text-sm font-bold text-white">+312% Conversion Rate</div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </section>


                {/* SECTION 2: FREE DIGITAL AUDIT OFFER */}
                <section id="audit" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
                    <div className="rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 border border-blue-500/30 p-8 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
                        
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

                        <div className="grid lg:grid-cols-12 gap-12 items-center">
                            
                            {/* Left Text Offer */}
                            <div className="lg:col-span-6 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                    <GiftIcon className="w-4 h-4" />
                                    <span>Penawaran Terbatas Bulan Ini</span>
                                </div>

                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                                    Gratis Audit Digital <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-300">
                                        Senilai Rp1.500.000
                                    </span>
                                </h2>

                                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                                    Dapatkan analisis mendalam dari tim pakar digital marketing kami. Kami akan membongkar celah kebocoran budget iklan dan memberikan blueprint pertumbuhan bisnis Anda.
                                </p>

                                {/* Checklist Items */}
                                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                                    {[
                                        'Performa website & kecepatan',
                                        'SEO visibility & kata kunci',
                                        'Analisis strategi kompetitor',
                                        'Potensi iklan digital (Ads)',
                                        'Audit strategi konten',
                                        'Peluang meningkatkan conversion'
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2.5 text-sm text-slate-200 font-medium">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 flex items-center gap-3">
                                    <ShieldCheck className="w-8 h-8 text-blue-400 shrink-0" />
                                    <span>Laporan audit dikirim secara rahasia langsung ke WhatsApp Anda tanpa dipungut biaya sedikitpun.</span>
                                </div>
                            </div>

                            {/* Right Interactive Form */}
                            <div className="lg:col-span-6">
                                <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl">
                                    
                                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-amber-400" />
                                        <span>Isi Form Audit Gratis</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mb-6">
                                        Lengkapi data singkat berikut untuk klaim slot audit bisnis Anda.
                                    </p>

                                    {formSubmitted ? (
                                        <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-lg font-bold text-white">Permintaan Audit Berhasil Dikirim!</h4>
                                            <p className="text-xs text-slate-300">
                                                Terima kasih. Tim konsultan Genial Digital Solution akan segera menghubungi Anda.
                                            </p>
                                            {flash?.whatsapp_url && (
                                                <a 
                                                    href={flash.whatsapp_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    <span>Lanjut Chat di WhatsApp</span>
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                                    Nama Lengkap <span className="text-rose-400">*</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="Contoh: Budi Santoso"
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                                                />
                                                {formErrors.name && <p className="text-xs text-rose-400 mt-1">{formErrors.name}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                                    Nomor WhatsApp <span className="text-rose-400">*</span>
                                                </label>
                                                <input 
                                                    type="tel" 
                                                    required
                                                    value={data.whatsapp}
                                                    onChange={(e) => setData('whatsapp', e.target.value)}
                                                    placeholder="Contoh: 081234567890"
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                                                />
                                                {formErrors.whatsapp && <p className="text-xs text-rose-400 mt-1">{formErrors.whatsapp}</p>}
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                                        Website / Marketplace <span className="text-rose-400">*</span>
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={data.website_marketplace}
                                                        onChange={(e) => setData('website_marketplace', e.target.value)}
                                                        placeholder="Shopee / Website URL"
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                                        Jenis Bisnis <span className="text-rose-400">*</span>
                                                    </label>
                                                    <select 
                                                        required
                                                        value={data.business_type}
                                                        onChange={(e) => setData('business_type', e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                                    >
                                                        <option value="">Pilih Jenis Bisnis</option>
                                                        <option value="UMKM / Brand Lokal">UMKM / Brand Lokal</option>
                                                        <option value="Shopee / Tokopedia Seller">Shopee / Tokopedia Seller</option>
                                                        <option value="TikTok Shop Seller">TikTok Shop Seller</option>
                                                        <option value="Perusahaan / B2B">Perusahaan / B2B</option>
                                                        <option value="Lainnya">Lainnya</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                                    Target Penjualan Per Bulan <span className="text-rose-400">*</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={data.target_sales}
                                                    onChange={(e) => setData('target_sales', e.target.value)}
                                                    placeholder="Contoh: Rp 50 Juta - Rp 100 Juta"
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                                                />
                                            </div>

                                            <button 
                                                type="submit"
                                                disabled={processing}
                                                className="w-full py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 hover:opacity-95 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 mt-2"
                                            >
                                                {processing ? 'Memproses Audit...' : 'Dapatkan Audit Gratis Sekarang'}
                                            </button>
                                        </form>
                                    )}

                                </div>
                            </div>

                        </div>
                    </div>
                </section>


                {/* SECTION 3: MASALAH CLIENT (PAIN POINTS) */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
                            <span>Pain Points Pebisnis</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Kenapa Banyak Bisnis Sudah Beriklan Tapi <span className="text-rose-400">Tidak Mendapatkan Hasil?</span>
                        </h2>
                        <p className="text-slate-400 text-base">
                            Bakar uang di iklan tanpa hasil nyata adalah masalah klasik banyak pemilik bisnis. Apakah Anda mengalami salah satu kendala berikut?
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Budget Iklan Habis Tanpa Penjualan',
                                desc: 'Uang terus mengalir untuk Facebook/Google Ads, tetapi konversi dan transaksi penjualan tetap minim.',
                                icon: X
                            },
                            {
                                title: 'Target Audience Tidak Tepat',
                                desc: 'Iklan ditayangkan ke penonton yang salah, tidak tertarik, atau tidak memiliki daya beli untuk produk Anda.',
                                icon: X
                            },
                            {
                                title: 'Tidak Tahu Iklan Mana Yang Profit',
                                desc: 'Tanpa tracking data conversion yang tepat, Anda kesulitan membedakan campaign yang menghasilkan untung vs rugi.',
                                icon: X
                            },
                            {
                                title: 'Konten Tidak Menarik Pelanggan',
                                desc: 'Materiiklan visual dan copy terasa biasa saja sehingga mudah dilewati pengguna sosial media.',
                                icon: X
                            },
                            {
                                title: 'Tanpa Strategi Funnel Marketing',
                                desc: 'Hanya langsung suruh beli tanpa mengedukasi calon pembeli melalui tahap awareness, interest, hingga decision.',
                                icon: X
                            },
                            {
                                title: 'Kalah Bersaing di Marketplace',
                                desc: 'Toko di Shopee/TikTok Shop sepi pengunjung karena tidak menggunakan strategi optimasi keyword dan bidding yang pas.',
                                icon: X
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 transition-all duration-300 group">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>


                {/* SECTION 4: SOLUTION SECTION */}
                <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            <span>Solusi Berbasis Data</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Solusi Digital Marketing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Berbasis Data & ROI</span>
                        </h2>
                        <p className="text-slate-400 text-base">
                            Kami menggabungkan data analitik mendalam dengan kreatifitas strategi ads untuk memenangkan pasar bisnis Anda.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        
                        {/* Service A: Shopee Ads */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-orange-500/50 transition-all group relative overflow-hidden">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-6">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                                <span>Shopee Ads Optimization</span>
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                "Maksimalkan performa toko Shopee Anda dengan strategi keyword, bidding, product optimization, dan analisis conversion untuk meningkatkan penjualan."
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                                {['Keyword Research', 'Campaign Setup', 'Product Ads Optimization', 'ROAS Monitoring'].map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-orange-400" />
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Service B: TikTok Ads */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-pink-500/50 transition-all group relative overflow-hidden">
                            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6">
                                <Video className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                                <span>TikTok Ads Management</span>
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                "Jangkau jutaan pengguna TikTok dengan strategi creative ads yang dirancang untuk meningkatkan awareness hingga conversion."
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                                {['Creative Strategy', 'Video Ads Optimization', 'Audience Targeting', 'Performance Tracking'].map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-pink-400" />
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Service C: Meta Ads */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition-all group relative overflow-hidden">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6">
                                <Share2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                                <span>Meta Ads Management (FB & IG)</span>
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                "Bangun kampanye Facebook dan Instagram Ads yang tepat sasaran dengan targeting berbasis perilaku dan data pelanggan."
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                                {['Campaign Strategy', 'Audience Research', 'Retargeting Funnel', 'Conversion Optimization'].map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Service D: Google Ads */}
                        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all group relative overflow-hidden">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6">
                                <Search className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                                <span>Google Ads & SEO</span>
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                "Dapatkan pelanggan yang sedang aktif mencari produk Anda melalui Google Search, Display, dan Performance Max Ads."
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                                {['Keyword Optimization', 'Search Campaign', 'Landing Page Optimization', 'Conversion Tracking'].map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </section>


                {/* SECTION 5: WHY CHOOSE US */}
                <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 p-8 sm:p-12">
                        <div className="grid lg:grid-cols-12 gap-12 items-center">
                            
                            <div className="lg:col-span-5 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                    <span>Mengapa Memilih Kami</span>
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                                    Mengapa Memilih <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                        Genial Digital Solution?
                                    </span>
                                </h2>
                                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                                    Kami tidak hanya menyajikan janji impressions atau clicks, tetapi berfokus pada hasil akhir yang nyata: <strong>Penjualan, Profitability, dan ROI</strong>.
                                </p>
                                <a 
                                    href="#audit" 
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg"
                                >
                                    <span>Mulai Kerjasama Bisnis</span>
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>

                            <div className="lg:col-span-7 space-y-4">
                                {[
                                    {
                                        title: 'Strategi Berdasarkan Data, Bukan Asumsi',
                                        desc: 'Setiap keputusan campaign didasarkan pada data riset pasar, perilaku audiens, dan histori performa real-time.'
                                    },
                                    {
                                        title: 'Fokus pada Profit dan ROI',
                                        desc: 'Kami mengoptimalkan return on ad spend (ROAS) dan menekan Cost Per Acquisition (CPA) agar bisnis Anda mendapatkan keuntungan maksimal.'
                                    },
                                    {
                                        title: 'Transparansi Laporan Campaign',
                                        desc: 'Akses dashboard laporan real-time yang transparan tanpa ada biaya tersembunyi.'
                                    },
                                    {
                                        title: 'Optimasi Berkelanjutan (A/B Testing)',
                                        desc: 'Kami terus melakukan evaluasi ad creative, copy, dan targeting setiap minggu untuk menjaga stabilitas performa.'
                                    },
                                    {
                                        title: 'Pendekatan Sesuai Kebutuhan Bisnis',
                                        desc: 'Strategi dirancang khusus sesuai dengan skala dan niche unik bisnis Anda, baik UMKM maupun brand besar.'
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 transition-all">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="w-5 h-5 font-bold" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-white">{item.title}</h4>
                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </section>


                {/* SECTION 6: CASE STUDY SECTION */}
                <section id="results" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                            <span>Bukti Performa</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Hasil yang Kami Kejar untuk <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Bisnis Anda</span>
                        </h2>
                        <p className="text-slate-400 text-base">
                            Perbandingan nyata hasil sebelum dan sesudah optimasi oleh tim Genial Digital Solution.
                        </p>
                    </div>

                    {/* Before vs After Comparison Card */}
                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        
                        {/* BEFORE CARD */}
                        <div className="p-8 rounded-3xl bg-slate-900/40 border border-rose-500/20 relative overflow-hidden">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold mb-6">
                                <span>SEBELUM (Tanpa Optimasized Strategy)</span>
                            </div>
                            <ul className="space-y-4 text-sm text-slate-300">
                                <li className="flex items-center gap-3">
                                    <X className="w-5 h-5 text-rose-400 shrink-0" />
                                    <span><strong>Traffic Rendah:</strong> Pengunjung toko/website sepi dan acak</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <X className="w-5 h-5 text-rose-400 shrink-0" />
                                    <span><strong>ROAS Rendah (1.2x - 1.8x):</strong> Budget iklan hampir tidak menutup modal</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <X className="w-5 h-5 text-rose-400 shrink-0" />
                                    <span><strong>Cost Per Conversion Mahal:</strong> Biaya per penjualan sangat menguras margin</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <X className="w-5 h-5 text-rose-400 shrink-0" />
                                    <span><strong>Conversion Small:</strong> Banyak click tapi tidak ada transaksi beli</span>
                                </li>
                            </ul>
                        </div>

                        {/* AFTER CARD */}
                        <div className="p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-xl shadow-emerald-500/5 relative overflow-hidden">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-6">
                                <span>SESUDAH (Dengan Genial Digital Solution)</span>
                            </div>
                            <ul className="space-y-4 text-sm text-slate-200">
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span><strong>Traffic Meningkat +450%:</strong> Target audience pembeli siap beli</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span><strong>ROAS Tinggi (6.5x - 9.2x):</strong> Keuntungan bersih berlipat ganda</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span><strong>Cost Per Conversion Turun -60%:</strong> Iklan menjadi sangat efisien</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <span><strong>Sales & Revenue Meledak:</strong> Penjualan tumbuh secara konsisten setiap bulan</span>
                                </li>
                            </ul>
                        </div>

                    </div>
                </section>


                {/* SECTION 7: PACKAGE SECTION */}
                <section id="packages" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            <span>Paket Layanan</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Pilih Paket <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Pertumbuhan Bisnis</span>
                        </h2>
                        <p className="text-slate-400 text-base">
                            Paket fleksibel sesuai tahap perkembangan bisnis Anda.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-stretch">
                        
                        {/* STARTER */}
                        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">STARTER</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Cocok untuk UMKM</h3>
                                <p className="text-xs text-slate-400 mb-6">Mulai bangun fondasi digital marketing bisnis Anda dengan strategi tepat.</p>
                                <ul className="space-y-3 text-xs text-slate-300 mb-8 border-t border-slate-800 pt-6">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Audit Digital Bisnis & Website</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Setup Campaign Ads (1 Platform)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Basic Optimization & Copywriting</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Laporan Performa Bulanan</span>
                                    </li>
                                </ul>
                            </div>
                            <a 
                                href="#audit" 
                                className="w-full text-center py-3 rounded-xl text-sm font-bold text-slate-200 border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all"
                            >
                                Pilih Paket Starter
                            </a>
                        </div>

                        {/* GROWTH (FEATURED) */}
                        <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-blue-950/80 border-2 border-blue-500 shadow-2xl shadow-blue-500/20 flex flex-col justify-between relative transform lg:-translate-y-2">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                                PALING POPULER
                            </div>
                            <div>
                                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">GROWTH</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Untuk Bisnis Berkembang</h3>
                                <p className="text-xs text-slate-300 mb-6">Skala penjualan bisnis Anda melalui multi-channel digital ads terpadu.</p>
                                <ul className="space-y-3 text-xs text-slate-200 mb-8 border-t border-slate-800/80 pt-6">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Shopee Ads & Marketplace Optimization</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>TikTok Ads & Creative Strategy</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Meta Ads (Facebook & Instagram)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Google Ads & Search Setup</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Content Strategy & Funneling</span>
                                    </li>
                                </ul>
                            </div>
                            <a 
                                href="#audit" 
                                className="w-full text-center py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-500 hover:opacity-95 transition-all shadow-lg"
                            >
                                Konsultasi Paket Growth
                            </a>
                        </div>

                        {/* SCALE */}
                        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">SCALE</div>
                                <h3 className="text-2xl font-bold text-white mb-2">Untuk Brand Besar</h3>
                                <p className="text-xs text-slate-400 mb-6">Dominasi pasar nasional dengan strategi growth marketing komprehensif.</p>
                                <ul className="space-y-3 text-xs text-slate-300 mb-8 border-t border-slate-800 pt-6">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Full Funnel Digital Marketing</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Advanced Analytics & Attribution</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Retargeting & CRM Automation</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Dedicated Growth Strategist</span>
                                    </li>
                                </ul>
                            </div>
                            <a 
                                href="#audit" 
                                className="w-full text-center py-3 rounded-xl text-sm font-bold text-slate-200 border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all"
                            >
                                Pilih Paket Scale
                            </a>
                        </div>

                    </div>
                </section>


                {/* SECTION 8: TESTIMONIAL SECTION */}
                <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                            <span>Testimoni Klien</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Bisnis yang Berkembang Bersama <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-blue-400 to-emerald-400">Strategi Digital Kami</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                name: 'Hendra Setiawan',
                                role: 'Owner Fashion Brand Lokal',
                                text: 'Sejak toko Shopee kami ditangani tim Genial Digital Solution, omzet bulanan naik dari Rp 45 Juta jadi Rp 210 Juta dalam 3 bulan. ROAS Shopee Ads tembus 8.2x!',
                                metric: '+366% Revenue Growth',
                                rating: 5
                            },
                            {
                                name: 'Siti Rahmawati',
                                role: 'Founder Skincare UMKM',
                                text: 'TikTok Ads dan Meta Ads kami sebelumnya sering loss. Setelah diaudit dan diubah funnel kreasinya oleh Genial, leads yang masuk via WA meledak tiap hari.',
                                metric: 'ROAS 7.4x di TikTok Ads',
                                rating: 5
                            },
                            {
                                name: 'Kevin Wijaya',
                                role: 'CEO B2B Service Provider',
                                text: 'Google Search Ads dari Genial Digital Solution sangat presisi. Kami mendapat klien B2B bernilai ratusan juta rupiah hanya dalam bulan pertama run campaign.',
                                metric: '-55% Cost Per Lead',
                                rating: 5
                            }
                        ].map((t, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                                        {[...Array(t.rating)].map((_, r) => (
                                            <Star key={r} className="w-4 h-4 fill-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-300 italic mb-6 leading-relaxed">
                                        "{t.text}"
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-white">{t.name}</div>
                                        <div className="text-xs text-slate-400">{t.role}</div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                        {t.metric}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>


                {/* SECTION 9: FINAL CTA */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="rounded-3xl bg-gradient-to-r from-blue-900/90 via-slate-900 to-emerald-950/90 border border-blue-500/40 p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
                        
                        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
                            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                                Jangan Biarkan Kompetitor Mengambil Pelanggan Anda
                            </h2>
                            <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
                                Setiap hari calon pelanggan mencari produk seperti milik Anda. Pastikan bisnis Anda muncul di tempat yang tepat dengan strategi digital marketing yang terukur.
                            </p>
                            <div className="pt-4">
                                <a 
                                    href="#audit" 
                                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 hover:shadow-xl hover:shadow-blue-500/30 transition-all shadow-lg"
                                >
                                    <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
                                    <span>Mulai Audit Gratis Sekarang</span>
                                </a>
                            </div>
                        </div>

                    </div>
                </section>


                {/* FOOTER */}
                <footer className="border-t border-slate-800 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                                G
                            </div>
                            <span className="text-slate-200 font-bold">Genial Digital Solution</span>
                        </div>
                        <div>
                            © 2026 Genial Digital Solution. All rights reserved. High Conversion Digital Agency.
                        </div>
                        <div className="flex gap-4">
                            <a href="#services" className="hover:text-white transition-colors">Layanan</a>
                            <a href="#audit" className="hover:text-white transition-colors">Audit Gratis</a>
                            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">WhatsApp</a>
                        </div>
                    </div>
                </footer>


                {/* FLOATING WHATSAPP BUTTON */}
                <a 
                    href="https://wa.me/6281234567890?text=Halo%20Genial%20Digital%20Solution,%20saya%20ingin%20konsultasi%20strategi%20digital%20marketing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl shadow-emerald-500/40 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
                    title="Konsultasi WhatsApp"
                >
                    <MessageSquare className="w-6 h-6 fill-white" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-xs font-bold pl-0 group-hover:pl-2">
                        Chat Konsultasi
                    </span>
                </a>

            </div>
        </>
    );
}

function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M12 8v13" />
            <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
        </svg>
    );
}
