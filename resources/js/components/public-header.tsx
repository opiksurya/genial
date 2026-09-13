import React, { useState, useEffect } from 'react';
import { 
    Sun, 
    Moon, 
    Menu, 
    X, 
    MessageSquare, 
    ArrowRight 
} from 'lucide-react';
import { useGtm } from '@/hooks/use-gtm';

interface PublicHeaderProps {
    whatsappNumber?: string;
    whatsappDefaultMessage?: string;
    themeMode?: 'dark' | 'light';
    onToggleTheme?: () => void;
}

export default function PublicHeader({
    whatsappNumber = '6281234567890',
    whatsappDefaultMessage = 'Halo Genial Digital Solution, saya ingin konsultasi strategi digital marketing',
    themeMode: propThemeMode,
    onToggleTheme
}: PublicHeaderProps) {
    const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentPath, setCurrentPath] = useState('');

    // Initialize GTM tracking
    useGtm();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPath(window.location.pathname);
            
            if (propThemeMode) {
                setThemeMode(propThemeMode);
            } else {
                const savedTheme = localStorage.getItem('genial_theme') as 'dark' | 'light' | null;
                if (savedTheme) {
                    setThemeMode(savedTheme);
                } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                    setThemeMode('light');
                }
            }
        }
    }, [propThemeMode]);

    const handleToggleTheme = () => {
        if (onToggleTheme) {
            onToggleTheme();
        } else {
            const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
            setThemeMode(nextTheme);
            localStorage.setItem('genial_theme', nextTheme);
        }
    };

    const isDark = (propThemeMode ?? themeMode) === 'dark';

    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappDefaultMessage)}`;

    const handleWaClick = (sourceLocation: string) => {
        if (typeof window !== 'undefined') {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'generate_lead',
                category: 'Engagement',
                action: 'Click WhatsApp',
                label: `Public Header - ${sourceLocation}`,
            });
        }
    };

    const navItems = [
        { title: 'Beranda', href: '/' },
        { title: 'Cerita & Filosofi', href: '/our-story' },
        { title: 'Metode & Funnel', href: '/how-we-work' },
        { title: 'Cara Aktivasi', href: '/activation' },
        { title: 'Penunjang Bisnis & ERP', href: '/support' },
    ];

    const isItemActive = (href: string) => {
        if (href === '/') return currentPath === '/' || currentPath === '';
        return currentPath.startsWith(href);
    };

    const headerBg = isDark ? 'bg-[#000000]/85 border-slate-800/80' : 'bg-white/85 border-slate-200/80';

    return (
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
                <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
                    {navItems.map((item) => {
                        const active = isItemActive(item.href);
                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                className={`transition-colors py-1 ${
                                    active
                                        ? 'text-[#00A9E7] font-bold border-b-2 border-[#00A9E7]'
                                        : isDark 
                                            ? 'text-slate-300 hover:text-[#00A9E7]' 
                                            : 'text-slate-600 hover:text-[#00A9E7]'
                                }`}
                            >
                                {item.title}
                            </a>
                        );
                    })}
                </nav>

                {/* Action Buttons & Theme Switcher */}
                <div className="hidden md:flex items-center gap-3">
                    <button
                        onClick={handleToggleTheme}
                        className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${
                            isDark 
                                ? 'bg-[#0c1322] border-slate-800 text-[#FAD03D] hover:bg-slate-900' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
                        }`}
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
                <div className="flex lg:hidden items-center gap-2">
                    <button
                        onClick={handleToggleTheme}
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
                <div className={`lg:hidden ${isDark ? 'bg-[#000000] border-slate-800' : 'bg-white border-slate-200'} border-b px-4 pt-3 pb-6 space-y-3`}>
                    {navItems.map((item) => {
                        const active = isItemActive(item.href);
                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block py-2 text-sm ${
                                    active
                                        ? 'text-[#00A9E7] font-bold'
                                        : isDark 
                                            ? 'text-slate-300 hover:text-[#00A9E7]' 
                                            : 'text-slate-600 hover:text-[#00A9E7]'
                                }`}
                            >
                                {item.title}
                            </a>
                        );
                    })}
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
    );
}
