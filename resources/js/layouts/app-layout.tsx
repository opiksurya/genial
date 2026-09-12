import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { useMetaPixel } from '@/hooks/use-meta-pixel';
import { useGtm } from '@/hooks/use-gtm';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    useMetaPixel();
    useGtm();

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            {children}
        </AppLayoutTemplate>
    );
}
