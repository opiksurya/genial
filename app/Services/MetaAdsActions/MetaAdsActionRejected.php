<?php

namespace App\Services\MetaAdsActions;

use InvalidArgumentException;

/**
 * A requested ads action was refused before anything was sent to Meta.
 */
class MetaAdsActionRejected extends InvalidArgumentException
{
    public function __construct(string $message, public readonly string $reason = 'invalid')
    {
        parent::__construct($message);
    }
}
