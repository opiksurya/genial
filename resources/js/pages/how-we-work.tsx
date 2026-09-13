import { Head } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { useGtm } from '@/hooks/use-gtm';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';
import { 
    Target, 
    TrendingUp, 
    Eye, 
    Users, 
    RefreshCw, 
    Zap, 
    CheckCircle2, 
    ArrowRight, 
    ShieldCheck, 
    Layers, 
    Settings, 
    Headphones, 
    BarChart3, 
    PieChart, 
    Sun, 
    Moon, 
    MessageSquare, 
    Menu, 
    X, 
    ChevronRight, 
    Sparkles, 
    Filter, 
    ShoppingBag, 
    Share2, 
    Search, 
    Award, 
    ArrowDown, 
    HelpCircle, 
    PhoneCall,
    Check,
    Repeat,
    DollarSign,
    Flame
} from 'lucide-react';

interface Props {
    whatsappNumber?: string;
    whatsappDefaultMessage?: string;
}

export default function HowWeWorkPage({ 
    whatsappNumber = '6281234567890', 
    whatsappDefaultMessage = 'Halo Genial Digital Solution, saya ingin diskusi mengenai Skema Metode & Funnel Strategy digital marketing' 
}: Props) {
    useGtm();
    const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeFunnelStage, setActiveFunnelStage] = useState<'tofu' | 'mofu' | 'bofu' | 'retention'>('tofu');

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

    const funnelStages = [
        {
            id: 'tofu',
            stageName: 'TOFU',
            shortTitle: 'Brand Awareness & Cold Traffic',
            title: '1. Brand Awareness & Cold Traffic Reach',
            badgeColor: 'bg-[#2D90CA]/20 text-[#2D90CA] border-[#2D90CA]/40',
            icon: Eye,
            subtitle: 'Menarik Ribuan Audiens Baru yang Belum Mengenal Brand Anda',
            summary: 'Di tahap pertama ini, tujuan utama kami adalah menjangkau pasar seluas-luasnya dengan konten berdaya pikat tinggi (high hook rate) agar brand Anda menjadi Top of Mind.',
            strategies: [
                {
                    title: 'Short Video Hooks & Viral Reels/TikTok',
                    desc: 'Membuat video pendek 15-30 detik dengan formula 3 detik pertama yang menghentikan scroll (Pattern Interrupt), memicu rasa penasaran, & menyoroti masalah utama calon pembeli.'
                },
                {
                    title: 'Meta & TikTok Broad Interest Targeting',
                    desc: 'Menjalankan iklan campaign dengan strategi Broad & Lookalike Audience (LAL 1-3%) untuk menguji sudut pandang kreatif paling disukai oleh algoritma AI.'
                },
                {
                    title: 'Google Search & PMax Ads (High Intent Search)',
                    desc: 'Menangkap audiens yang secara aktif mengetikkan kata kunci pencarian produk Anda di Google Search, YouTube, & Display Network.'
                },
                {
                    title: 'UGC & Influencer Creator Seeding',
                    desc: 'Mengolaborasikan konten ulasan asli (User Generated Content) dari kreator lokal untuk membangun kepercayaan awal tanpa kesan jualan terlalu kaku.'
                }
            ],
            kpi: 'Metrics Utama: Video Views 3s/10s, CPM (Cost Per Mille), Reach, Impressions, & Click Through Rate (CTR > 2%).'
        },
        {
            id: 'mofu',
            stageName: 'MOFU',
            shortTitle: 'Demand & Consideration',
            title: '2. Demand Generation & Consideration',
            badgeColor: 'bg-[#00A9E7]/20 text-[#00A9E7] border-[#00A9E7]/40',
            icon: Users,
            subtitle: 'Mendidik & Mengubah Penonton Pasif Menjadi Calon Pembeli Berminat',
            summary: 'Audiens yang sudah tertarik di tahap awal kini kami berikan edukasi mendalam, bukti sosial (social proof), serta penawaran relevan agar mereka makin yakin memilih produk Anda.',
            strategies: [
                {
                    title: 'Social Proofing & Case Study Breakdown',
                    desc: 'Menyajikan konten testimonial nyata dari pelanggan terdahulu, perbandingan before-after, serta garansi kualitas yang meruntuhkan keraguan calon pembeli.'
                },
                {
                    title: 'High-Converting Landing Page & Micro-site',
                    desc: 'Mengarahkan traffic iklan ke landing page berkecepatan tinggi yang dirancang khusus dengan copywriting persuasif, testimoni visual, & tombol penawaran jernih.'
                },
                {
                    title: 'Video Views & Social Engagers Retargeting',
                    desc: 'Menargetkan kembali audiens yang telah menonton minimal 50% durasi video atau menyukai/menyimpan postingan sosial media Anda dalam 30 hari terakhir.'
                },
                {
                    title: 'Lead Magnet & Interactive Value Offer',
                    desc: 'Memberikan penawaran awal bernilai tinggi seperti konsultasi/audit gratis, e-catalog interaktif, atau voucher diskon pendaftaran pertama.'
                }
            ],
            kpi: 'Metrics Utama: Engagement Rate, Landing Page View Rate, Time on Site, Add to Cart (ATC), & Cost Per Lead (CPL).'
        },
        {
            id: 'bofu',
            stageName: 'BOFU',
            shortTitle: 'Precision Retargeting & Sales',
            title: '3. Conversion & Precision Retargeting',
            badgeColor: 'bg-[#FAD03D]/20 text-[#FAD03D] border-[#FAD03D]/40',
            icon: Flame,
            subtitle: 'Mengejar Calon Pembeli & Mengunci Transaksi Pembelian',
            summary: 'Tahap paling krusial! Kami mengejar calon pembeli yang sudah berniat beli namun belum menyelesaikan pembayaran menggunakan teknik retargeting agresif & penawaran mendesak (Urgency Scarcity).',
            strategies: [
                {
                    title: 'Meta CAPI Pixel & Dynamic Product Ads (DPA)',
                    desc: 'Memasang Conversion API (CAPI) presisi tinggi untuk secara otomatis menayangkan kembali produk spesifik yang pernah dilihat atau dimasukkan ke keranjang belanja audiens.'
                },
                {
                    title: 'Scarcity & Limited Time Promo Retargeting',
                    desc: 'Menampilkan iklan retargeting dengan pesan khusus: "Stok Tersisa 5 Pcs Lagi", "Gratis Ongkir Berakhir Malam Ini", atau "Bonus Spesial Hanya Hari Ini".'
                },
                {
                    title: 'Abandoned Cart Recovery Campaign',
                    desc: 'Menjangkau kembali audiens yang berhenti di tahap checkout dengan pengingat otomatis & penawaran pemikat agar segera transfer.'
                },
                {
                    title: 'WhatsApp Automation & High-Closing CS Script',
                    desc: 'Mengintegrasikan pesan WhatsApp otomatis & membekali tim Customer Service Anda dengan naskah penutupan (closing script) sakti yang melipatgandakan tingkat konversi.'
                }
            ],
            kpi: 'Metrics Utama: ROAS (Return On Ad Spend), Cost Per Acquisition (CPA), Total Revenue, & Conversion Rate (% Saldo Terkonversi).'
        },
        {
            id: 'retention',
            stageName: 'RETENTION',
            shortTitle: 'Repeat Order & Loyalty',
            title: '4. Repeat Buyer & Lifetime Value (LTV) Expansion',
            badgeColor: 'bg-[#05BAF0]/20 text-[#05BAF0] border-[#05BAF0]/40',
            icon: Repeat,
            subtitle: 'Memastikan Pembeli Lama Membeli Kembali & Menjadi Loyal Customer',
            summary: 'Keuntungan terbesar bisnis terletak pada pembelian berulang. Kami mengaktifkan strategi pasca-pembelian agar pembeli merasa puas, memberikan ulasan positif, dan melakukan repeat order.',
            strategies: [
                {
                    title: 'Automated Post-Purchase Follow Up',
                    desc: 'Mengirimkan pesan otomatis setelah barang sampai untuk menanyakan kepuasan, petunjuk penggunaan, dan meminta ulasan bintang 5.'
                },
                {
                    title: 'Cross-Selling & Up-Selling Campaign',
                    desc: 'Tawaran produk pelengkap atau varian baru kepada basis data pelanggan lama yang sudah percaya dengan kualitas brand Anda.'
                },
                {
                    title: 'VIP Loyalty Program & Special Reward Broadcast',
                    desc: 'Program keanggotaan khusus dengan akses promo eksklusif lebih awal bagi pelanggan setia untuk menjaga keterikatan emosional.'
                }
            ],
            kpi: 'Metrics Utama: Repeat Purchase Rate, Customer Lifetime Value (LTV), Review Count, & Customer Acquisition Cost (CAC) Reduction.'
        }
    ];

    const analyticsInfrastructure = [
        {
            title: 'First-Party Meta Conversion API (CAPI)',
            icon: Zap,
            desc: 'Pengiriman data transaksi server-to-server langsung ke Facebook yang kebal dari pemblokiran browser iOS 14+ dan ad blocker.'
        },
        {
            title: 'Google Tag Manager & Custom Events',
            icon: Target,
            desc: 'Pemasangan tag otomatis untuk mencatat setiap klik tombol WhatsApp, pencarian produk, pengisian formulir, hingga pembayaran.'
        },
        {
            title: 'A/B Testing Matrix Berkelanjutan',
            icon: RefreshCw,
            desc: 'Setiap minggu kami melakukan pengujian minimal 3 sudut pandang (angle) ad creative, 2 jenis copywriting, dan variasi audience secara ilmiah.'
        },
        {
            title: 'Real-Time Executive Dashboard Report',
            icon: BarChart3,
            desc: 'Monitoring visual performa bisnis harian & mingguan tanpa ada data yang ditutupi, sehingga keputusan strategi selalu berdasarkan fakta.'
        }
    ];

    return (
        <div className={`min-h-screen font-sans ${bgClass} transition-colors duration-300 selection:bg-[#00A9E7] selection:text-white`}>
            <Head>
                <title>Skema Metode & Funnel Strategy - Genial Digital Solution</title>
                <meta name="description" content="Pelajari skema dan metode strategi digital marketing Genial: mulai dari pembangunan Brand Awareness (TOFU), Edukasi Consideration (MOFU), hingga Retargeting Presisi & Closing Sales (BOFU)." />
            </Head>

            {/* NAVIGATION HEADER */}
            <PublicHeader 
                whatsappNumber={whatsappNumber}
                whatsappDefaultMessage={whatsappDefaultMessage}
                themeMode={themeMode}
                onToggleTheme={toggleTheme}
            />

            {/* HERO BANNER */}
            <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
                
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-[#00A9E7]/20 via-[#2D90CA]/20 to-[#FAD03D]/15 blur-[120px] rounded-full pointer-events-none" />

                <div className="text-center relative z-10 max-w-4xl mx-auto">
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00A9E7]/30 bg-[#00A9E7]/10 text-[#00A9E7] text-xs font-bold mb-6 shadow-sm">
                        <Filter className="w-4 h-4 text-[#FAD03D]" />
                        <span>Data-Driven Digital Marketing Funnel Architecture</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                        Bagaimana <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0]">Cara Kerja & Skema Funnel</span> Iklan Genial?
                    </h1>

                    <p className={`mt-6 text-base sm:text-lg ${textMuted} leading-relaxed max-w-3xl mx-auto`}>
                        Kami tidak mengandalkan keberuntungan atau sekadar <em>"bakar uang iklan"</em>. Seluruh campaign dirancang dengan arsitektur <strong>Marketing Funnel terukur</strong>: membangun jangkauan Awareness, mengedukasi Consideration, melakukan Retargeting presisi tinggi, hingga menghasilkan konversi omset yang konsisten.
                    </p>

                    {/* Funnel Diagram Quick Selector Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-10">
                        {funnelStages.map((stage) => (
                            <button
                                key={stage.id}
                                onClick={() => {
                                    setActiveFunnelStage(stage.id as any);
                                    const el = document.getElementById(stage.id);
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`p-4 rounded-2xl border text-left transition-all ${
                                    activeFunnelStage === stage.id
                                        ? 'bg-gradient-to-r from-[#2D90CA]/20 to-[#00A9E7]/20 border-[#00A9E7] shadow-lg shadow-[#00A9E7]/15 scale-105'
                                        : `${cardBg} hover:border-slate-700`
                                }`}
                            >
                                <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border mb-2 ${stage.badgeColor}`}>
                                    {stage.stageName}
                                </span>
                                <h3 className="text-xs sm:text-sm font-extrabold leading-snug whitespace-normal break-words text-foreground">
                                    {stage.shortTitle}
                                </h3>
                            </button>
                        ))}
                    </div>

                </div>
            </section>

            {/* VISUAL FUNNEL FLOW DIAGRAM */}
            <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                <div className={`p-6 sm:p-10 rounded-3xl border ${cardBg} relative overflow-hidden`}>
                    
                    <div className="text-center mb-8">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#FAD03D]">Skema Diagram Alur Traffic</span>
                        <h2 className="text-2xl font-extrabold mt-1">4-Layer Digital Sales Engine Framework</h2>
                    </div>

                    <div className="space-y-4 max-w-4xl mx-auto relative">
                        
                        {/* Layer 1: TOFU */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#2D90CA]/20 via-[#2D90CA]/10 to-transparent border border-[#2D90CA]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#2D90CA] text-slate-900 font-extrabold flex items-center justify-center shrink-0">
                                    <Eye className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#2D90CA]">STAGE 1</span>
                                        <h3 className="font-extrabold text-base">TOFU - Cold Traffic (Brand Awareness)</h3>
                                    </div>
                                    <p className={`text-xs ${textMuted} mt-0.5`}>Short Video Hooks • Meta & TikTok Ads Broad • Google Search Ads</p>
                                </div>
                            </div>
                            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#2D90CA]/20 text-[#2D90CA] shrink-0 font-mono">
                                100,000+ Impressions
                            </span>
                        </div>

                        {/* Arrow Down */}
                        <div className="flex justify-center text-[#00A9E7]">
                            <ArrowDown className="w-5 h-5 animate-bounce" />
                        </div>

                        {/* Layer 2: MOFU */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#00A9E7]/20 via-[#00A9E7]/10 to-transparent border border-[#00A9E7]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#00A9E7] text-slate-900 font-extrabold flex items-center justify-center shrink-0">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#00A9E7]">STAGE 2</span>
                                        <h3 className="font-extrabold text-base">MOFU - Warm Traffic (Consideration & Demand)</h3>
                                    </div>
                                    <p className={`text-xs ${textMuted} mt-0.5`}>Testimonial Social Proof • High-Converting Landing Page • Engagement Retargeting</p>
                                </div>
                            </div>
                            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#00A9E7]/20 text-[#00A9E7] shrink-0 font-mono">
                                ~15,000 Visitors
                            </span>
                        </div>

                        {/* Arrow Down */}
                        <div className="flex justify-center text-[#FAD03D]">
                            <ArrowDown className="w-5 h-5 animate-bounce" />
                        </div>

                        {/* Layer 3: BOFU */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FAD03D]/20 via-[#FAD03D]/10 to-transparent border border-[#FAD03D]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#FAD03D] text-slate-900 font-extrabold flex items-center justify-center shrink-0">
                                    <Flame className="w-6 h-6 text-slate-900" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#FAD03D]">STAGE 3</span>
                                        <h3 className="font-extrabold text-base">BOFU - Hot Traffic (Precision Retargeting & Closing)</h3>
                                    </div>
                                    <p className={`text-xs ${textMuted} mt-0.5`}>Meta CAPI Pixel • Dynamic Product Ads (DPA) • Scarcity Promo • WA Closing CS</p>
                                </div>
                            </div>
                            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#FAD03D]/20 text-[#FAD03D] shrink-0 font-mono">
                                1,200+ Buyers / Month
                            </span>
                        </div>

                        {/* Arrow Down */}
                        <div className="flex justify-center text-[#05BAF0]">
                            <ArrowDown className="w-5 h-5 animate-bounce" />
                        </div>

                        {/* Layer 4: RETENTION */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#05BAF0]/20 via-[#05BAF0]/10 to-transparent border border-[#05BAF0]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#05BAF0] text-slate-900 font-extrabold flex items-center justify-center shrink-0">
                                    <Repeat className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#05BAF0]">STAGE 4</span>
                                        <h3 className="font-extrabold text-base">RETENTION - Post-Purchase (Repeat Buyer & LTV)</h3>
                                    </div>
                                    <p className={`text-xs ${textMuted} mt-0.5`}>Automated Follow-up • Cross-Sell Broadcast • VIP Customer Reward</p>
                                </div>
                            </div>
                            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#05BAF0]/20 text-[#05BAF0] shrink-0 font-mono">
                                High Repeat Purchase
                            </span>
                        </div>

                    </div>
                </div>
            </section>

            {/* DETAILED FUNNEL STAGE BREAKDOWN */}
            <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
                
                {funnelStages.map((stage) => {
                    const StageIcon = stage.icon;
                    return (
                        <div 
                            key={stage.id} 
                            id={stage.id}
                            className={`p-6 sm:p-10 rounded-3xl border ${cardBg} transition-all duration-300 relative overflow-hidden`}
                        >
                            
                            {/* Header info */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2D90CA] to-[#05BAF0] text-white font-black flex items-center justify-center shadow-lg shadow-[#00A9E7]/20 shrink-0">
                                        <StageIcon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <span className={`inline-block text-xs font-extrabold px-3 py-0.5 rounded-full border mb-1 ${stage.badgeColor}`}>
                                            {stage.stageName}
                                        </span>
                                        <h2 className="text-xl sm:text-2xl font-extrabold">{stage.title}</h2>
                                    </div>
                                </div>
                            </div>

                            <p className={`mt-6 text-sm ${textMuted} leading-relaxed`}>
                                {stage.summary}
                            </p>

                            {/* Sub Strategies Grid */}
                            <div className="grid md:grid-cols-2 gap-6 mt-8">
                                {stage.strategies.map((strat, idx) => (
                                    <div key={idx} className={`p-5 rounded-2xl ${cardInnerBg} border border-slate-800/80`}>
                                        <div className="flex items-center gap-2.5 mb-2">
                                            <CheckCircle2 className="w-5 h-5 text-[#00A9E7] shrink-0" />
                                            <h3 className="font-bold text-sm">{strat.title}</h3>
                                        </div>
                                        <p className={`text-xs ${textMuted} leading-relaxed pl-7`}>
                                            {strat.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* KPI Banner Footer */}
                            <div className="mt-8 p-4 rounded-2xl bg-[#00A9E7]/10 border border-[#00A9E7]/30 flex items-center gap-3 text-xs text-[#00A9E7] font-semibold">
                                <Target className="w-5 h-5 shrink-0" />
                                <span>{stage.kpi}</span>
                            </div>

                        </div>
                    );
                })}

            </section>

            {/* ANALYTICS & TRACKING INFRASTRUCTURE SECTION */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/40">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A9E7]/10 border border-[#00A9E7]/30 text-[#00A9E7] text-xs font-bold uppercase tracking-wider mb-3">
                        <span>Fasilitas Teknis Advanced</span>
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-extrabold">Infrastruktur Tracking & Data-Driven Engine</h2>
                    <p className={`mt-2 text-sm ${textMuted}`}>Seluruh metode funnel diperkuat dengan sistem data akurat untuk hasil maksimal</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {analyticsInfrastructure.map((item, i) => {
                        const IconTech = item.icon;
                        return (
                            <div key={i} className={`p-6 rounded-3xl border ${cardBg}`}>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2D90CA]/20 to-[#05BAF0]/20 text-[#00A9E7] flex items-center justify-center mb-4">
                                    <IconTech className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                                <p className={`text-xs ${textMuted} leading-relaxed`}>{item.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* CTA BANNER */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className={`p-8 sm:p-12 lg:p-16 rounded-3xl bg-gradient-to-r from-[#0c1322] via-[#050914] to-[#000000] border border-[#2D90CA]/40 text-center relative overflow-hidden shadow-2xl`}>
                    
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#00A9E7]/15 blur-[100px] rounded-full pointer-events-none" />
                    
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                        Ingin Menerapkan Funnel Ini pada <span className="text-[#00A9E7]">Bisnis Anda</span>?
                    </h2>
                    
                    <p className="mt-4 text-sm text-slate-300 max-w-2xl mx-auto">
                        Tim Media Buyer & Content Strategist Genial siap membedah struktur funnel bisnis Anda dan menyusun arsitektur iklan khusus berpotensi omset tinggi.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a 
                            href={waUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-extrabold text-slate-900 bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] hover:opacity-95 transition-all shadow-xl shadow-[#00A9E7]/30 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <PhoneCall className="w-5 h-5" />
                            <span>Diskusi Funnel Iklan via WhatsApp</span>
                        </a>

                        <a 
                            href="/activation"
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-slate-200 border border-slate-700 bg-slate-900/60 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            <span>Lihat Panduan Cara Aktivasi</span>
                        </a>
                    </div>

                </div>
            </section>

            {/* FOOTER */}
            <PublicFooter themeMode={themeMode} />

        </div>
    );
}
