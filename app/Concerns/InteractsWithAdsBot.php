<?php

namespace App\Concerns;

use App\Models\ProjectMetaConfig;
use App\Services\MetaAdsActions\MetaAdsAction;
use App\Services\MetaAdsActions\MetaAdsActionRejected;
use App\Services\MetaAdsActions\MetaApiException;
use Illuminate\Auth\Access\AuthorizationException;
use InvalidArgumentException;
use Throwable;

/**
 * Shared behaviour for the ads:bot-* commands used by the Telegram Ads Bot.
 *
 * Output follows the finance bot contract: one JSON document on stdout,
 * failures print {"error": "...", "code": "..."} and exit non-zero.
 */
trait InteractsWithAdsBot
{
    use InteractsWithFinanceBot;

    /**
     * Roles allowed to change ads through the bot.
     *
     * @var list<string>
     */
    protected array $adsBotRoles = ['Super Admin', 'Admin'];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        try {
            $this->writeJson($this->payload());

            return self::SUCCESS;
        } catch (MetaApiException $exception) {
            return $this->failWith($exception->getMessage(), 'meta_api', $exception->details());
        } catch (MetaAdsActionRejected $exception) {
            return $this->failWith($exception->getMessage(), $exception->reason);
        } catch (AuthorizationException $exception) {
            return $this->failWith($exception->getMessage(), 'forbidden');
        } catch (InvalidArgumentException $exception) {
            return $this->failWith($exception->getMessage(), 'invalid');
        } catch (Throwable $exception) {
            report($exception);

            return $this->failWith('Terjadi kesalahan internal, cek log Laravel.', 'internal');
        }
    }

    /**
     * Find the connected Meta configuration for --project.
     *
     * @throws MetaAdsActionRejected
     */
    protected function metaConfig(mixed $projectId): ProjectMetaConfig
    {
        if (blank($projectId) || ! ctype_digit((string) $projectId)) {
            throw new MetaAdsActionRejected('Opsi --project=<project_id> wajib diisi dengan angka.');
        }

        $config = ProjectMetaConfig::where('project_id', (int) $projectId)->first();

        if ($config === null || blank($config->ad_account_id) || blank($config->access_token)) {
            throw new MetaAdsActionRejected("Project {$projectId} belum terhubung ke Meta.", 'not_connected');
        }

        if (! $config->isConnected()) {
            throw new MetaAdsActionRejected(
                "Koneksi Meta project {$projectId} berstatus {$config->status}; sambungkan ulang di website.",
                'not_connected',
            );
        }

        return $config;
    }

    /**
     * @throws MetaAdsActionRejected
     */
    protected function actionFromOptions(): MetaAdsAction
    {
        return MetaAdsAction::fromInput(
            $this->argument('action'),
            $this->option('object-type'),
            $this->option('object-id'),
            $this->option('status'),
            $this->option('budget-type'),
            $this->option('amount'),
            $this->option('name'),
        );
    }
}
