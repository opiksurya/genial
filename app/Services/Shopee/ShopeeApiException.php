<?php

namespace App\Services\Shopee;

use RuntimeException;

class ShopeeApiException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?string $errorCode = null,
        public readonly ?string $requestId = null,
    ) {
        parent::__construct($message);
    }

    /**
     * Shopee answers with `error_auth` when the access token is invalid or expired.
     */
    public function isAuthError(): bool
    {
        return $this->errorCode === 'error_auth';
    }
}
