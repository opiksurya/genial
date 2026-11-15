<?php

namespace App\Services\MetaAdsAnalytics;

use RuntimeException;

class MetaApiException extends RuntimeException
{
    /** OAuth errors: the token is invalid, expired, or revoked. */
    private const AUTH_CODES = [102, 190];

    /** Rate limiting: too many calls for the app, the user, or the ad account. */
    private const RATE_LIMIT_CODES = [4, 17, 32, 613];

    public function __construct(
        string $message,
        public readonly ?int $metaCode = null,
        public readonly ?int $metaSubcode = null,
    ) {
        parent::__construct($message);
    }

    public static function connection(string $detail): self
    {
        return new self('Tidak dapat menghubungi Meta: '.mb_strimwidth($detail, 0, 160, '…'));
    }

    /**
     * Build an exception with a user-facing message from a Graph API error payload.
     *
     * @param  array<string, mixed>  $payload
     */
    public static function fromResponse(array $payload, int $status): self
    {
        $error = $payload['error'] ?? [];
        $code = isset($error['code']) ? (int) $error['code'] : null;
        $subcode = isset($error['error_subcode']) ? (int) $error['error_subcode'] : null;
        $message = (string) ($error['message'] ?? "Meta menjawab HTTP {$status}.");

        $friendly = match (true) {
            in_array($code, self::AUTH_CODES, true) => 'Token akses Meta kedaluwarsa atau dicabut. Hubungkan ulang akun Meta.',
            in_array($code, self::RATE_LIMIT_CODES, true) => 'Batas panggilan Meta tercapai. Coba lagi beberapa menit lagi.',
            $code === 10 || ($code !== null && $code >= 200 && $code <= 299) => 'Akses ke akun iklan ini ditolak. Pastikan akun Facebook yang terhubung punya izin membaca iklan (ads_read) untuk akun tersebut.',
            default => 'Meta menolak permintaan: '.mb_strimwidth($message, 0, 200, '…'),
        };

        return new self($friendly, $code, $subcode);
    }

    public function isAuthError(): bool
    {
        return in_array($this->metaCode, self::AUTH_CODES, true);
    }
}
