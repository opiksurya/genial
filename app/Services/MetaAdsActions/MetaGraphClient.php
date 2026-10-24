<?php

namespace App\Services\MetaAdsActions;

use App\Models\ProjectMetaConfig;
use App\Services\MetaClientService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Thin Graph API client bound to one project's Meta connection.
 *
 * Every failure is raised as a MetaApiException; the access token is never
 * part of an exception message.
 */
class MetaGraphClient
{
    /**
     * Upper bound of pages followed when listing an edge.
     */
    public const MAX_PAGES = 10;

    public function __construct(private readonly ProjectMetaConfig $config) {}

    /**
     * @param  array<string, mixed>  $query
     * @return array<string, mixed>
     *
     * @throws MetaApiException
     */
    public function get(string $path, array $query = []): array
    {
        return $this->send(fn () => Http::timeout(20)->get($this->url($path), [
            ...$query,
            'access_token' => $this->config->access_token,
        ]));
    }

    /**
     * Fetch every item of a list edge, following paging.next.
     *
     * @param  array<string, mixed>  $query
     * @return list<array<string, mixed>>
     *
     * @throws MetaApiException
     */
    public function getAll(string $path, array $query = []): array
    {
        $page = $this->get($path, $query);
        $items = $page['data'] ?? [];

        for ($pages = 1; $pages < self::MAX_PAGES && ! empty($page['paging']['next']); $pages++) {
            $next = $page['paging']['next'];
            $page = $this->send(fn () => Http::timeout(20)->get($next));
            $items = [...$items, ...($page['data'] ?? [])];
        }

        return $items;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     *
     * @throws MetaApiException
     */
    public function post(string $path, array $data): array
    {
        return $this->send(fn () => Http::timeout(30)->asForm()->post($this->url($path), [
            ...$data,
            'access_token' => $this->config->access_token,
        ]));
    }

    private function url(string $path): string
    {
        return MetaClientService::BASE_URL.'/'.ltrim($path, '/');
    }

    /**
     * @param  callable(): Response  $request
     * @return array<string, mixed>
     *
     * @throws MetaApiException
     */
    private function send(callable $request): array
    {
        try {
            $response = $request();
        } catch (ConnectionException) {
            throw new MetaApiException('Tidak bisa terhubung ke Meta Graph API.');
        }

        if (! $response->successful()) {
            throw MetaApiException::fromResponse($response);
        }

        $json = $response->json();

        return is_array($json) ? $json : [];
    }
}
