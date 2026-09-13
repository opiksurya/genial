import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import { 
    TrendingUp, 
    Zap, 
    CheckCircle2, 
    ArrowRight, 
    Sparkles, 
    ShieldCheck, 
    MessageSquare, 
    Phone, 
    Check, 
    X, 
    ShoppingBag, 
    Video, 
    Share2, 
    Search,
    Menu,
    Star,
    Sun,
    Moon
} from 'lucide-react';

import { useMetaPixel } from '@/hooks/use-meta-pixel';
import { useGtm } from '@/hooks/use-gtm';
import { SpotlightCard } from '@/components/reactbits/spotlight-card';
import { ShinyText } from '@/components/reactbits/shiny-text';
import { BlurText } from '@/components/reactbits/blur-text';
import { ParticlesBg } from '@/components/reactbits/particles-bg';
import { CountUp } from '@/components/reactbits/count-up';
import { TiltedCard } from '@/components/reactbits/tilted-card';

interface PageProps {
    flash?: {
        success?: string;
        whatsapp_url?: string;
    };
    clientProjects?: {
        id: number;
        name: string;
        client: string;
        client_logo?: string;
        category: string;
    }[];
    whatsappNumber?: string;
    whatsappDefaultMessage?: string;
    [key: string]: any;
}

export default function Welcome() {
    useMetaPixel();
    useGtm();
    const { 
        flash, 
        clientProjects = [], 
        whatsappNumber = '6281234567890',
        whatsappDefaultMessage = 'Halo Genial Digital Solution, saya ingin konsultasi strategi digital marketing' 
    } = usePage<PageProps>().props;

    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappDefaultMessage)}`;


    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light'); // Default Light Mode
    const [activeTab, setActiveTab] = useState<'shopee' | 'tiktok' | 'meta' | 'google'>('shopee');

    const toggleTheme = () => {
        setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Audit Form Inertia state
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        whatsapp: '',
        website_marketplace: '',
        business_type: '',
        target_sales: '',
    });

    const [formSubmitted, setFormSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Push GTM DataLayer Lead Event for Audit Form Submit
        if (typeof window !== 'undefined') {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'generate_lead',
                event_category: 'Lead',
                event_action: 'Audit Form Submit',
                event_label: 'Free Audit Digital Request',
                business_type: data.business_type,
                value: 0.00,
                currency: 'IDR',
            });
        }

        post('/audit-request', {
            onSuccess: () => {
                setFormSubmitted(true);
                reset();
            },
        });
    };

    // Official Brand Color Tokens:
    // Black: #000000
    // Blue Bell: #2D90CA
    // Golden Pollen: #FAD03D
    // Fresh Sky: #00A9E7
    // Bright Sky: #05BAF0

    const campaignMetrics = {
        shopee: {
            title: 'Shopee Ads Performance',
            roas: '8.4x',
            sales: 'Rp 142.500.000',
            cpr: 'Rp 1.200',
            growth: '+340%',
            color: 'from-[#2D90CA] to-[#05BAF0]',
            icon: ShoppingBag
        },
        tiktok: {
            title: 'TikTok Viral Ads Performance',
            roas: '7.2x',
            sales: 'Rp 189.000.000',
            cpr: 'Rp 850',
            growth: '+420%',
            color: 'from-[#00A9E7] to-[#FAD03D]',
            icon: Video
        },
        meta: {
            title: 'Meta Ads Conversion Funnel',
            roas: '6.9x',
            sales: 'Rp 215.800.000',
            cpr: 'Rp 3.400',
            growth: '+280%',
            color: 'from-[#2D90CA] to-[#00A9E7]',
            icon: Share2
        },
        google: {
            title: 'Google Search & PMax Ads',
            roas: '9.1x',
            sales: 'Rp 310.000.000',
            cpr: 'Rp 4.100',
            growth: '+390%',
            color: 'from-[#05BAF0] to-[#FAD03D]',
            icon: Search
        }
    };

    // Dynamic Theme Classes
    const isDark = themeMode === 'dark';

    const bgClass = isDark ? 'bg-[#000000] text-slate-100' : 'bg-[#f8fafc] text-slate-900';
    const cardBg = isDark ? 'bg-[#0c1322] border-slate-800' : 'bg-white border-slate-200/80 shadow-xl shadow-slate-200/60';
    const cardInnerBg = isDark ? 'bg-[#050914] border-slate-800/80' : 'bg-slate-50 border-slate-200/80';
    const textPrimary = isDark ? 'text-white' : 'text-slate-900';
    const textMuted = isDark ? 'text-slate-300' : 'text-slate-600';
    const headerBg = isDark ? 'bg-[#000000]/85 border-slate-800/80' : 'bg-white/85 border-slate-200/80';
    const inputBg = isDark ? 'bg-[#050914] border-slate-800 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400';
    const navText = isDark ? 'text-slate-300 hover:text-[#05BAF0]' : 'text-slate-600 hover:text-[#2D90CA]';

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
        "description": "Digital Marketing Agency Indonesia berpengalaman dalam Shopee Ads, TikTok Ads, Meta Ads, dan Google Ads berbasis data & ROI tinggi."
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

            <div className={`min-h-screen ${bgClass} font-sans selection:bg-[#00A9E7] selection:text-white relative overflow-hidden transition-colors duration-300`}>
                
                {/* Brand Background Ambient Glows */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] ${isDark ? 'from-[#2D90CA]/25 via-[#00A9E7]/15 to-[#FAD03D]/10' : 'from-[#2D90CA]/15 via-[#05BAF0]/15 to-[#FAD03D]/10'} blur-[130px] rounded-full pointer-events-none -z-10`} />
                <div className={`absolute top-[35%] right-0 w-[600px] h-[600px] ${isDark ? 'bg-[#00A9E7]/10' : 'bg-[#05BAF0]/10'} blur-[150px] rounded-full pointer-events-none -z-10`} />

                {/* Grid Overlay */}
                <div className={`absolute inset-0 ${isDark ? 'bg-[linear-gradient(to_right,#2D90CA10_1px,transparent_1px),linear-gradient(to_bottom,#2D90CA10_1px,transparent_1px)]' : 'bg-[linear-gradient(to_right,#00A9E715_1px,transparent_1px),linear-gradient(to_bottom,#00A9E715_1px,transparent_1px)]'} bg-[size:4rem_4rem] pointer-events-none -z-10`} />

                {/* NAVIGATION HEADER */}
                <header className={`sticky top-0 z-50 backdrop-blur-xl ${headerBg} transition-all duration-300`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                        
                        {/* Logo */}
                        <a href="#" className="flex items-center gap-3 group">
                            <img 
                                src="/logo.png" 
                                alt="Genial Digital Solution" 
                                className="h-10 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
                            />
                        </a>

                        {/* Desktop Nav Items */}
                        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                            <a href="#services" className={navText}>Layanan</a>
                            <a href="#audit" className={navText}>Gratis Audit</a>
                            <a href="#why-us" className={navText}>Keunggulan</a>
                            <a href="#results" className={navText}>Case Study</a>
                            <a href="#packages" className={navText}>Paket Harga</a>
                            <a href="#testimonials" className={navText}>Testimoni</a>
                        </nav>

                        {/* Action Buttons & Theme Switcher (Icon Only) */}
                        <div className="hidden md:flex items-center gap-3">
                            
                            {/* Theme Toggle Button */}
                            <button
                                onClick={toggleTheme}
                                className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${
                                    isDark 
                                        ? 'bg-[#0c1322] border-slate-800 text-[#FAD03D] hover:bg-slate-900' 
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
                                }`}
                                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {isDark ? <Sun className="w-5 h-5 text-[#FAD03D]" /> : <Moon className="w-5 h-5 text-[#2D90CA]" />}
                            </button>

                            {/* WhatsApp Button */}
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
                            
                            {/* Klaim Audit Button (Brand Signature Gradient) */}
                            <a 
                                href="#audit" 
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-md shadow-[#00A9E7]/25 hover:scale-105 active:scale-95"
                                title="Klaim Audit Gratis"
                            >
                                <Zap className="w-5 h-5 fill-[#FAD03D] text-[#FAD03D]" />
                            </a>
                        </div>

                        {/* Mobile Menu & Theme Switcher Button */}
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

                    {/* Mobile Menu dropdown */}
                    {mobileMenuOpen && (
                        <div className={`md:hidden ${isDark ? 'bg-[#000000] border-slate-800' : 'bg-white border-slate-200'} border-b px-4 pt-3 pb-6 space-y-3`}>
                            <a href="#services" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navText}`}>Layanan</a>
                            <a href="#audit" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navText}`}>Gratis Audit</a>
                            <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navText}`}>Keunggulan</a>
                            <a href="#results" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navText}`}>Case Study</a>
                            <a href="#packages" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navText}`}>Paket Harga</a>
                            <div className="pt-2 flex flex-col gap-2">
                                <a 
                                    href="#audit" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] shadow-md"
                                >
                                    Klaim Audit Gratis
                                </a>
                            </div>
                        </div>
                    )}
                </header>


                {/* SECTION 1: HERO SECTION */}
                <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <ParticlesBg particleCount={40} particleColor={isDark ? 'rgba(5, 186, 240, 0.35)' : 'rgba(45, 144, 202, 0.25)'} speed={0.4} />

                    <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
                        
                        {/* Hero Text */}
                        <div className="lg:col-span-7 space-y-8 text-left">
                            
                            {/* Top Badge with ShinyText */}
                            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${isDark ? 'bg-[#2D90CA]/15 border-[#2D90CA]/30 text-[#05BAF0]' : 'bg-[#00A9E7]/10 border-[#00A9E7]/30 text-[#2D90CA]'} border text-xs sm:text-sm font-medium`}>
                                <Sparkles className="w-4 h-4 text-[#FAD03D] fill-[#FAD03D] animate-pulse" />
                                <ShinyText text="Premier Digital Growth & Performance Marketing Agency" speed={4} className="text-xs sm:text-sm font-medium" />
                            </div>

                            {/* Main Headline with BlurText */}
                            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] ${textPrimary}`}>
                                <BlurText text="Naikkan Penjualan Online dengan Strategi" className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] ${textPrimary}`} delay={100} />{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0]">Digital Marketing Terukur</span>
                            </h1>

                            {/* Subheadline */}
                            <p className={`text-base sm:text-lg ${textMuted} leading-relaxed max-w-2xl font-normal`}>
                                Kami membantu bisnis berkembang melalui kombinasi strategi <strong>SEO, Google Ads, Meta Ads, TikTok Ads,</strong> dan <strong>Shopee Ads</strong> berbasis data untuk menghasilkan traffic, leads, dan penjualan nyata.
                            </p>

                            {/* CTA Group */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                                <a 
                                    href="#audit"
                                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:shadow-xl hover:shadow-[#00A9E7]/30 transition-all duration-300 transform hover:-translate-y-0.5"
                                >
                                    <Zap className="w-5 h-5 fill-[#FAD03D] text-[#FAD03D]" />
                                    <span className="font-extrabold">Gratis Audit Digital Bisnis Anda</span>
                                </a>
                                <a 
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold border transition-all ${
                                        isDark 
                                            ? 'text-slate-200 border-slate-700 bg-[#0c1322] hover:bg-slate-800' 
                                            : 'text-slate-700 border-slate-300 bg-white hover:bg-slate-100 shadow-sm'
                                    }`}
                                >
                                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                                    <span>Konsultasi Strategi Sekarang</span>
                                </a>
                            </div>

                            {/* Social Proof Stats with CountUp */}
                            <div className={`pt-6 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'} grid grid-cols-2 sm:grid-cols-4 gap-6 text-left`}>
                                <div>
                                    <CountUp to={500} suffix="+" className={`text-2xl sm:text-3xl font-extrabold ${textPrimary}`} />
                                    <div className={`text-xs ${textMuted} mt-1`}>Campaign Dikelola</div>
                                </div>
                                <div>
                                    <CountUp to={8.4} suffix="x" decimals={1} className="text-2xl sm:text-3xl font-extrabold text-[#05BAF0]" />
                                    <div className={`text-xs ${textMuted} mt-1`}>Rata-rata ROAS</div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-[#2D90CA]">
                                        Rp <CountUp to={25} suffix="B+" />
                                    </div>
                                    <div className={`text-xs ${textMuted} mt-1`}>Revenue Client</div>
                                </div>
                                <div>
                                    <CountUp to={98.5} suffix="%" decimals={1} className="text-2xl sm:text-3xl font-extrabold text-[#FAD03D]" />
                                    <div className={`text-xs ${textMuted} mt-1`}>Kepuasan Klien</div>
                                </div>
                            </div>

                        </div>

                        {/* Hero Visual Mockup with TiltedCard */}
                        <div className="lg:col-span-5 relative">
                            <TiltedCard maxDegree={6}>
                                <div className={`relative rounded-2xl p-6 ${cardBg}`}>
                                
                                {/* Header Bar */}
                                <div className={`flex items-center justify-between pb-4 mb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                                        <span className="w-3 h-3 rounded-full bg-[#FAD03D] inline-block" />
                                        <span className="w-3 h-3 rounded-full bg-[#05BAF0] inline-block" />
                                        <span className={`ml-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>campaign-analytics.live</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00A9E7] bg-[#00A9E7]/10 px-2.5 py-0.5 rounded-full border border-[#00A9E7]/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#00A9E7] animate-ping" />
                                        Live ROI Tracking
                                    </span>
                                </div>

                                {/* Platform Selector */}
                                <div className={`grid grid-cols-4 gap-1 p-1 ${isDark ? 'bg-[#050914] border-slate-800' : 'bg-slate-100 border-slate-200'} rounded-xl mb-6 border`}>
                                    {(['shopee', 'tiktok', 'meta', 'google'] as const).map((key) => {
                                        const ItemIcon = campaignMetrics[key].icon;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setActiveTab(key)}
                                                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                                                    activeTab === key
                                                        ? (isDark ? 'bg-slate-800 text-white shadow-md border-slate-700' : 'bg-white text-slate-900 shadow-md border-slate-200')
                                                        : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')
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
                                            <h4 className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                                                {campaignMetrics[activeTab].title}
                                            </h4>
                                            <div className={`text-2xl sm:text-3xl font-extrabold ${textPrimary} mt-1`}>
                                                {campaignMetrics[activeTab].sales}
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#00A9E7] bg-[#00A9E7]/10 border border-[#00A9E7]/20">
                                            {campaignMetrics[activeTab].growth}
                                        </span>
                                    </div>

                                    {/* Simulated Performance Bars */}
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div className={`p-3 rounded-xl ${cardInnerBg}`}>
                                            <div className={`text-[11px] ${textMuted}`}>Target ROAS</div>
                                            <div className="text-xl font-bold text-[#FAD03D] mt-0.5">
                                                {campaignMetrics[activeTab].roas}
                                            </div>
                                            <div className={`w-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'} h-1.5 rounded-full mt-2 overflow-hidden`}>
                                                <div className="bg-[#FAD03D] h-full w-[85%]" />
                                            </div>
                                        </div>

                                        <div className={`p-3 rounded-xl ${cardInnerBg}`}>
                                            <div className={`text-[11px] ${textMuted}`}>Cost Per Lead</div>
                                            <div className="text-xl font-bold text-[#05BAF0] mt-0.5">
                                                {campaignMetrics[activeTab].cpr}
                                            </div>
                                            <div className={`w-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'} h-1.5 rounded-full mt-2 overflow-hidden`}>
                                                <div className="bg-[#05BAF0] h-full w-[70%]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mockup Graph Bars */}
                                    <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                        <div className="text-[11px] text-slate-400 mb-3 flex items-center justify-between">
                                            <span>Tren Penjualan Bulanan</span>
                                            <span className="text-[#2D90CA] font-semibold">High Conversion Funnel</span>
                                        </div>
                                        <div className="h-28 flex items-end justify-between gap-2 px-1">
                                            {[35, 48, 42, 65, 78, 92, 110].map((val, idx) => (
                                                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                                                    <div 
                                                        className={`w-full rounded-t-md transition-all duration-500 bg-gradient-to-t ${campaignMetrics[activeTab].color} group-hover:brightness-125`}
                                                        style={{ height: `${val}%` }}
                                                    />
                                                    <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-mono`}>B{idx + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Badge */}
                                <div className={`absolute -bottom-6 -left-6 ${cardBg} p-3.5 rounded-xl shadow-2xl flex items-center gap-3 hidden sm:flex border`}>
                                    <div className="w-9 h-9 rounded-lg bg-[#00A9E7]/20 text-[#00A9E7] flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className={`text-xs ${textMuted}`}>Konversi Rata-rata</div>
                                        <div className={`text-sm font-bold ${textPrimary}`}>+312% Conversion Rate</div>
                                    </div>
                                </div>

                            </div>
                            </TiltedCard>
                        </div>

                    </div>
                </section>

                {/* TRUSTED CLIENT SHOWCASE BANNER */}
                <section className={`py-12 border-y ${isDark ? 'bg-[#060a12]/90 border-slate-800' : 'bg-slate-50 border-slate-200'} transition-colors`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <p className={`text-center text-xs font-bold uppercase tracking-widest ${textMuted} mb-8`}>
                            Dipercaya Oleh Brand & Klien Digital Marketing Agency
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
                            {clientProjects && clientProjects.length > 0 ? (
                                clientProjects.map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center justify-center transition-all hover:scale-105"
                                        title={p.client}
                                    >
                                        {p.client_logo ? (
                                            <img
                                                src={p.client_logo}
                                                alt={p.client}
                                                className="h-10 sm:h-12 w-auto max-w-[160px] object-contain filter grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition-all duration-300"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D90CA] to-[#05BAF0] text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                                                    {p.client.charAt(0)}
                                                </div>
                                                <span className={`font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.client}</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
                                        <div className="w-10 h-10 rounded-xl bg-[#2D90CA] text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                                            G
                                        </div>
                                        <span className={`font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Genial</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
                                        <div className="w-10 h-10 rounded-xl bg-[#2D90CA] text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                                            B
                                        </div>
                                        <span className={`font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>BatikKu Indonesia</span>
                                    </div>
                                    <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
                                        <div className="w-10 h-10 rounded-xl bg-[#FAD03D] text-slate-900 font-extrabold text-base flex items-center justify-center shadow-xs">
                                            S
                                        </div>
                                        <span className={`font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Skincare Glowing ID</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>


                {/* SECTION 2: FREE DIGITAL AUDIT OFFER */}
                <section id="audit" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
                    <div className={`rounded-3xl ${isDark ? 'bg-gradient-to-b from-[#0c1322] via-[#050914] to-[#000000] border-[#2D90CA]/30' : 'bg-gradient-to-b from-white via-slate-50 to-[#00A9E7]/10 border-slate-200/80 shadow-2xl'} border p-8 sm:p-12 lg:p-16 relative overflow-hidden`}>
                        
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00A9E7]/10 blur-[100px] rounded-full pointer-events-none" />

                        <div className="grid lg:grid-cols-12 gap-12 items-center">
                            
                            {/* Left Text Offer */}
                            <div className="lg:col-span-6 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAD03D]/15 border border-[#FAD03D]/30 text-amber-500 text-xs font-bold uppercase tracking-wider">
                                    <GiftIcon className="w-4 h-4 text-[#FAD03D]" />
                                    <span>Penawaran Terbatas Bulan Ini</span>
                                </div>

                                <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold ${textPrimary} tracking-tight leading-tight`}>
                                    Gratis Audit Digital <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0]">
                                        Senilai Rp1.500.000
                                    </span>
                                </h2>

                                <p className={`${textMuted} text-sm sm:text-base leading-relaxed`}>
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
                                        <div key={idx} className={`flex items-center gap-2.5 text-sm ${textPrimary} font-medium`}>
                                            <CheckCircle2 className="w-4 h-4 text-[#00A9E7] shrink-0" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#2D90CA]/10 border-[#2D90CA]/20' : 'bg-blue-50 border-blue-200'} border text-xs ${textMuted} flex items-center gap-3`}>
                                    <ShieldCheck className="w-8 h-8 text-[#00A9E7] shrink-0" />
                                    <span>Laporan audit dikirim secara rahasia langsung ke WhatsApp Anda tanpa dipungut biaya sedikitpun.</span>
                                </div>
                            </div>

                            {/* Right Interactive Form */}
                            <div className="lg:col-span-6">
                                <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-[#050914] border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                                    
                                    <h3 className={`text-xl font-bold ${textPrimary} mb-2 flex items-center gap-2`}>
                                        <Sparkles className="w-5 h-5 text-[#FAD03D] fill-[#FAD03D]" />
                                        <span>Isi Form Audit Gratis</span>
                                    </h3>
                                    <p className={`text-xs ${textMuted} mb-6`}>
                                        Lengkapi data singkat berikut untuk klaim slot audit bisnis Anda.
                                    </p>

                                    {formSubmitted ? (
                                        <div className="p-6 rounded-xl bg-[#00A9E7]/10 border border-[#00A9E7]/30 text-center space-y-4">
                                            <div className="w-12 h-12 rounded-full bg-[#00A9E7]/20 text-[#00A9E7] flex items-center justify-center mx-auto">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <h4 className={`text-lg font-bold ${textPrimary}`}>Permintaan Audit Berhasil Dikirim!</h4>
                                            <p className={`text-xs ${textMuted}`}>
                                                Terima kasih. Tim konsultan Genial Digital Solution akan segera menghubungi Anda.
                                            </p>
                                            {flash?.whatsapp_url && (
                                                <a 
                                                    href={flash.whatsapp_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-[#00A9E7] hover:bg-[#05BAF0] transition-all shadow-lg"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    <span>Lanjut Chat di WhatsApp</span>
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div>
                                                <label className={`block text-xs font-semibold ${textPrimary} mb-1`}>
                                                    Nama Lengkap <span className="text-rose-500">*</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    placeholder="Contoh: Budi Santoso"
                                                    className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#00A9E7] focus:ring-1 focus:ring-[#00A9E7] transition-all ${inputBg}`}
                                                />
                                                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                                            </div>

                                            <div>
                                                <label className={`block text-xs font-semibold ${textPrimary} mb-1`}>
                                                    Nomor WhatsApp <span className="text-rose-500">*</span>
                                                </label>
                                                <input 
                                                    type="tel" 
                                                    required
                                                    value={data.whatsapp}
                                                    onChange={(e) => setData('whatsapp', e.target.value)}
                                                    placeholder="Contoh: 081234567890"
                                                    className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#00A9E7] focus:ring-1 focus:ring-[#00A9E7] transition-all ${inputBg}`}
                                                />
                                                {errors.whatsapp && <p className="text-xs text-rose-500 mt-1">{errors.whatsapp}</p>}
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={`block text-xs font-semibold ${textPrimary} mb-1`}>
                                                        Website / Marketplace <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={data.website_marketplace}
                                                        onChange={(e) => setData('website_marketplace', e.target.value)}
                                                        placeholder="Shopee / Website URL"
                                                        className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#00A9E7] focus:ring-1 focus:ring-[#00A9E7] transition-all ${inputBg}`}
                                                    />
                                                </div>

                                                <div>
                                                    <label className={`block text-xs font-semibold ${textPrimary} mb-1`}>
                                                        Jenis Bisnis <span className="text-rose-500">*</span>
                                                    </label>
                                                    <select 
                                                        required
                                                        value={data.business_type}
                                                        onChange={(e) => setData('business_type', e.target.value)}
                                                        className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#00A9E7] focus:ring-1 focus:ring-[#00A9E7] transition-all ${inputBg}`}
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
                                                <label className={`block text-xs font-semibold ${textPrimary} mb-1`}>
                                                    Target Penjualan Per Bulan <span className="text-rose-500">*</span>
                                                </label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={data.target_sales}
                                                    onChange={(e) => setData('target_sales', e.target.value)}
                                                    placeholder="Contoh: Rp 50 Juta - Rp 100 Juta"
                                                    className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#00A9E7] focus:ring-1 focus:ring-[#00A9E7] transition-all ${inputBg}`}
                                                />
                                            </div>

                                            <button 
                                                type="submit"
                                                disabled={processing}
                                                className="w-full py-4 rounded-xl text-base font-bold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-lg shadow-[#00A9E7]/25 disabled:opacity-50 mt-2"
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold uppercase tracking-wider">
                            <span>Pain Points Pebisnis</span>
                        </div>
                        <h2 className={`text-3xl sm:text-4xl font-extrabold ${textPrimary} tracking-tight`}>
                            Kenapa Banyak Bisnis Sudah Beriklan Tapi <span className="text-rose-500">Tidak Mendapatkan Hasil?</span>
                        </h2>
                        <p className={`${textMuted} text-base`}>
                            Bakar uang di iklan tanpa hasil nyata adalah masalah klasik banyak pemilik bisnis. Apakah Anda mengalami salah satu kendala berikut?
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Budget Iklan Habis Tanpa Penjualan',
                                desc: 'Uang terus mengalir untuk Facebook/Google Ads, tetapi konversi dan transaksi penjualan tetap minim.'
                            },
                            {
                                title: 'Target Audience Tidak Tepat',
                                desc: 'Iklan ditayangkan ke penonton yang salah, tidak tertarik, atau tidak memiliki daya beli untuk produk Anda.'
                            },
                            {
                                title: 'Tidak Tahu Iklan Mana Yang Profit',
                                desc: 'Tanpa tracking data conversion yang tepat, Anda kesulitan membedakan campaign yang menghasilkan untung vs rugi.'
                            },
                            {
                                title: 'Konten Tidak Menarik Pelanggan',
                                desc: 'Materi iklan visual dan copy terasa biasa saja sehingga mudah dilewati pengguna sosial media.'
                            },
                            {
                                title: 'Tanpa Strategi Funnel Marketing',
                                desc: 'Hanya langsung suruh beli tanpa mengedukasi calon pembeli melalui tahap awareness, interest, hingga decision.'
                            },
                            {
                                title: 'Kalah Bersaing di Marketplace',
                                desc: 'Toko di Shopee/TikTok Shop sepi pengunjung karena tidak menggunakan strategi optimasi keyword dan bidding yang pas.'
                            }
                        ].map((item, idx) => (
                            <SpotlightCard key={idx} spotlightColor="rgba(244, 63, 94, 0.15)" className={`p-6 ${cardBg} hover:border-rose-500/40 transition-all duration-300 group`}>
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <X className="w-5 h-5" />
                                </div>
                                <h3 className={`text-lg font-bold ${textPrimary} mb-2`}>{item.title}</h3>
                                <p className={`text-sm ${textMuted} leading-relaxed`}>{item.desc}</p>
                            </SpotlightCard>
                        ))}
                    </div>
                </section>


                {/* SECTION 4: SOLUTION SECTION */}
                <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A9E7]/10 border border-[#00A9E7]/30 text-[#2D90CA] text-xs font-bold uppercase tracking-wider">
                            <span>Solusi Berbasis Data</span>
                        </div>
                        <h2 className={`text-3xl sm:text-4xl font-extrabold ${textPrimary} tracking-tight`}>
                            Solusi Digital Marketing <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0]">Berbasis Data & ROI</span>
                        </h2>
                        <p className={`${textMuted} text-base`}>
                            Kami menggabungkan data analitik mendalam dengan kreatifitas strategi ads untuk memenangkan pasar bisnis Anda.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        
                        {/* Service A: Shopee Ads */}
                        <SpotlightCard spotlightColor="rgba(0, 169, 231, 0.2)" className={`p-8 ${cardBg} hover:border-[#00A9E7]/50 transition-all group relative overflow-hidden`}>
                            <div className="w-12 h-12 rounded-2xl bg-[#00A9E7]/10 text-[#00A9E7] flex items-center justify-center mb-6">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <h3 className={`text-2xl font-bold ${textPrimary} mb-3 flex items-center gap-2`}>
                                <span>Shopee Ads Optimization</span>
                            </h3>
                            <p className={`${textMuted} text-sm leading-relaxed mb-6`}>
                                "Maksimalkan performa toko Shopee Anda dengan strategi keyword, bidding, product optimization, dan analisis conversion untuk meningkatkan penjualan."
                            </p>
                            <div className={`grid sm:grid-cols-2 gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                {['Keyword Research', 'Campaign Setup', 'Product Ads Optimization', 'ROAS Monitoring'].map((s, i) => (
                                    <div key={i} className={`flex items-center gap-2 text-xs font-medium ${textPrimary}`}>
                                        <CheckCircle2 className="w-4 h-4 text-[#00A9E7]" />
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </SpotlightCard>

                        {/* Service B: TikTok Ads */}
                        <SpotlightCard spotlightColor="rgba(5, 186, 240, 0.2)" className={`p-8 ${cardBg} hover:border-[#05BAF0]/50 transition-all group relative overflow-hidden`}>
                            <div className="w-12 h-12 rounded-2xl bg-[#05BAF0]/10 text-[#05BAF0] flex items-center justify-center mb-6">
                                <Video className="w-6 h-6" />
                            </div>
                            <h3 className={`text-2xl font-bold ${textPrimary} mb-3 flex items-center gap-2`}>
                                <span>TikTok Ads Management</span>
                            </h3>
                            <p className={`${textMuted} text-sm leading-relaxed mb-6`}>
                                "Jangkau jutaan pengguna TikTok dengan strategi creative ads yang dirancang untuk meningkatkan awareness hingga conversion."
                            </p>
                            <div className={`grid sm:grid-cols-2 gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                {['Creative Strategy', 'Video Ads Optimization', 'Audience Targeting', 'Performance Tracking'].map((s, i) => (
                                    <div key={i} className={`flex items-center gap-2 text-xs font-medium ${textPrimary}`}>
                                        <CheckCircle2 className="w-4 h-4 text-[#05BAF0]" />
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </SpotlightCard>

                        {/* Service C: Meta Ads */}
                        <SpotlightCard spotlightColor="rgba(45, 144, 202, 0.2)" className={`p-8 ${cardBg} hover:border-[#2D90CA]/50 transition-all group relative overflow-hidden`}>
                            <div className="w-12 h-12 rounded-2xl bg-[#2D90CA]/10 text-[#2D90CA] flex items-center justify-center mb-6">
                                <Share2 className="w-6 h-6" />
                            </div>
                            <h3 className={`text-2xl font-bold ${textPrimary} mb-3 flex items-center gap-2`}>
                                <span>Meta Ads Management (FB & IG)</span>
                            </h3>
                            <p className={`${textMuted} text-sm leading-relaxed mb-6`}>
                                "Bangun kampanye Facebook dan Instagram Ads yang tepat sasaran dengan targeting berbasis perilaku dan data pelanggan."
                            </p>
                            <div className={`grid sm:grid-cols-2 gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                {['Campaign Strategy', 'Audience Research', 'Retargeting Funnel', 'Conversion Optimization'].map((s, i) => (
                                    <div key={i} className={`flex items-center gap-2 text-xs font-medium ${textPrimary}`}>
                                        <CheckCircle2 className="w-4 h-4 text-[#2D90CA]" />
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </SpotlightCard>

                        {/* Service D: Google Ads */}
                        <SpotlightCard spotlightColor="rgba(250, 208, 61, 0.2)" className={`p-8 ${cardBg} hover:border-[#FAD03D]/50 transition-all group relative overflow-hidden`}>
                            <div className="w-12 h-12 rounded-2xl bg-[#FAD03D]/10 text-[#FAD03D] flex items-center justify-center mb-6">
                                <Search className="w-6 h-6" />
                            </div>
                            <h3 className={`text-2xl font-bold ${textPrimary} mb-3 flex items-center gap-2`}>
                                <span>Google Ads & SEO</span>
                            </h3>
                            <p className={`${textMuted} text-sm leading-relaxed mb-6`}>
                                "Dapatkan pelanggan yang sedang aktif mencari produk Anda melalui Google Search, Display, dan Performance Max Ads."
                            </p>
                            <div className={`grid sm:grid-cols-2 gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                {['Keyword Optimization', 'Search Campaign', 'Landing Page Optimization', 'Conversion Tracking'].map((s, i) => (
                                    <div key={i} className={`flex items-center gap-2 text-xs font-medium ${textPrimary}`}>
                                        <CheckCircle2 className="w-4 h-4 text-[#FAD03D]" />
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </SpotlightCard>

                    </div>
                </section>


                {/* SECTION 5: WHY CHOOSE US */}
                <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className={`rounded-3xl ${isDark ? 'bg-gradient-to-tr from-[#0c1322] via-[#050914] to-[#000000] border-slate-800' : 'bg-gradient-to-tr from-white via-slate-50 to-[#00A9E7]/10 border-slate-200 shadow-xl'} border p-8 sm:p-12`}>
                        <div className="grid lg:grid-cols-12 gap-12 items-center">
                            
                            <div className="lg:col-span-5 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A9E7]/10 border border-[#00A9E7]/30 text-[#00A9E7] text-xs font-bold uppercase tracking-wider">
                                    <span>Mengapa Memilih Kami</span>
                                </div>
                                <h2 className={`text-3xl sm:text-4xl font-extrabold ${textPrimary} tracking-tight leading-tight`}>
                                    Mengapa Memilih <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0]">
                                        Genial Digital Solution?
                                    </span>
                                </h2>
                                <p className={`${textMuted} text-sm sm:text-base leading-relaxed`}>
                                    Kami tidak hanya menyajikan janji impressions atau clicks, tetapi berfokus pada hasil akhir yang nyata: <strong>Penjualan, Profitability, dan ROI</strong>.
                                </p>
                                <a 
                                    href="#audit" 
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-lg"
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
                                    <div key={idx} className={`flex gap-4 p-4 rounded-xl ${cardInnerBg} hover:border-[#00A9E7]/40 transition-all`}>
                                        <div className="w-8 h-8 rounded-lg bg-[#00A9E7]/10 text-[#00A9E7] flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="w-5 h-5 font-bold" />
                                        </div>
                                        <div>
                                            <h4 className={`text-base font-bold ${textPrimary}`}>{item.title}</h4>
                                            <p className={`text-xs ${textMuted} mt-1 leading-relaxed`}>{item.desc}</p>
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A9E7]/10 border border-[#00A9E7]/30 text-[#00A9E7] text-xs font-bold uppercase tracking-wider">
                            <span>Bukti Performa</span>
                        </div>
                        <h2 className={`text-3xl sm:text-4xl font-extrabold ${textPrimary} tracking-tight`}>
                            Hasil yang Kami Kejar untuk <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0]">Bisnis Anda</span>
                        </h2>
                        <p className={`${textMuted} text-base`}>
                            Perbandingan nyata hasil sebelum dan sesudah optimasi oleh tim Genial Digital Solution.
                        </p>
                    </div>

                    {/* Before vs After Comparison Cards */}
                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        
                        {/* BEFORE CARD */}
                        <div className={`p-8 rounded-3xl ${isDark ? 'bg-[#0c1322]/40 border-rose-500/20' : 'bg-rose-50/50 border-rose-200'} border relative overflow-hidden`}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-xs font-bold mb-6">
                                <span>SEBELUM (Tanpa Optimized Strategy)</span>
                            </div>
                            <ul className={`space-y-4 text-sm ${textMuted}`}>
                                <li className="flex items-center gap-3">
                                    <X className="w-5 h-5 text-rose-500 shrink-0" />
                                    <span><strong>Traffic Rendah:</strong> Pengunjung toko/website sepi dan acak</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <X className="w-5 h-5 text-rose-500 shrink-0" />
                                    <span><strong>ROAS Rendah (1.2x - 1.8x):</strong> Budget iklan hampir tidak menutup modal</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <X className="w-5 h-5 text-rose-500 shrink-0" />
                                    <span><strong>Cost Per Conversion Mahal:</strong> Biaya per penjualan sangat menguras margin</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <X className="w-5 h-5 text-rose-500 shrink-0" />
                                    <span><strong>Conversion Small:</strong> Banyak click tapi tidak ada transaksi beli</span>
                                </li>
                            </ul>
                        </div>

                        {/* AFTER CARD */}
                        <div className={`p-8 rounded-3xl ${isDark ? 'bg-[#0c1322] border-[#00A9E7]/40 shadow-[#00A9E7]/5' : 'bg-white border-[#00A9E7]/40 shadow-xl shadow-[#00A9E7]/10'} border relative overflow-hidden`}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A9E7]/10 text-[#00A9E7] text-xs font-bold mb-6">
                                <span>SESUDAH (Dengan Genial Digital Solution)</span>
                            </div>
                            <ul className={`space-y-4 text-sm ${textPrimary}`}>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-[#00A9E7] shrink-0" />
                                    <span><strong>Traffic Meningkat +450%:</strong> Target audience pembeli siap beli</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-[#00A9E7] shrink-0" />
                                    <span><strong>ROAS Tinggi (6.5x - 9.2x):</strong> Keuntungan bersih berlipat ganda</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-[#00A9E7] shrink-0" />
                                    <span><strong>Cost Per Conversion Turun -60%:</strong> Iklan menjadi sangat efisien</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-[#00A9E7] shrink-0" />
                                    <span><strong>Sales & Revenue Meledak:</strong> Penjualan tumbuh secara konsisten setiap bulan</span>
                                </li>
                            </ul>
                        </div>

                    </div>
                </section>


                {/* SECTION 7: PACKAGE SECTION */}
                <section id="packages" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A9E7]/10 border border-[#00A9E7]/30 text-[#00A9E7] text-xs font-bold uppercase tracking-wider">
                            <span>Paket Layanan</span>
                        </div>
                        <h2 className={`text-3xl sm:text-4xl font-extrabold ${textPrimary} tracking-tight`}>
                            Pilih Paket <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0]">Pertumbuhan Bisnis</span>
                        </h2>
                        <p className={`${textMuted} text-base`}>
                            Paket fleksibel sesuai tahap perkembangan bisnis Anda.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-stretch">
                        
                        {/* STARTER */}
                        <div className={`p-8 rounded-3xl ${cardBg} flex flex-col justify-between hover:border-slate-400 transition-all`}>
                            <div>
                                <div className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-widest mb-2`}>STARTER</div>
                                <h3 className={`text-2xl font-bold ${textPrimary} mb-2`}>Cocok untuk UMKM</h3>
                                <p className={`text-xs ${textMuted} mb-6`}>Mulai bangun fondasi digital marketing bisnis Anda dengan strategi tepat.</p>
                                <ul className={`space-y-3 text-xs ${textMuted} mb-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} pt-6`}>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Audit Digital Bisnis & Website</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Setup Campaign Ads (1 Platform)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Basic Optimization & Copywriting</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Laporan Performa Bulanan</span>
                                    </li>
                                </ul>
                            </div>
                            <a 
                                href="#audit" 
                                className={`w-full text-center py-3 rounded-xl text-sm font-bold border transition-all ${
                                    isDark ? 'text-slate-200 border-slate-700 bg-slate-800 hover:bg-slate-700' : 'text-slate-700 border-slate-300 bg-slate-100 hover:bg-slate-200'
                                }`}
                            >
                                Pilih Paket Starter
                            </a>
                        </div>

                        {/* GROWTH (FEATURED BRAND GRADIENT) */}
                        <div className={`p-8 rounded-3xl ${isDark ? 'bg-gradient-to-b from-[#0c1322] to-[#000000] border-[#00A9E7]' : 'bg-gradient-to-b from-white to-[#00A9E7]/10 border-[#00A9E7] shadow-2xl shadow-[#00A9E7]/15'} border-2 flex flex-col justify-between relative transform lg:-translate-y-2`}>
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] text-slate-900 text-[11px] font-extrabold uppercase tracking-wider shadow-md">
                                PALING POPULER
                            </div>
                            <div>
                                <div className="text-xs font-bold text-[#2D90CA] uppercase tracking-widest mb-2">GROWTH</div>
                                <h3 className={`text-2xl font-bold ${textPrimary} mb-2`}>Untuk Bisnis Berkembang</h3>
                                <p className={`text-xs ${textMuted} mb-6`}>Skala penjualan bisnis Anda melalui multi-channel digital ads terpadu.</p>
                                <ul className={`space-y-3 text-xs ${textPrimary} mb-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} pt-6`}>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Shopee Ads & Marketplace Optimization</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>TikTok Ads & Creative Strategy</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Meta Ads (Facebook & Instagram)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Google Ads & Search Setup</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Content Strategy & Funneling</span>
                                    </li>
                                </ul>
                            </div>
                            <a 
                                href="#audit" 
                                className="w-full text-center py-3.5 rounded-xl text-sm font-extrabold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-lg"
                            >
                                Konsultasi Paket Growth
                            </a>
                        </div>

                        {/* SCALE */}
                        <div className={`p-8 rounded-3xl ${cardBg} flex flex-col justify-between hover:border-slate-400 transition-all`}>
                            <div>
                                <div className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-widest mb-2`}>SCALE</div>
                                <h3 className={`text-2xl font-bold ${textPrimary} mb-2`}>Untuk Brand Besar</h3>
                                <p className={`text-xs ${textMuted} mb-6`}>Dominasi pasar nasional dengan strategi growth marketing komprehensif.</p>
                                <ul className={`space-y-3 text-xs ${textMuted} mb-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} pt-6`}>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Full Funnel Digital Marketing</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Advanced Analytics & Attribution</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Retargeting & CRM Automation</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-[#00A9E7]" />
                                        <span>Dedicated Growth Strategist</span>
                                    </li>
                                </ul>
                            </div>
                            <a 
                                href="#audit" 
                                className={`w-full text-center py-3 rounded-xl text-sm font-bold border transition-all ${
                                    isDark ? 'text-slate-200 border-slate-700 bg-slate-800 hover:bg-slate-700' : 'text-slate-700 border-slate-300 bg-slate-100 hover:bg-slate-200'
                                }`}
                            >
                                Pilih Paket Scale
                            </a>
                        </div>

                    </div>
                </section>


                {/* SECTION 8: TESTIMONIAL SECTION */}
                <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAD03D]/15 border border-[#FAD03D]/30 text-amber-500 text-xs font-bold uppercase tracking-wider">
                            <span>Testimoni Klien</span>
                        </div>
                        <h2 className={`text-3xl sm:text-4xl font-extrabold ${textPrimary} tracking-tight`}>
                            Bisnis yang Berkembang Bersama <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#FAD03D]">Strategi Digital Kami</span>
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
                            <div key={i} className={`p-6 rounded-2xl ${cardBg} flex flex-col justify-between`}>
                                <div>
                                    <div className="flex items-center gap-1 text-[#FAD03D] mb-4">
                                        {[...Array(t.rating)].map((_, r) => (
                                            <Star key={r} className="w-4 h-4 fill-[#FAD03D] text-[#FAD03D]" />
                                        ))}
                                    </div>
                                    <p className={`text-sm ${textMuted} italic mb-6 leading-relaxed`}>
                                        "{t.text}"
                                    </p>
                                </div>
                                <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex items-center justify-between`}>
                                    <div>
                                        <div className={`text-sm font-bold ${textPrimary}`}>{t.name}</div>
                                        <div className={`text-xs ${textMuted}`}>{t.role}</div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-[#00A9E7] bg-[#00A9E7]/10 border border-[#00A9E7]/20">
                                        {t.metric}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>


                {/* SECTION 9: FINAL CTA */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className={`rounded-3xl ${isDark ? 'bg-gradient-to-r from-[#2D90CA]/20 via-[#0c1322] to-[#00A9E7]/20 border-[#00A9E7]/40' : 'bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] text-slate-900'} border p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl`}>
                        
                        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
                            <h2 className={`text-3xl sm:text-5xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight leading-tight`}>
                                Jangan Biarkan Kompetitor Mengambil Pelanggan Anda
                            </h2>
                            <p className={`${isDark ? 'text-slate-200' : 'text-slate-900/90'} text-base sm:text-lg leading-relaxed font-medium`}>
                                Setiap hari calon pelanggan mencari produk seperti milik Anda. Pastikan bisnis Anda muncul di tempat yang tepat dengan strategi digital marketing yang terukur.
                            </p>
                            <div className="pt-4">
                                <a 
                                    href="#audit" 
                                    className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-extrabold transition-all shadow-xl ${
                                        isDark 
                                            ? 'text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:shadow-[#00A9E7]/30' 
                                            : 'text-slate-900 bg-[#FAD03D] hover:bg-amber-400 border border-slate-900/10'
                                    }`}
                                >
                                    <Zap className="w-5 h-5 fill-slate-900 text-slate-900" />
                                    <span>Mulai Audit Gratis Sekarang</span>
                                </a>
                            </div>
                        </div>

                    </div>
                </section>


                {/* FOOTER */}
                <footer className={`border-t ${isDark ? 'border-slate-800 bg-[#000000]' : 'border-slate-200 bg-white'} py-12 px-4 sm:px-6 lg:px-8`}>
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Genial Digital Solution" className="h-8 w-auto object-contain" />
                        </div>
                        <div>
                            © 2026 Genial Digital Solution. All rights reserved. High Conversion Digital Agency.
                        </div>
                        <div className="flex gap-4">
                            <a href="#services" className="hover:text-[#00A9E7] transition-colors">Layanan</a>
                            <a href="#audit" className="hover:text-[#00A9E7] transition-colors">Audit Gratis</a>
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors">WhatsApp</a>
                        </div>
                    </div>
                </footer>


                {/* FLOATING WHATSAPP BUTTON */}
                <a 
                    href={waUrl}
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
