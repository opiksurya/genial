<?php

namespace App\Http\Controllers;

use App\Models\ProjectShopeeConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Receiver for Shopee Open Platform Push messages.
 *
 * Shopee signs each push: the Authorization header is HMAC-SHA256 of "{push url}|{raw body}"
 * using the partner key of the app that owns the shop.
 */
class ShopeeWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $signature = (string) $request->header('Authorization', '');
        $rawBody = $request->getContent();
        $payload = json_decode($rawBody, true);

        if ($signature === '' || ! is_array($payload)) {
            return response()->json(['status' => 'rejected'], 401);
        }

        $baseString = $this->pushUrl().'|'.$rawBody;

        foreach ($this->candidateKeys($payload['shop_id'] ?? null) as $key) {
            if (hash_equals(hash_hmac('sha256', $baseString, $key), $signature)) {
                return $this->handle($payload);
            }
        }

        Log::warning('Shopee webhook rejected: bad signature', ['shop_id' => $payload['shop_id'] ?? null]);

        return response()->json(['status' => 'rejected'], 401);
    }

    /**
     * Valid push: record it and acknowledge. Shopee retries on anything other than HTTP 200.
     * Event-specific handling (orders, deauthorization) plugs in here.
     */
    private function handle(array $payload): JsonResponse
    {
        Log::info('Shopee webhook received', [
            'code' => $payload['code'] ?? null,
            'shop_id' => $payload['shop_id'] ?? null,
            'timestamp' => $payload['timestamp'] ?? null,
        ]);

        return response()->json(['status' => 'ok']);
    }

    private function pushUrl(): string
    {
        return config('services.shopee.webhook_url') ?: route('webhooks.shopee');
    }

    /**
     * Keys that could have signed this push: the shared app key and the key of the shop's own project app.
     *
     * @return list<string>
     */
    private function candidateKeys(mixed $shopId): array
    {
        $keys = [];

        if ($shared = config('services.shopee.partner_key')) {
            $keys[] = (string) $shared;
        }

        if ($shopId !== null) {
            $own = ProjectShopeeConfig::where('shop_id', (string) $shopId)->whereNotNull('partner_key')->get();

            foreach ($own as $config) {
                if ($config->partner_key) {
                    $keys[] = $config->partner_key;
                }
            }
        }

        return $keys;
    }
}
