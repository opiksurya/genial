<?php

namespace App\Console\Commands;

use App\Concerns\InteractsWithAdsBot;
use App\Services\MetaAdsActions\MetaAdsActionService;
use Illuminate\Console\Command;

class AdsBotAction extends Command
{
    use InteractsWithAdsBot;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ads:bot-action
        {action : set_status, set_budget atau duplicate_campaign}
        {--project= : ID project yang terhubung ke Meta}
        {--object-type= : campaign atau adset}
        {--object-id= : ID campaign/ad set di Meta}
        {--status= : ACTIVE atau PAUSED (set_status)}
        {--budget-type= : daily atau lifetime (set_budget)}
        {--amount= : Nominal biasa, mis. 150000 untuk Rp150.000 (set_budget)}
        {--name= : Nama campaign hasil duplikat (duplicate_campaign)}
        {--user= : Email user yang menyetujui (Super Admin atau Admin)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Apply an approved Meta Ads action and print the state before and after as JSON';

    /**
     * @return array<string, mixed>
     */
    protected function payload(): array
    {
        $user = $this->authorizedUser($this->option('user'), $this->adsBotRoles);
        $action = $this->actionFromOptions();
        $config = $this->metaConfig($this->option('project'));

        return [
            'project_id' => $config->project_id,
            ...MetaAdsActionService::for($config)->execute($action, $user),
        ];
    }
}
