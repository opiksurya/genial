import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Palette,
    Video,
    Sparkles,
    Plus,
    Search,
    Edit3,
    Trash2,
    Calculator,
    Copy,
    Check,
    CheckCircle2,
    Clock,
    FileText,
    Mic,
    Tv,
    TrendingUp,
    Percent,
    ShieldAlert,
    Info,
    RefreshCw,
    X,
    Filter,
    Layers,
    Receipt,
    DollarSign,
    Share2,
    Zap,
    Tag,
    ChevronRight,
    ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';

interface CreativeService {
    id: number;
    name: string;
    category: string;
    format: string;
    description?: string | null;
    deliverables?: string | null;
    client_price: number;
    freelancer_cost: number;
    unit: string;
    turnaround_days: number;
    is_active: boolean;
    sort_order: number;
    estimated_margin?: number;
}

interface Stats {
    total_components: number;
    active_components: number;
    video_components: number;
    design_components: number;
    average_margin: number;
    total_categories: number;
}

interface PageProps {
    services: CreativeService[];
    allServices: CreativeService[];
    categories: string[];
    formats: string[];
    currentCategory: string;
    currentFormat: string;
    search: string;
    stats: Stats;
}

interface CartItem {
    service: CreativeService;
    quantity: number;
    customNote?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Katalog Digital Kreatif & Rate Card', href: '/creative-services' },
];

