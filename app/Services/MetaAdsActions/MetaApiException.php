<?php

namespace App\Services\MetaAdsActions;

use Illuminate\Http\Client\Response;
use RuntimeException;

/**
 * The Meta Graph API returned an error or could not be reached.
 */
class MetaApiException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?int $metaCode = null,
        public readonly ?int $metaSubcode = null,
        public readonly ?int $httpStatus = null,
        public readonly ?string $fbtraceId = null,
    ) {
        parent::__construct($message);
    }

    public static function fromResponse(Response $response): self
    {
        $error = $response->json('error');
        $error = is_array($error) ? $error : [];

        return new self(
            $error['error_user_msg'] ?? $error['message'] ?? 'Meta Graph API mengembalikan error.',
            isset($error['code']) ? (int) $error['code'] : null,
            isset($error['error_subcode']) ? (int) $error['error_subcode'] : null,
            $response->status(),
            $error['fbtrace_id'] ?? null,
        );
    }

    /**
     * @return array{meta_code: int|null, meta_subcode: int|null, http_status: int|null, fbtrace_id: string|null}
     */
    public function details(): array
    {
        return [
            'meta_code' => $this->metaCode,
            'meta_subcode' => $this->metaSubcode,
            'http_status' => $this->httpStatus,
            'fbtrace_id' => $this->fbtraceId,
        ];
    }
}
