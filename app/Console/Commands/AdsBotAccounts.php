<?php

namespace App\Console\Commands;

use App\Concerns\InteractsWithAdsBot;
use App\Models\ProjectMetaConfig;
use Illuminate\Console\Command;

class AdsBotAccounts extends Command
{
    use InteractsWithAdsBot;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ads:bot-accounts {--project= : Hanya tampilkan project ini}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Print the projects with a Meta Ads connection as JSON for the Telegram Ads Bot (no tokens)';

    /**
     * @return array<string, mixed>
     */
    protected function payload(): array
    {
        $configs = ProjectMetaConfig::with('project:id,name')
            ->whereNotNull('ad_account_id')
            ->when(filled($this->option('project')), fn ($query) => $query->where('project_id', (int) $this->option('project')))
            ->orderBy('project_id')
            ->get();

        return [
            'accounts' => $configs->map(fn (ProjectMetaConfig $config): array => [
                'project_id' => $config->project_id,
                'project_name' => $config->project?->name,
                'account_name' => $config->account_name,
                'ad_account_id' => $config->formatted_ad_account_id,
                'currency' => $config->currency,
                'status' => $config->status,
                'token_expires_at' => $config->token_expires_at?->toIso8601String(),
            ])->values()->all(),
        ];
    }
}
