import React, { useState, useEffect } from 'react';
import PublicHeader from '@/components/public-header';
import PublicFooter from '@/components/public-footer';

interface PublicLayoutProps {
    children: React.ReactNode;
    whatsappNumber?: string;
    whatsappDefaultMessage?: string;
}

export default function PublicLayout({
    children,
    whatsappNumber,
    whatsappDefaultMessage
}: PublicLayoutProps) {
    const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('genial_theme') as 'dark' | 'light' | null;
            if (savedTheme) {
                setThemeMode(savedTheme);
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                setThemeMode('light');
            }
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
        setThemeMode(nextTheme);
        localStorage.setItem('genial_theme', nextTheme);
    };

    const isDark = themeMode === 'dark';
    const bgClass = isDark ? 'bg-[#000000] text-slate-100' : 'bg-[#f8fafc] text-slate-900';

    return (
        <div className={`min-h-screen font-sans ${bgClass} transition-colors duration-300 selection:bg-[#00A9E7] selection:text-white flex flex-col justify-between`}>
            <PublicHeader 
                whatsappNumber={whatsappNumber}
                whatsappDefaultMessage={whatsappDefaultMessage}
                themeMode={themeMode}
                onToggleTheme={toggleTheme}
            />

            <main className="flex-1">
                {children}
            </main>

            <PublicFooter themeMode={themeMode} />
        </div>
    );
}
