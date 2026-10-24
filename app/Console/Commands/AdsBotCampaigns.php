<?php

namespace App\Console\Commands;

use App\Concerns\InteractsWithAdsBot;
use App\Services\MetaAdsActions\MetaAdsReader;
use Illuminate\Console\Command;

class AdsBotCampaigns extends Command
{
    use InteractsWithAdsBot;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ads:bot-campaigns
        {--project= : ID project yang terhubung ke Meta}
        {--date-preset=last_7d : Date preset Insights Meta, mis. today, last_7d, last_30d}
        {--with-adsets : Sertakan ad set tiap campaign}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Print Meta campaigns (and ad sets) with budgets and insights as JSON for the Telegram Ads Bot';

    /**
     * @return array<string, mixed>
     */
    protected function payload(): array
    {
        $config = $this->metaConfig($this->option('project'));
        $reader = MetaAdsReader::for($config);
        $datePreset = (string) $this->option('date-preset');

        return [
            'project_id' => $config->project_id,
            'ad_account_id' => $config->formatted_ad_account_id,
            'currency' => $reader->currency(),
            'date_preset' => $datePreset,
            'campaigns' => $reader->campaigns($datePreset, (bool) $this->option('with-adsets')),
        ];
    }
}