export default function CreativeServicesIndex({
    services = [],
    allServices = [],
    categories = [],
    formats = [],
    currentCategory = 'all',
    currentFormat = 'all',
    search = '',
    stats,
}: PageProps) {
    const [activeTab, setActiveTab] = useState<'catalog' | 'calculator'>('catalog');
    const [selectedCategory, setSelectedCategory] = useState<string>(currentCategory);
    const [selectedFormat, setSelectedFormat] = useState<string>(currentFormat);
    const [searchQuery, setSearchQuery] = useState<string>(search);

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<CreativeService | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<CreativeService | null>(null);

    // Calculator / Estimator State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [clientName, setClientName] = useState<string>('');
    const [projectName, setProjectName] = useState<string>('');
    const [copiedQuote, setCopiedQuote] = useState(false);

    // Form for Add/Edit
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        category: 'Video Production',
        format: 'Video',
        description: '',
        deliverables: '',
        client_price: 350000,
        freelancer_cost: 150000,
        unit: 'per video',
        turnaround_days: 2,
        is_active: true,
        sort_order: 0,
    });

    const formatRupiah = (val: number | string | null | undefined) => {
        const num = typeof val === 'string' ? parseFloat(val) : Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(isNaN(num) ? 0 : num);
    };

    // Filter services locally for immediate response
    const filteredServices = useMemo(() => {
        return services.filter((item) => {
            const matchesCategory =
                selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
            const matchesFormat =
                selectedFormat === 'all' || item.format.toLowerCase() === selectedFormat.toLowerCase();
            const matchesSearch =
                !searchQuery ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.deliverables && item.deliverables.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesCategory && matchesFormat && matchesSearch;
        });
    }, [services, selectedCategory, selectedFormat, searchQuery]);

    // Calculator calculations
    const calculatorSummary = useMemo(() => {
        let totalClientPrice = 0;
        let totalFreelancerCost = 0;
        let totalItems = 0;
        let maxTurnaround = 0;

        cart.forEach((item) => {
            const clientP = Number(item.service.client_price || 0) * item.quantity;
            const freelancerC = Number(item.service.freelancer_cost || 0) * item.quantity;
            totalClientPrice += clientP;
            totalFreelancerCost += freelancerC;
            totalItems += item.quantity;
            if (item.service.turnaround_days > maxTurnaround) {
                maxTurnaround = item.service.turnaround_days;
            }
        });

        const grossProfit = totalClientPrice - totalFreelancerCost;
        const profitMargin = totalClientPrice > 0 ? (grossProfit / totalClientPrice) * 100 : 0;

        return {
            totalClientPrice,
            totalFreelancerCost,
            grossProfit,
            profitMargin: profitMargin.toFixed(1),
            totalItems,
            estimatedDays: maxTurnaround,
        };
    }, [cart]);

    // Cart / Estimator Handlers
    const addToCart = (service: CreativeService) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.service.id === service.id);
            if (existing) {
                return prev.map((item) =>
                    item.service.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { service, quantity: 1 }];
        });
        toast.success(`"${service.name}" ditambahkan ke Kalkulator Estimasi`);
    };

    const updateCartQuantity = (serviceId: number, delta: number) => {
        setCart((prev) => {
            return prev
                .map((item) => {
                    if (item.service.id === serviceId) {
                        const newQty = item.quantity + delta;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[];
        });
    };

    const removeFromCart = (serviceId: number) => {
        setCart((prev) => prev.filter((item) => item.service.id !== serviceId));
    };

    const clearCart = () => {
        setCart([]);
        toast.info('Kalkulator berhasil direset');
    };

    // Generate WhatsApp Quotation Text
    const generateQuotationText = () => {
        if (cart.length === 0) return '';

        let text = `*ESTIMASI PENAWARAN PRODUKSI KONTEN & KREATIF*\n`;
        text += `*GENIAL DIGITAL SOLUTION*\n`;
        text += `────────────────────────────\n`;
        if (clientName) text += `*Klien / Brand:* ${clientName}\n`;
        if (projectName) text += `*Paket / Campaign:* ${projectName}\n`;
        text += `*Tanggal:* ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
        text += `*RINCIAN KOMPONEN KREATIF:*\n`;

        cart.forEach((item, idx) => {
            const subtotal = Number(item.service.client_price) * item.quantity;
            text += `${idx + 1}. *${item.service.name}*\n`;
            text += `   • Jumlah: ${item.quantity} ${item.service.unit}\n`;
            text += `   • Harga Satuan: ${formatRupiah(item.service.client_price)}\n`;
            text += `   • Subtotal: *${formatRupiah(subtotal)}*\n`;
            if (item.service.deliverables) {
                text += `   • Output: ${item.service.deliverables}\n`;
            }
            text += `\n`;
        });

        text += `────────────────────────────\n`;
        text += `*TOTAL ESTIMASI HARGA:* ${formatRupiah(calculatorSummary.totalClientPrice)}\n`;
        text += `*Estimasi Waktu Pengerjaan:* ~${calculatorSummary.estimatedDays} Hari Kerja\n\n`;
        text += `*Catatan & Ketentuan:*\n`;
        text += `• Sudah termasuk revisi minor (2x)\n`;
        text += `• Termasuk color grading, audio SFX & hook text dinamis\n`;
        text += `• DP 50% saat brief disepakati, pelunasan saat file final siap serah terima.\n\n`;
        text += `Terima kasih! 🙏\n_Genial Digital Solution - Your Strategic Growth Partner_`;

        return text;
    };

    const copyQuotationToClipboard = () => {
        const text = generateQuotationText();
        if (!text) {
            toast.error('Pilih minimal 1 komponen kreatif terlebih dahulu.');
            return;
        }
        navigator.clipboard.writeText(text);
        setCopiedQuote(true);
        toast.success('Rincian penawaran disalin ke clipboard! Siap kirim via WhatsApp.');
        setTimeout(() => setCopiedQuote(false), 3000);
    };

    // Open Modal for Create
    const openCreateModal = () => {
        reset();
        setEditingService(null);
        setIsAddModalOpen(true);
    };

    // Open Modal for Edit
    const openEditModal = (service: CreativeService) => {
        setEditingService(service);
        setData({
            name: service.name,
            category: service.category,
            format: service.format,
            description: service.description || '',
            deliverables: service.deliverables || '',
            client_price: Number(service.client_price),
            freelancer_cost: Number(service.freelancer_cost),
            unit: service.unit,
            turnaround_days: service.turnaround_days,
            is_active: service.is_active,
            sort_order: service.sort_order,
        });
        setIsAddModalOpen(true);
    };

    // Submit Create/Edit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingService) {
            put(`/creative-services/${editingService.id}`, {
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    toast.success('Komponen kreatif berhasil diperbarui');
                },
            });
        } else {
            post('/creative-services', {
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    reset();
                    toast.success('Komponen kreatif berhasil ditambahkan');
                },
            });
        }
    };

    // Toggle Active Status
    const handleToggleActive = (service: CreativeService) => {
        post(`/creative-services/${service.id}/toggle`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Status ${service.name} berhasil diubah`);
            },
        });
    };

    // Delete Item
    const confirmDelete = (service: CreativeService) => {
        setServiceToDelete(service);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!serviceToDelete) return;
        router.delete(`/creative-services/${serviceToDelete.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setServiceToDelete(null);
                toast.success('Komponen kreatif berhasil dihapus');
            },
        });
    };

    const getFormatIcon = (fmt: string) => {
        switch (fmt.toLowerCase()) {
            case 'video':
                return <Video className="w-4 h-4 text-emerald-500" />;
            case 'carousel':
                return <Layers className="w-4 h-4 text-blue-500" />;
            case 'image':
            case 'single post':
                return <Palette className="w-4 h-4 text-purple-500" />;
            case 'script':
                return <FileText className="w-4 h-4 text-amber-500" />;
            case 'voiceover':
                return <Mic className="w-4 h-4 text-rose-500" />;
            case 'live':
                return <Tv className="w-4 h-4 text-orange-500" />;
            default:
                return <Sparkles className="w-4 h-4 text-primary" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Katalog Digital Kreatif & Rate Card" />

            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-card via-card to-primary/5 p-6 rounded-2xl border border-border/80 shadow-sm relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                    <div className="space-y-1.5 relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Database Layanan & Rate Card Kreatif
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            Katalog Komponen Digital Kreatif
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-2xl">
                            Database standar deliverables, harga jual klien, dan standar upah freelancer. Pilih komponen apa saja untuk hitung estimasi harga otomatis secara instan.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 relative z-10 flex-wrap">
                        <button
                            onClick={() => setActiveTab(activeTab === 'catalog' ? 'calculator' : 'catalog')}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                                activeTab === 'calculator'
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                                    : 'bg-card border border-border hover:bg-muted text-foreground'
                            }`}
                        >
                            <Calculator className="w-4 h-4" />
                            <span>Kalkulator Estimasi {cart.length > 0 && `(${cart.length})`}</span>
                        </button>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Komponen</span>
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Total Komponen</span>
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Sparkles className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-bold text-foreground">{stats?.total_components || 0}</span>
                            <span className="text-xs text-muted-foreground ml-2">Layanan Aktif: {stats?.active_components || 0}</span>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Video Production</span>
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <Video className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-bold text-foreground">{stats?.video_components || 0}</span>
                            <span className="text-xs text-muted-foreground ml-2">Format Video</span>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Desain & Foto</span>
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                <Palette className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-bold text-foreground">{stats?.design_components || 0}</span>
                            <span className="text-xs text-muted-foreground ml-2">Katalog & Carousel</span>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Rata-rata Margin</span>
                            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-bold text-foreground">{stats?.average_margin || 0}%</span>
                            <span className="text-xs text-emerald-600 font-medium ml-2">Gross Profit</span>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-2 border-b border-border pb-1">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-all ${
                            activeTab === 'catalog'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        <span>Katalog & Rate Card</span>
                        <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold">
                            {filteredServices.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('calculator')}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-all ${
                            activeTab === 'calculator'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Calculator className="w-4 h-4" />
                        <span>Kalkulator & Estimator Harga Otomatis</span>
                        {cart.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold animate-pulse">
                                {cart.length} item
                            </span>
                        )}
                    </button>
                </div>

                {/* ========================================================================= */}
                {/* TAB 1: KATALOG & RATE CARD */}
                {/* ========================================================================= */}
                {activeTab === 'catalog' && (
                    <div className="space-y-6">
                        {/* Search & Filter Toolbar */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-sm">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Cari komponen, deliverables, format video, photoshoot, UGC..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>

                            {/* Filter by Category */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 shrink-0">
                                    <Filter className="w-3.5 h-3.5" /> Kategori:
                                </span>
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                                        selectedCategory === 'all'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    Semua
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                                            selectedCategory === cat
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Services Grid */}
                        {filteredServices.length === 0 ? (
                            <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl p-8">
                                <ShoppingBag className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-foreground">Tidak Ada Komponen Ditemukan</h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-4">
                                    Coba ubah kata kunci pencarian atau filter kategori untuk melihat komponen kreatif lainnya.
                                </p>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('all');
                                        setSelectedFormat('all');
                                        setSearchQuery('');
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium"
                                >
                                    <RefreshCw className="w-4 h-4" /> Reset Filter
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filteredServices.map((service) => {
                                    const grossProfit = Number(service.client_price) - Number(service.freelancer_cost);
                                    const marginPercent =
                                        service.client_price > 0
                                            ? Math.round((grossProfit / Number(service.client_price)) * 100)
                                            : 0;

                                    return (
                                        <div
                                            key={service.id}
                                            className={`group bg-card border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40 flex flex-col justify-between relative overflow-hidden ${
                                                !service.is_active ? 'opacity-60 bg-muted/30 border-dashed' : 'border-border'
                                            }`}
                                        >
                                            <div className="space-y-3">
                                                {/* Header & Badges */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-[11px] font-semibold text-foreground border border-border">
                                                            {getFormatIcon(service.format)}
                                                            {service.format}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground font-medium bg-primary/5 px-2 py-0.5 rounded-full">
                                                            {service.category}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => openEditModal(service)}
                                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                            title="Edit Komponen"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(service)}
                                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                            title="Hapus Komponen"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Title & Description */}
                                                <div>
                                                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                                                        {service.name}
                                                    </h3>
                                                    {service.description && (
                                                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                                                            {service.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Deliverables / Output Specs */}
                                                {service.deliverables && (
                                                    <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50 text-[11px] space-y-1">
                                                        <span className="font-semibold text-foreground/80 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                            Deliverables & Spek:
                                                        </span>
                                                        <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                                                            {service.deliverables}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pricing Box & CTA */}
                                            <div className="mt-4 pt-4 border-t border-border/70 space-y-3">
                                                {/* Client Price & Freelancer Cost */}
                                                <div className="grid grid-cols-2 gap-2 bg-gradient-to-br from-muted/50 to-muted/20 p-2.5 rounded-xl border border-border/60">
                                                    <div>
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                                                            Harga Jual Klien
                                                        </span>
                                                        <span className="text-sm font-extrabold text-foreground">
                                                            {formatRupiah(service.client_price)}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground block">
                                                            {service.unit}
                                                        </span>
                                                    </div>

                                                    <div className="border-l border-border/60 pl-2">
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                                                            Upah Freelancer
                                                        </span>
                                                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                            {formatRupiah(service.freelancer_cost)}
                                                        </span>
                                                        <span className="text-[10px] text-emerald-600/80 font-medium block">
                                                            Margin ~{marginPercent}%
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Turnaround & Add to Estimator Button */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                                        <Clock className="w-3.5 h-3.5" /> ~{service.turnaround_days} hari pengerjaan
                                                    </span>

                                                    <button
                                                        onClick={() => addToCart(service)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-all shadow-sm"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>Pilih / Hitung</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* TAB 2: KALKULATOR & ESTIMATOR HARGA OTOMATIS */}
                {/* ========================================================================= */}
                {activeTab === 'calculator' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Component Picker */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                                            <ShoppingBag className="w-5 h-5 text-primary" />
                                            Pilih Komponen Digital Kreatif
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            Klik tombol (+) pada komponen yang ingin dibuat untuk menghitung biaya secara otomatis.
                                        </p>
                                    </div>

                                    <div className="relative w-48">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Cari..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 bg-background border border-input rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                {/* Category filter pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                    <button
                                        onClick={() => setSelectedCategory('all')}
                                        className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 transition-all ${
                                            selectedCategory === 'all'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Semua
                                    </button>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 transition-all ${
                                                selectedCategory === cat
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Component List */}
                                <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                                    {filteredServices.map((service) => {
                                        const inCart = cart.find((c) => c.service.id === service.id);
                                        return (
                                            <div
                                                key={service.id}
                                                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                                    inCart
                                                        ? 'border-primary/50 bg-primary/5 shadow-sm'
                                                        : 'border-border bg-background hover:border-primary/30'
                                                }`}
                                            >
                                                <div className="space-y-1 flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm text-foreground truncate">
                                                            {service.name}
                                                        </span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                                                            {service.unit}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="font-bold text-foreground">
                                                            {formatRupiah(service.client_price)}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="text-emerald-600 font-medium">
                                                            Upah: {formatRupiah(service.freelancer_cost)}
                                                        </span>
                                                        <span>•</span>
                                                        <span>~{service.turnaround_days} hari</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {inCart ? (
                                                        <div className="flex items-center gap-1.5 bg-background border border-primary/40 rounded-lg p-1">
                                                            <button
                                                                onClick={() => updateCartQuantity(service.id, -1)}
                                                                className="w-6 h-6 rounded bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-bold"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-6 text-center text-xs font-bold text-primary">
                                                                {inCart.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateCartQuantity(service.id, 1)}
                                                                className="w-6 h-6 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center text-sm font-bold"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => addToCart(service)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-all"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            <span>Pilih</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Live Calculation Summary & WhatsApp Quotation */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5 sticky top-6">
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="w-5 h-5 text-emerald-500" />
                                        <h3 className="font-bold text-base text-foreground">Ringkasan Estimasi Biaya</h3>
                                    </div>
                                    {cart.length > 0 && (
                                        <button
                                            onClick={clearCart}
                                            className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                                        >
                                            <RefreshCw className="w-3 h-3" /> Reset
                                        </button>
                                    )}
                                </div>

                                {/* Client / Campaign Details */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                            Nama Klien / Brand (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Skincare Glow"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            className="w-full px-2.5 py-1.5 bg-background border border-input rounded-lg text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                                            Nama Project / Bulan (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Campaign Ramadhan"
                                            value={projectName}
                                            onChange={(e) => setProjectName(e.target.value)}
                                            className="w-full px-2.5 py-1.5 bg-background border border-input rounded-lg text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Cart Items Breakdown */}
                                {cart.length === 0 ? (
                                    <div className="text-center py-8 bg-muted/30 border border-dashed border-border rounded-xl p-4">
                                        <Calculator className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground font-medium">
                                            Belum ada komponen yang dipilih.
                                        </p>
                                        <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                                            Pilih layanan dari daftar di sebelah kiri untuk melihat rincian harga & estimasi otomatis.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {cart.map((item) => {
                                            const subtotal = Number(item.service.client_price) * item.quantity;
                                            return (
                                                <div
                                                    key={item.service.id}
                                                    className="flex items-center justify-between text-xs bg-muted/40 p-2 rounded-lg border border-border/60"
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <span className="font-semibold text-foreground truncate block">
                                                            {item.service.name}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {item.quantity} {item.service.unit} × {formatRupiah(item.service.client_price)}
                                                        </span>
                                                    </div>

                                                    <div className="text-right shrink-0 flex items-center gap-2">
                                                        <span className="font-bold text-foreground">
                                                            {formatRupiah(subtotal)}
                                                        </span>
                                                        <button
                                                            onClick={() => removeFromCart(item.service.id)}
                                                            className="text-muted-foreground hover:text-destructive p-0.5"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Realtime Totals Box */}
                                <div className="p-4 rounded-xl bg-gradient-to-br from-card to-primary/5 border border-primary/20 space-y-3">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Total Komponen Terpilih:</span>
                                        <span className="font-semibold text-foreground">
                                            {calculatorSummary.totalItems} Komponen
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Estimasi Biaya Freelancer:</span>
                                        <span className="font-semibold text-emerald-600">
                                            {formatRupiah(calculatorSummary.totalFreelancerCost)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Estimasi Margin Laba Bersih:</span>
                                        <span className="font-bold text-teal-600 flex items-center gap-1">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            {formatRupiah(calculatorSummary.grossProfit)} ({calculatorSummary.profitMargin}%)
                                        </span>
                                    </div>

                                    <div className="pt-2 border-t border-border flex items-baseline justify-between">
                                        <span className="font-bold text-sm text-foreground">Total Harga Jual (Klien):</span>
                                        <span className="text-xl font-extrabold text-primary">
                                            {formatRupiah(calculatorSummary.totalClientPrice)}
                                        </span>
                                    </div>

                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1">
                                        <Clock className="w-3.5 h-3.5 text-primary" />
                                        <span>Estimasi Durasi: <strong>~{calculatorSummary.estimatedDays} Hari Kerja</strong></span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-1">
                                    <button
                                        onClick={copyQuotationToClipboard}
                                        disabled={cart.length === 0}
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
                                    >
                                        {copiedQuote ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        <span>{copiedQuote ? 'Tersalin ke Clipboard!' : 'Salin Penawaran WhatsApp'}</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            router.visit('/content-calendar');
                                        }}
                                        className="w-full py-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Share2 className="w-3.5 h-3.5 text-primary" />
                                        <span>Buka Kalender Konten untuk Eksekusi</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* MODAL: TAMBAH / EDIT KOMPONEN KREATIF */}
            {/* ========================================================================= */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="space-y-1">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                {editingService ? 'Edit Komponen Kreatif' : 'Tambah Komponen Digital Kreatif'}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Masukkan nama layanan, deliverables standar, harga jual ke klien, dan upah freelancer.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nama Komponen */}
                            <div>
                                <label className="text-xs font-semibold text-foreground block mb-1">
                                    Nama Komponen Kreatif <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Video Reels / TikTok Hook Dinamis (30-60s)"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {errors.name && <p className="text-destructive text-[11px] mt-1">{errors.name}</p>}
                            </div>

                            {/* Kategori & Format */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-1">
                                        Kategori <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs"
                                    >
                                        <option value="Video Production">Video Production</option>
                                        <option value="Photo & Design">Photo & Design</option>
                                        <option value="UGC & Talent">UGC & Talent</option>
                                        <option value="Copywriting & Script">Copywriting & Script</option>
                                        <option value="Motion & 3D">Motion & 3D</option>
                                        <option value="Live Streaming">Live Streaming</option>
                                        <option value="Web & Landing Page">Web & Landing Page</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-1">
                                        Format Konten <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={data.format}
                                        onChange={(e) => setData('format', e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs"
                                    >
                                        <option value="Video">Video</option>
                                        <option value="Carousel">Carousel</option>
                                        <option value="Image">Image / Single Post</option>
                                        <option value="Story">Story</option>
                                        <option value="Script">Script / Naskah</option>
                                        <option value="VoiceOver">Voice Over</option>
                                        <option value="Live">Live Streaming</option>
                                        <option value="Other">Lainnya</option>
                                    </select>
                                </div>
                            </div>

                            {/* Pricing: Client Price & Freelancer Cost */}
                            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border">
                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-1">
                                        Harga Jual Klien (Rp) <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="5000"
                                        value={data.client_price}
                                        onChange={(e) => setData('client_price', Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs font-bold"
                                    />
                                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                                        {formatRupiah(data.client_price)}
                                    </span>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-1">
                                        Upah Freelancer (Rp) <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="5000"
                                        value={data.freelancer_cost}
                                        onChange={(e) => setData('freelancer_cost', Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs font-bold text-emerald-600"
                                    />
                                    <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
                                        Margin: {formatRupiah(data.client_price - data.freelancer_cost)}
                                    </span>
                                </div>
                            </div>

                            {/* Satuan & Turnaround Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-1">
                                        Satuan / Unit <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="per video, per 10 foto, per carousel..."
                                        value={data.unit}
                                        onChange={(e) => setData('unit', e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-foreground block mb-1">
                                        Estimasi Durasi (Hari Kerja)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={data.turnaround_days}
                                        onChange={(e) => setData('turnaround_days', parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs"
                                    />
                                </div>
                            </div>

                            {/* Deliverables & Output Specs */}
                            <div>
                                <label className="text-xs font-semibold text-foreground block mb-1">
                                    Deliverables & Spesifikasi Teknis
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Contoh: MP4 1080x1920 (9:16), Color Graded, SFX, Subtitle Hook, 2x Revisi Minor"
                                    value={data.deliverables}
                                    onChange={(e) => setData('deliverables', e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs"
                                />
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="text-xs font-semibold text-foreground block mb-1">
                                    Deskripsi Layanan (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Penjelasan singkat konsep konten atau cara eksekusi..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs"
                                />
                            </div>

                            {/* Status Aktif */}
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-input text-primary focus:ring-primary"
                                />
                                <label htmlFor="is_active" className="text-xs font-medium text-foreground cursor-pointer">
                                    Aktifkan komponen ini di katalog & kalender konten
                                </label>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : editingService ? 'Simpan Perubahan' : 'Tambah ke Database'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: KONFIRMASI HAPUS */}
            {/* ========================================================================= */}
            {isDeleteModalOpen && serviceToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
                        <div className="flex items-center gap-3 text-destructive">
                            <div className="p-2.5 rounded-full bg-destructive/10">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-foreground">Hapus Komponen Kreatif?</h3>
                                <p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Apakah Anda yakin ingin menghapus komponen <strong>"{serviceToDelete.name}"</strong> dari database?
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold text-xs hover:bg-destructive/90 transition-all shadow-md shadow-destructive/20"
                            >
                                Ya, Hapus Komponen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
