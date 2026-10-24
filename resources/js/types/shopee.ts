export type ShopeeKpiFormat = 'currency' | 'number' | 'percent' | 'ratio';

export type ShopeeKpi = {
    key: string;
    label: string;
    format: ShopeeKpiFormat;
    higherIsBetter: boolean;
    value: number;
    previous: number;
    change: number | null;
};

export type ShopeeChannelKey = 'organic' | 'ads' | 'live' | 'video';

export type ShopeeChannel = {
    channel: ShopeeChannelKey;
    label: string;
    orders: number;
    revenue: number;
    share: number;
};

export type ShopeeOrderStatus = 'completed' | 'cancelled' | 'returned';

export type ShopeeSales = {
    totals: {
        revenue: number;
        grossValue: number;
        orders: number;
        completed: number;
        cancelled: number;
        returned: number;
        units: number;
        aov: number;
    };
    daily: { date: string; revenue: number; orders: number; completed: number }[];
    weekly: { weekStart: string; weekEnd: string; revenue: number; orders: number; completed: number }[];
    statuses: { status: ShopeeOrderStatus; label: string; orders: number; value: number; share: number }[];
    topProducts: {
        id: number;
        sku: string;
        name: string;
        etalase: string;
        orders: number;
        units: number;
        revenue: number;
        share: number;
    }[];
};

export type ShopeeAdMetrics = {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    conversionRate: number;
    costPerConversion: number;
    revenue: number;
    roas: number;
};

export type ShopeeAds = {
    totals: ShopeeAdMetrics;
    campaigns: (ShopeeAdMetrics & { id: string; name: string; type: string; dailyBudget: number })[];
    daily: { date: string; spend: number; revenue: number }[];
};

export type ShopeeLiveSession = {
    id: string;
    date: string;
    startTime: string;
    title: string;
    durationMinutes: number;
    viewers: number;
    peakViewers: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    orders: number;
    revenue: number;
};

export type ShopeeVideo = {
    id: string;
    publishedAt: string;
    title: string;
    durationSeconds: number;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
    orders: number;
    revenue: number;
};

export type ShopeeContent = {
    totals: {
        live: { sessions: number; durationMinutes: number; viewers: number; orders: number; revenue: number; engagementRate: number };
        video: { count: number; views: number; orders: number; revenue: number; engagementRate: number };
        revenue: number;
        orders: number;
        shareOfRevenue: number;
    };
    liveSessions: ShopeeLiveSession[];
    videos: ShopeeVideo[];
};

export type ShopeeStockStatus = 'aman' | 'menipis' | 'habis';

export type ShopeeProduct = {
    id: number;
    sku: string;
    name: string;
    etalase: string;
    price: number;
    stock: number;
    views: number;
    orders: number;
    units: number;
    revenue: number;
    conversionRate: number;
    daysOfCover: number | null;
    stockStatus: ShopeeStockStatus;
    isSlowMoving: boolean;
};

export type ShopeeEtalase = {
    name: string;
    productCount: number;
    stock: number;
    views: number;
    orders: number;
    units: number;
    revenue: number;
    conversionRate: number;
    share: number;
};

export type ShopeeStorefront = {
    etalase: ShopeeEtalase[];
    products: ShopeeProduct[];
    slowMoving: ShopeeProduct[];
};

export type ShopeeConfig = {
    id?: number;
    project_id?: number;
    partner_id?: string | null;
    is_sandbox?: boolean;
    shop_id?: string | null;
    shop_name?: string | null;
    status: 'connected' | 'error' | 'disconnected';
    token_expires_at?: string | null;
    last_synced_at?: string | null;
    error_message?: string | null;
};

export type ShopeeProjectOption = {
    id: number;
    name: string;
    client: string | null;
    slug?: string;
    shopee_config?: ShopeeConfig | null;
    shopeeConfig?: ShopeeConfig | null;
};

export type ShopeeAnalytics = {
    isDummy: boolean;
    storeName: string;
    projectId?: number | null;
    projectName?: string | null;
    clientName?: string | null;
    range: { start: string; end: string; previousStart: string; previousEnd: string };
    summary: { kpis: ShopeeKpi[]; channels: ShopeeChannel[] };
    sales: ShopeeSales;
    ads: ShopeeAds;
    content: ShopeeContent;
    storefront: ShopeeStorefront;
};

export type ShopeePeriodOption = { value: number; label: string };
