import React from 'react';

interface PublicFooterProps {
    themeMode?: 'dark' | 'light';
}

export default function PublicFooter({ themeMode = 'dark' }: PublicFooterProps) {
    const isDark = themeMode === 'dark';
    const navText = isDark ? 'text-slate-400 hover:text-[#00A9E7]' : 'text-slate-600 hover:text-[#00A9E7]';
    const borderClass = isDark ? 'border-slate-800/80 bg-[#000000]' : 'border-slate-200 bg-white';
    const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';

    const navItems = [
        { title: 'Beranda', href: '/' },
        { title: 'Cerita & Filosofi', href: '/our-story' },
        { title: 'Metode & Funnel', href: '/how-we-work' },
        { title: 'Cara Aktivasi', href: '/activation' },
        { title: 'Penunjang Bisnis & ERP', href: '/support' },
    ];

    return (
        <footer className={`border-t ${borderClass} py-12 transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Genial Digital Solution Logo" className="h-8 w-auto object-contain" />
                    <span className={`text-sm ${textMuted}`}>
                        &copy; {new Date().getFullYear()} Genial Digital Solution. All rights reserved.
                    </span>
                </div>

                <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
                    {navItems.map((item) => (
                        <a key={item.href} href={item.href} className={`transition-colors ${navText}`}>
                            {item.title}
                        </a>
                    ))}
                </nav>
            </div>
        </footer>
    );
}
