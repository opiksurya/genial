<?php

namespace Database\Factories;

use App\Models\ShopeeConnectLink;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ShopeeConnectLink>
 */
class ShopeeConnectLinkFactory extends Factory
{
    protected $model = ShopeeConnectLink::class;

    /**
     * Define the model's default state. Pass project_id when creating.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'token_hash' => ShopeeConnectLink::hashToken(Str::random(ShopeeConnectLink::TOKEN_LENGTH)),
            'expires_at' => now()->addDays(ShopeeConnectLink::DEFAULT_DAYS),
        ];
    }

    public function expired(): static
    {
        return $this->state(fn () => ['expires_at' => now()->subMinute()]);
    }

    public function used(): static
    {
        return $this->state(fn () => ['used_at' => now()->subMinute()]);
    }

    public function revoked(): static
    {
        return $this->state(fn () => ['revoked_at' => now()->subMinute()]);
    }
}
