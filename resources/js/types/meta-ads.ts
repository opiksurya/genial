export type MetaAdsPeriodOption = {
    value: number;
    label: string;
};

export type MetaAdsProjectOption = {
    id: number;
    name: string;
    client: string | null;
    slug?: string;
    meta_config?: {
        id?: number;
        project_id?: number;
        ad_account_id?: string | null;
        pixel_id?: string | null;
        account_name?: string | null;
        currency?: string | null;
        timezone_name?: string | null;
        account_status?: number | null;
        status?: 'connected' | 'error' | 'disconnected' | string;
        last_synced_at?: string | null;
        error_message?: string | null;
    } | null;
    metaConfig?: {
        id?: number;
        project_id?: number;
        ad_account_id?: string | null;
        pixel_id?: string | null;
        account_name?: string | null;
        currency?: string | null;
        timezone_name?: string | null;
        account_status?: number | null;
        status?: 'connected' | 'error' | 'disconnected' | string;
        last_synced_at?: string | null;
        error_message?: string | null;
    } | null;
};

export type MetaAdsKpi = {
    key: string;
    label: string;
    value: number;
    previous: number;
    change: number | null;
    format: 'currency' | 'number' | 'percent' | 'ratio';
    higherIsBetter: boolean;
};

export type MetaAdsDaily = {
    date: string;
    spend: number;
    revenue: number;
    roas: number;
    purchases: number;
    leads: number;
    clicks: number;
    impressions: number;
    cpc: number;
    ctr: number;
};

export type MetaAdsPlatform = {
    platform: 'instagram' | 'facebook' | 'audience_network' | 'messenger';
    label: string;
    spend: number;
    revenue: number;
    roas: number;
    purchases: number;
    clicks: number;
    impressions: number;
    share: number;
};

export type MetaAdsPlacement = {
    name: string;
    share: number;
    spend: number;
    revenue: number;
    purchases: number;
    roas: number;
};

export type MetaAdsCampaign = {
    id: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED';
    objective: string;
    dailyBudget: number;
    spend: number;
    revenue: number;
    roas: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    purchases: number;
    leads: number;
    cpa: number;
};

export type MetaAdsAudience = {
    ageGroups: {
        age: string;
        share: number;
        spend: number;
        purchases: number;
        roas: number;
    }[];
    gender: {
        gender: string;
        share: number;
        spend: number;
        purchases: number;
    }[];
    segments: {
        name: string;
        type: string;
        spend: number;
        purchases: number;
        roas: number;
    }[];
};

export type MetaAdsCreative = {
    format: string;
    hookRate: number | null;
    holdRate: number | null;
    ctr: number;
    spend: number;
    revenue: number;
    roas: number;
};

export type MetaAdsPixelHealth = {
    pixelId: string;
    status: string;
    eventMatchQuality: number;
    capiActive: boolean;
    lastEventTime: string;
    events: {
        name: string;
        count: number;
        matchRate: string;
    }[];
};

export type MetaAdsAnalytics = {
    isDummy: boolean;
    isConnected: boolean;
    accountName: string;
    adAccountId: string;
    pixelId: string;
    currency: string;
    projectId?: number | null;
    projectName?: string | null;
    clientName?: string | null;
    range: {
        start: string;
        end: string;
        previousStart: string;
        previousEnd: string;
    };
    summary: {
        kpis: MetaAdsKpi[];
        totals: {
            spend: number;
            revenue: number;
            roas: number;
            purchases: number;
            leads: number;
            clicks: number;
            impressions: number;
            reach: number;
            cpc: number;
            cpm: number;
            ctr: number;
            cpa: number;
            cpl: number;
        };
    };
    daily: MetaAdsDaily[];
    platforms: MetaAdsPlatform[];
    placements: MetaAdsPlacement[];
    campaigns: MetaAdsCampaign[];
    audiences: MetaAdsAudience;
    creatives: MetaAdsCreative[];
    pixelHealth: MetaAdsPixelHealth;
};
