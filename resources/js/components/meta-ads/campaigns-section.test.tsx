import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { CampaignsSection } from '@/components/meta-ads/campaigns-section';
import type { MetaAdsCampaign } from '@/types/meta-ads';

const campaign: MetaAdsCampaign = {
    id: '1',
    name: 'Kampanye A',
    objective: 'OUTCOME_SALES',
    status: 'ACTIVE',
    dailyBudget: 50000,
    spend: 100000,
    impressions: 1000,
    clicks: 10,
    ctr: 1,
    cpc: 10000,
    purchases: 2,
    leads: 0,
    cpa: 50000,
    revenue: 400000,
    roas: 4,
};

describe('CampaignsSection', () => {
    it('makes the Total footer row span every header column', () => {
        const html = renderToStaticMarkup(
            <CampaignsSection campaigns={[campaign]} />,
        );

        const headerColumns = (html.match(/<th[\s>]/g) ?? []).length;
        const footer = html.split('<tfoot>')[1].split('</tfoot>')[0];
        const footerColumns = [...footer.matchAll(/<td([^>]*)>/g)].reduce(
            (total, [, attributes]) =>
                total + Number(attributes.match(/colSpan="(\d+)"/i)?.[1] ?? 1),
            0,
        );

        expect(footer).toContain('colSpan="3"');
        expect(footerColumns).toBe(headerColumns);
    });
});
