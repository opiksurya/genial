import React, { useState } from 'react';
import { 
    X, 
    Sparkles, 
    Loader2, 
    Calendar as CalendarIcon, 
    Layers, 
    Wand2, 
    Bot, 
    Cpu, 
    Check, 
    HelpCircle,
    SlidersHorizontal,
    Share2,
    Palette,
    Plus
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface ProjectOption {
    id: number;
    name: string;
    client?: string;
}

interface GeneratePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMonth: number;
    currentYear: number;
    projects: ProjectOption[];
    aiSettings: {
        default_provider: string;
        gemini_api_key_set: boolean;
        claude_api_key_set: boolean;
        openai_api_key_set: boolean;
        openrouter_api_key_set: boolean;
        gemini_model: string;
        claude_model: string;
        openai_model: string;
    };
    onOpenAiSettings: () => void;
}

export function GeneratePlanModal({
    isOpen,
    onClose,
    currentMonth,
    currentYear,
    projects = [],
    aiSettings,
    onOpenAiSettings
}: GeneratePlanModalProps) {
    const [month, setMonth] = useState<number>(Number(currentMonth) || 9);
    const [year, setYear] = useState<number>(Number(currentYear) || 2026);
    const [brandName, setBrandName] = useState<string>('Hoof ID');
    const [niche, setNiche] = useState<string>('Pabrik Konveksi, Sablon Kaos & Apparel Garmen');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [platforms, setPlatforms] = useState<string[]>(['TikTok', 'Shopee Video', 'Instagram Reels']);
    const [frequency, setFrequency] = useState<string>('daily');
    const [pillars, setPillars] = useState<string[]>([
        'Product Showcase', 
        'Edukasi', 
        'Behind The Scene', 
        'Promo', 
        'Testimonial',
        'Tren'
    ]);
    const [tone, setTone] = useState<string>('Kasual, Edukatif & Persuasif');
    const [customPrompt, setCustomPrompt] = useState<string>('Fokus promo mega konveksi dan edukasi bahan kaos.');
    const [provider, setProvider] = useState<string>(aiSettings?.default_provider || 'gemini');
    const [customApiKey, setCustomApiKey] = useState<string>('');
    const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const availablePlatforms = [
        'TikTok',
        'Instagram Reels',
        'Shopee Video',
        'YouTube Shorts',
        'Instagram Feed'
    ];

    const [customPillarInput, setCustomPillarInput] = useState<string>('');
    const [allPillars, setAllPillars] = useState<string[]>([
        'Product Showcase',
        'Edukasi',
        'Behind The Scene',
        'Promo',
        'Testimonial',
        'Tips & Trik',
        'Tren'
    ]);

    if (!isOpen) return null;

    const handleAddCustomPillar = () => {
        const trimmed = customPillarInput.trim();
        if (!trimmed) return;
        if (!allPillars.includes(trimmed)) {
            setAllPillars([...allPillars, trimmed]);
        }
        if (!pillars.includes(trimmed)) {
            setPillars([...pillars, trimmed]);
        }
        setCustomPillarInput('');
        toast.success(`Pilar kustom "${trimmed}" ditambahkan & diaktifkan!`);
    };

    const handleRemoveCustomPillar = (p: string) => {
        setAllPillars(allPillars.filter(item => item !== p));
        setPillars(pillars.filter(item => item !== p));
    };

    const togglePlatform = (p: string) => {
        if (platforms.includes(p)) {
            if (platforms.length === 1) {
                toast.error('Minimal pilih 1 platform target');
                return;
            }
            setPlatforms(platforms.filter(item => item !== p));
        } else {
            setPlatforms([...platforms, p]);
        }
    };

    const togglePillar = (p: string) => {
        if (pillars.includes(p)) {
            if (pillars.length === 1) {
                toast.error('Minimal pilih 1 pilar konten');
                return;
            }
            setPillars(pillars.filter(item => item !== p));
        } else {
            setPillars([...pillars, p]);
        }
    };

    const handleProjectChange = (projectIdStr: string) => {
        setSelectedProjectId(projectIdStr);
        if (projectIdStr) {
            const proj = projects.find(p => p.id === Number(projectIdStr));
            if (proj) {
                setBrandName(proj.client || proj.name);
            }
        }
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        router.post('/content-calendar/generate-ai', {
            month,
            year,
            brand_name: brandName,
            niche,
            project_id: selectedProjectId ? Number(selectedProjectId) : null,
            platforms,
            frequency,
            pillars,
            tone,
            custom_prompt: customPrompt,
            provider,
            api_key: customApiKey || undefined,
            replace_existing: replaceExisting,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsGenerating(false);
                toast.success('Kalender konten berhasil di-generate!');
                onClose();
            },
            onError: (err) => {
                setIsGenerating(false);
                toast.error('Gagal generate kalender konten. Periksa konfigurasi.');
            }
        });
    };

    const isApiKeyConfigured = (prov: string) => {
        if (prov === 'gemini') return aiSettings.gemini_api_key_set;
        if (prov === 'claude') return aiSettings.claude_api_key_set;
        if (prov === 'openai') return aiSettings.openai_api_key_set;
        if (prov === 'openrouter') return aiSettings.openrouter_api_key_set;
        return false;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-primary/5 via-purple-500/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-md shadow-primary/20">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                AI Content Calendar Generator
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Generate rencana konten 1 bulan penuh otomatis dengan Gemini / Claude AI
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Period & Target Brand */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                                Bulan & Tahun
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value={1}>Januari</option>
                                    <option value={2}>Februari</option>
                                    <option value={3}>Maret</option>
                                    <option value={4}>April</option>
                                    <option value={5}>Mei</option>
                                    <option value={6}>Juni</option>
                                    <option value={7}>Juli</option>
                                    <option value={8}>Agustus</option>
                                    <option value={9}>September</option>
                                    <option value={10}>Oktober</option>
                                    <option value={11}>November</option>
                                    <option value={12}>Desember</option>
                                </select>
                                <select
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value={2025}>2025</option>
                                    <option value={2026}>2026</option>
                                    <option value={2027}>2027</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Pilih Project Klien (Opsional)
                            </label>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => handleProjectChange(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="">-- Brand Baru / Custom --</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.client ? `(${p.client})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Brand & Niche */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Nama Brand / Bisnis
                            </label>
                            <input
                                type="text"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                placeholder="Contoh: Hoof ID"
                                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Industri / Niche Bisnis
                            </label>
                            <input
                                type="text"
                                value={niche}
                                onChange={(e) => setNiche(e.target.value)}
                                placeholder="Contoh: Pabrik Konveksi & Sablon Garmen"
                                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Target Platforms */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5 text-primary" />
                            Target Platform Sosial Media
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availablePlatforms.map((p) => {
                                const active = platforms.includes(p);
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => togglePlatform(p)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                            active
                                                ? 'bg-primary text-white shadow-sm shadow-primary/30 border border-primary'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent'
                                        }`}
                                    >
                                        {active && <Check className="w-3 h-3" />}
                                        <span>{p}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Posting Frequency & Tone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Frekuensi Posting
                            </label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="daily">Setiap Hari (1 Bulan Penuh ~30 Konten)</option>
                                <option value="weekdays">Hari Kerja (Senin - Jumat ~22 Konten)</option>
                                <option value="3x_week">3x Seminggu (Senin, Rabu, Jumat ~13 Konten)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Tone of Voice
                            </label>
                            <input
                                type="text"
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                placeholder="Kasual, Edukatif, Persuasif, Enerjik"
                                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Content Pillars */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-primary" />
                                Pilar Konten & Tema
                            </label>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {pillars.length} pilar terpilih
                            </span>
                        </div>

                        {/* Pills list */}
                        <div className="flex flex-wrap gap-2">
                            {allPillars.map((pil) => {
                                const active = pillars.includes(pil);
                                const isDefault = ['Product Showcase', 'Edukasi', 'Behind The Scene', 'Promo', 'Testimonial', 'Tips & Trik', 'Tren'].includes(pil);
                                return (
                                    <div
                                        key={pil}
                                        className={`inline-flex items-center rounded-xl text-xs font-semibold transition-all ${
                                            active
                                                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30 border border-purple-600'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => togglePillar(pil)}
                                            className="px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
                                        >
                                            {active && <Check className="w-3 h-3" />}
                                            <span>{pil}</span>
                                        </button>
                                        {!isDefault && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCustomPillar(pil)}
                                                className="pr-2 pl-0.5 py-1.5 text-purple-200 hover:text-white transition-all cursor-pointer"
                                                title="Hapus pilar kustom"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Custom Pillar Input Bar */}
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="text"
                                value={customPillarInput}
                                onChange={(e) => setCustomPillarInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCustomPillar();
                                    }
                                }}
                                placeholder="Tambah pilar kustom (misal: Myth Busting, Q&A, Meme, Storytelling)..."
                                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button
                                type="button"
                                onClick={handleAddCustomPillar}
                                disabled={!customPillarInput.trim()}
                                className="px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Pilar</span>
                            </button>
                        </div>
                    </div>

                    {/* Custom Campaign / Event Focus */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>Instruksi Khusus / Campaign / Promo Bulan Ini</span>
                            <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                        </label>
                        <textarea
                            rows={3}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Contoh: Fokuskan konten promo 7.7 di minggu pertama, edukasi kain taslan dan cotton combed 24s, adakan Q&A di akhir bulan..."
                            className="w-full p-3 text-xs leading-relaxed bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                        />
                    </div>

                    {/* AI Provider & Engine */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Bot className="w-4 h-4 text-primary" />
                                AI Engine & Model API
                            </span>
                            <button
                                type="button"
                                onClick={onOpenAiSettings}
                                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <SlidersHorizontal className="w-3 h-3" />
                                <span>Kelola API Keys</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${provider === 'gemini' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                <input
                                    type="radio"
                                    name="provider"
                                    value="gemini"
                                    checked={provider === 'gemini'}
                                    onChange={(e) => setProvider(e.target.value)}
                                    className="text-primary focus:ring-primary"
                                />
                                <div className="text-xs">
                                    <div className="font-bold">Google Gemini</div>
                                    <div className="text-[10px] text-slate-500">Gemini 2.0 / 1.5 Flash</div>
                                </div>
                            </label>

                            <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${provider === 'claude' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                <input
                                    type="radio"
                                    name="provider"
                                    value="claude"
                                    checked={provider === 'claude'}
                                    onChange={(e) => setProvider(e.target.value)}
                                    className="text-primary focus:ring-primary"
                                />
                                <div className="text-xs">
                                    <div className="font-bold">Claude Anthropic</div>
                                    <div className="text-[10px] text-slate-500">Claude 3.5 Sonnet</div>
                                </div>
                            </label>

                            <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${provider === 'openai' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                <input
                                    type="radio"
                                    name="provider"
                                    value="openai"
                                    checked={provider === 'openai'}
                                    onChange={(e) => setProvider(e.target.value)}
                                    className="text-primary focus:ring-primary"
                                />
                                <div className="text-xs">
                                    <div className="font-bold">OpenAI / GPT-4o</div>
                                    <div className="text-[10px] text-slate-500">GPT-4o mini</div>
                                </div>
                            </label>
                        </div>

                        {!isApiKeyConfigured(provider) && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-medium">
                                        API Key {provider.toUpperCase()} belum disimpan di database/env.
                                    </p>
                                    <p className="text-[11px] opacity-90">
                                        Sistem akan menggunakan template dataset cerdas atau Anda bisa memasukkan custom API Key di bawah:
                                    </p>
                                    <input
                                        type="password"
                                        value={customApiKey}
                                        onChange={(e) => setCustomApiKey(e.target.value)}
                                        placeholder={`Masukkan ${provider.toUpperCase()} API Key untuk eksekusi ini...`}
                                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded text-slate-800 dark:text-slate-200 mt-1"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="replaceExisting"
                                checked={replaceExisting}
                                onChange={(e) => setReplaceExisting(e.target.checked)}
                                className="rounded text-primary focus:ring-primary"
                            />
                            <label htmlFor="replaceExisting" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                                Ganti (timpa) seluruh konten yang ada di bulan ini dengan hasil generate baru
                            </label>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isGenerating}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
                    >
                        Batal
                    </button>

                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:opacity-95 shadow-lg shadow-primary/25 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generating Monthly Plan...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                <span>Mulai Generate Kalender Konten ✨</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
