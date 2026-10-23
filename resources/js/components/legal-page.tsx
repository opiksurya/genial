import React from 'react';
import { Head } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import { useGtm } from '@/hooks/use-gtm';

export interface LegalSection {
    id: string;
    title: string;
    content: React.ReactNode;
}

interface LegalPageProps {
    title: string;
    description: string;
    effectiveDate: string;
    intro: React.ReactNode;
    sections: LegalSection[];
    whatsappNumber?: string;
    whatsappDefaultMessage?: string;
}

export const LEGAL_COMPANY = {
    name: 'PT Genial Digital Studio',
    brand: 'Genial Digital Solution',
    address: 'Jl. Budhi No. 47, Kota Bandung',
    email: 'halo@genialdigitalsolution.com',
    website: 'genialdigitalsolution.com',
};

export default function LegalPage({
    title,
    description,
    effectiveDate,
    intro,
    sections,
    whatsappNumber,
    whatsappDefaultMessage,
}: LegalPageProps) {
    useGtm();

    return (
        <PublicLayout whatsappNumber={whatsappNumber} whatsappDefaultMessage={whatsappDefaultMessage}>
            <Head>
                <title>{title}</title>
                <meta name="description" content={description} />
            </Head>

            <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
                <header className="mb-10 border-b border-slate-500/20 pb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
                    <p className="mt-3 text-sm opacity-70">Berlaku sejak {effectiveDate}</p>
                    <div className="mt-6 space-y-4 leading-relaxed opacity-90">{intro}</div>
                </header>

                <nav aria-label="Daftar isi" className="mb-10 rounded-xl border border-slate-500/20 p-5">
                    <p className="text-sm font-semibold mb-3">Daftar Isi</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                        {sections.map((section) => (
                            <li key={section.id}>
                                <a href={`#${section.id}`} className="text-[#00A9E7] hover:underline">
                                    {section.title}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="space-y-10">
                    {sections.map((section, index) => (
                        <section key={section.id} id={section.id} className="scroll-mt-28">
                            <h2 className="text-xl font-semibold mb-4">
                                {index + 1}. {section.title}
                            </h2>
                            <div className="space-y-4 leading-relaxed opacity-90 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-[#00A9E7] [&_a]:underline">
                                {section.content}
                            </div>
                        </section>
                    ))}
                </div>
            </article>
        </PublicLayout>
    );
}
