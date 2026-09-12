import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

declare global {
    interface Window {
        dataLayer?: any[];
        gtag?: (...args: any[]) => void;
    }
}

type SharedProps = {
    gtm?: {
        gtm_id: string;
        enabled: boolean;
    };
    ga4?: {
        ga4_id: string;
        enabled: boolean;
    };
};

export function useGtm() {
    const { gtm, ga4 } = usePage<SharedProps>().props;

    useEffect(() => {
        window.dataLayer = window.dataLayer || [];

        // 1. Inject & initialize GA4 (Google Analytics 4 gtag.js) if enabled
        if (ga4 && ga4.enabled && ga4.ga4_id) {
            const ga4Id = ga4.ga4_id.trim();

            if (!document.getElementById('ga4-script')) {
                const script = document.createElement('script');
                script.id = 'ga4-script';
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
                document.head.appendChild(script);

                if (!window.gtag) {
                    window.gtag = function () {
                        window.dataLayer?.push(arguments);
                    };
                    window.gtag('js', new Date());
                }
                window.gtag('config', ga4Id);
            }
        }

        // 2. Inject Google Tag Manager (GTM) Container Script if enabled
        if (gtm && gtm.enabled && gtm.gtm_id) {
            const gtmId = gtm.gtm_id.trim();

            if (!document.getElementById('gtm-script')) {
                const script = document.createElement('script');
                script.id = 'gtm-script';
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;

                window.dataLayer.push({
                    'gtm.start': new Date().getTime(),
                    event: 'gtm.js',
                });

                document.head.appendChild(script);
            }
        }

        // 3. Fire PageView event to DataLayer
        window.dataLayer.push({
            event: 'page_view',
            page_location: window.location.href,
            page_title: document.title,
            page_path: window.location.pathname,
        });

        // 4. Global click listener to auto-detect WhatsApp Lead clicks & push to DataLayer & GA4
        const handleWhatsAppClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const link = target.closest('a') || target.closest('button');
            if (!link) return;

            const href = link.getAttribute('href') || '';
            const isWhatsApp =
                href.includes('wa.me') ||
                href.includes('whatsapp.com') ||
                href.includes('api.whatsapp.com') ||
                link.classList.contains('btn-whatsapp') ||
                link.hasAttribute('data-meta-lead');

            if (isWhatsApp) {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    event: 'generate_lead',
                    event_category: 'Lead',
                    event_action: 'WhatsApp Click',
                    event_label: 'WhatsApp Contact Click',
                    value: 0.00,
                    currency: 'IDR',
                });

                if (window.gtag) {
                    window.gtag('event', 'generate_lead', {
                        event_category: 'Lead',
                        event_label: 'WhatsApp Contact Click',
                        value: 0.00,
                        currency: 'IDR',
                    });
                }
            }
        };

        document.addEventListener('click', handleWhatsAppClick);

        return () => {
            document.removeEventListener('click', handleWhatsAppClick);
        };
    }, [gtm, ga4]);
}
