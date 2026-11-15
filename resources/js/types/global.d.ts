import type { Auth } from '@/types/auth';

export type PortalNavItem = {
    key: string;
    title: string;
    href: string;
    children?: { key: string; title: string; href: string }[];
};

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            claudeOfficeUrl: string | null;
            canAccessFinance: boolean;
            canManageRoles: boolean;
            canManageUsers: boolean;
            sidebarOpen: boolean;
            portalNav: PortalNavItem[] | null;
            [key: string]: unknown;
        };
    }
}
