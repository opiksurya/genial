<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Symfony\Component\Console\Output\OutputInterface;
use Throwable;

/**
 * Shared behaviour for the finance:bot-* commands used by the Telegram bot.
 *
 * Every command prints exactly one JSON document to stdout. Failures print
 * {"error": "...", "code": "..."} and exit with a non-zero status.
 */
trait InteractsWithFinanceBot
{
    /**
     * Build the JSON payload for a successful run.
     *
     * @return array<string, mixed>
     *
     * @throws InvalidArgumentException when the input is unusable
     * @throws AuthorizationException when the user may not perform the action
     * @throws ValidationException when the finance data is invalid
     */
    abstract protected function payload(): array;

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        try {
            $this->writeJson($this->payload());

            return self::SUCCESS;
        } catch (ValidationException $exception) {
            return $this->failWith('Validasi gagal.', 'validation', ['errors' => $exception->errors()]);
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
     * Find the user behind a bot request and make sure they hold one of the roles.
     *
     * @param  list<string>  $roles
     *
     * @throws InvalidArgumentException
     * @throws AuthorizationException
     */
    protected function authorizedUser(?string $email, array $roles): User
    {
        if (blank($email)) {
            throw new InvalidArgumentException('Opsi --user=<email> wajib diisi.');
        }

        $user = User::where('email', $email)->first();

        if ($user === null) {
            throw new InvalidArgumentException("User dengan email {$email} tidak ditemukan.");
        }

        if (! $user->hasAnyRole($roles)) {
            throw new AuthorizationException('User tidak punya akses. Peran yang diizinkan: '.implode(', ', $roles).'.');
        }

        return $user;
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    protected function failWith(string $message, string $code, array $extra = []): int
    {
        $this->writeJson(['error' => $message, 'code' => $code, ...$extra]);

        return self::FAILURE;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function writeJson(array $data): void
    {
        $this->output->writeln(
            json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE),
            OutputInterface::OUTPUT_RAW
        );
    }
}
