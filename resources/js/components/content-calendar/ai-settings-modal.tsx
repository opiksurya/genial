import React, { useState } from 'react';
import { 
    X, 
    Key, 
    Check, 
    Save, 
    ExternalLink, 
    Bot, 
    Cpu, 
    Sparkles, 
    ShieldCheck, 
    Loader2 
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface AiSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: {
        default_provider: string;
        gemini_api_key_set: boolean;
        claude_api_key_set: boolean;
        openai_api_key_set: boolean;
        openrouter_api_key_set: boolean;
        gemini_model: string;
        claude_model: string;
        openai_model: string;
    };
}

export function AiSettingsModal({ isOpen, onClose, settings }: AiSettingsModalProps) {
    if (!isOpen) return null;

    const [defaultProvider, setDefaultProvider] = useState<string>(settings.default_provider || 'gemini');
    const [geminiKey, setGeminiKey] = useState<string>('');
    const [claudeKey, setClaudeKey] = useState<string>('');
    const [openaiKey, setOpenaiKey] = useState<string>('');
    const [openrouterKey, setOpenrouterKey] = useState<string>('');
    
    const [geminiModel, setGeminiModel] = useState<string>(settings.gemini_model || 'gemini-2.0-flash');
    const [claudeModel, setClaudeModel] = useState<string>(settings.claude_model || 'claude-3-5-sonnet-20241022');
    const [openaiModel, setOpenaiModel] = useState<string>(settings.openai_model || 'gpt-4o-mini');

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        router.post('/content-calendar/settings', {
            default_provider: defaultProvider,
            gemini_api_key: geminiKey || undefined,
            claude_api_key: claudeKey || undefined,
            openai_api_key: openaiKey || undefined,
            openrouter_api_key: openrouterKey || undefined,
            gemini_model: geminiModel,
            claude_model: claudeModel,
            openai_model: openaiModel,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSaving(false);
                toast.success('Pengaturan API AI berhasil disimpan!');
                onClose();
            },
            onError: () => {
                setIsSaving(false);
                toast.error('Gagal menyimpan pengaturan API.');
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                Pengaturan API AI Provider
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Konfigurasikan Google Gemini, Claude Anthropic, atau OpenAI
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                    
                    {/* Default Provider Selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Default AI Provider
                        </label>
                        <select
                            value={defaultProvider}
                            onChange={(e) => setDefaultProvider(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                        >
                            <option value="gemini">Google Gemini (Recommended / Cepat & Gratis Kuota)</option>
                            <option value="claude">Anthropic Claude (Kualitas Bahasa & Copywriting Tertinggi)</option>
                            <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                            <option value="openrouter">OpenRouter (Multi-Model Hub)</option>
                        </select>
                    </div>

                    {/* Google Gemini Section */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Google Gemini API</span>
                                {settings.gemini_api_key_set && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Tersimpan
                                    </span>
                                )}
                            </div>
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                            >
                                <span>Get API Key</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>

                        <div className="space-y-2">
                            <input
                                type="password"
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                placeholder={settings.gemini_api_key_set ? "•••••••••••••••• (sudah tersimpan, isi untuk ganti)" : "Masukkan Gemini API Key..."}
                                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">Model:</span>
                                <select
                                    value={geminiModel}
                                    onChange={(e) => setGeminiModel(e.target.value)}
                                    className="text-[11px] px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-medium"
                                >
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Sangat Cepat & Akurat)</option>
                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Anthropic Claude Section */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-purple-500" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Anthropic Claude API</span>
                                {settings.claude_api_key_set && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Tersimpan
                                    </span>
                                )}
                            </div>
                            <a
                                href="https://console.anthropic.com/settings/keys"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-purple-600 hover:underline flex items-center gap-1"
                            >
                                <span>Get API Key</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>

                        <div className="space-y-2">
                            <input
                                type="password"
                                value={claudeKey}
                                onChange={(e) => setClaudeKey(e.target.value)}
                                placeholder={settings.claude_api_key_set ? "•••••••••••••••• (sudah tersimpan, isi untuk ganti)" : "sk-ant-api03-..."}
                                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">Model:</span>
                                <select
                                    value={claudeModel}
                                    onChange={(e) => setClaudeModel(e.target.value)}
                                    className="text-[11px] px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-medium"
                                >
                                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                                    <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* OpenAI Section */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-emerald-500" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">OpenAI API</span>
                                {settings.openai_api_key_set && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Tersimpan
                                    </span>
                                )}
                            </div>
                            <a
                                href="https://platform.openai.com/api-keys"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
                            >
                                <span>Get API Key</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>

                        <div className="space-y-2">
                            <input
                                type="password"
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                placeholder={settings.openai_api_key_set ? "•••••••••••••••• (sudah tersimpan, isi untuk ganti)" : "sk-..."}
                                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">Model:</span>
                                <select
                                    value={openaiModel}
                                    onChange={(e) => setOpenaiModel(e.target.value)}
                                    className="text-[11px] px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-medium"
                                >
                                    <option value="gpt-4o-mini">GPT-4o mini (Efisien & Cepat)</option>
                                    <option value="gpt-4o">GPT-4o (High Intelligence)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
                    >
                        Tutup
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 rounded-xl transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Simpan Pengaturan API</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
