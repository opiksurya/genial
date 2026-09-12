import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

declare global {
    interface Window {
        fbq?: any;
        _fbq?: any;
    }
}

type SharedProps = {
    metaPixel?: {
        pixel_id: string;
        enabled: boolean;
    };
};

export function useMetaPixel() {
    const { metaPixel } = usePage<SharedProps>().props;

    useEffect(() => {
        if (!metaPixel || !metaPixel.enabled || !metaPixel.pixel_id) {
            return;
        }

        const pixelId = metaPixel.pixel_id;

        // 1. Inject Meta Pixel base script if not already present
        if (!window.fbq) {
            (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
                if (f.fbq) return;
                n = f.fbq = function () {
                    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                };
                if (!f._fbq) f._fbq = n;
                n.push = n;
                n.loaded = !0;
                n.version = '2.0';
                n.queue = [];
                t = b.createElement(e);
                t.async = !0;
                t.src = v;
                s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s);
            })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        }

        window.fbq('init', pixelId);
        window.fbq('track', 'PageView');

        // 2. Global listener to automatically detect WhatsApp lead button clicks
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
                const eventId = 'lead_wa_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

                // Browser-side Pixel Event
                if (window.fbq) {
                    window.fbq('track', 'Lead', {
                        content_name: 'WhatsApp Contact Click',
                        currency: 'IDR',
                        value: 0.00,
                    }, { eventID: eventId });
                }

                // Server-side CAPI Event Dispatch
                try {
                    fetch('/api/meta-capi/track', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                        },
                        body: JSON.stringify({
                            event_name: 'Lead',
                            event_id: eventId,
                            source_url: window.location.href,
                            custom_data: {
                                content_name: 'WhatsApp Contact Click',
                                currency: 'IDR',
                                value: 0.00,
                            },
                        }),
                    }).catch(() => {});
                } catch (err) {
                    // Silent catch
                }
            }
        };

        document.addEventListener('click', handleWhatsAppClick);

        return () => {
            document.removeEventListener('click', handleWhatsAppClick);
        };
    }, [metaPixel]);
}
