<?php

namespace App\Console\Commands;

use App\Actions\FinanceFlow\CreateExpense;
use App\Actions\FinanceFlow\CreateIncome;
use App\Concerns\InteractsWithFinanceBot;
use Illuminate\Console\Command;
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use Throwable;

class FinanceBotStore extends Command
{
    use InteractsWithFinanceBot;

    /**
     * Marker appended to notes/description so Telegram entries can be recognised.
     */
    public const TELEGRAM_MARKER = '[via Telegram]';

    /**
     * Folder on the public disk where bot attachments are stored.
     */
    public const ATTACHMENT_DIRECTORY = 'finance_attachments';

    /**
     * Largest attachment the bot may store, in bytes (10 MB).
     */
    public const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

    /**
     * Attachment MIME types the bot may store.
     *
     * @var list<string>
     */
    public const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'finance:bot-store
        {type : income atau expense}
        {--data= : Data dalam format JSON, field sama dengan form web}
        {--user= : Email user pelaku (Super Admin atau Admin)}
        {--attachment= : Path file lokal (jpg, png, webp, pdf) untuk lampiran/bukti}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Store an income or expense sent from the Telegram bot and print it as JSON';

    /**
     * @return array<string, mixed>
     */
    protected function payload(): array
    {
        $type = $this->argument('type');
        if (! in_array($type, ['income', 'expense'], true)) {
            throw new InvalidArgumentException('Tipe harus income atau expense.');
        }

        $user = $this->authorizedUser($this->option('user'), ['Super Admin', 'Admin']);
        $input = $this->decodedData();

        $attachmentField = $type === 'income' ? 'attachment' : 'proof_attachment';
        $noteField = $type === 'income' ? 'notes' : 'description';

        $input[$noteField] = $this->withTelegramMarker($input[$noteField] ?? null);

        $storedAttachment = $this->storeAttachment($this->option('attachment'));
        if ($storedAttachment !== null) {
            $input[$attachmentField] = $storedAttachment;
        }

        try {
            $record = $type === 'income'
                ? app(CreateIncome::class)->create($user, $input)
                : app(CreateExpense::class)->create($user, $input);
        } catch (Throwable $exception) {
            if ($storedAttachment !== null) {
                Storage::disk('public')->delete($storedAttachment);
            }

            throw $exception;
        }

        $record = $record->fresh($type === 'income'
            ? ['creator:id,name', 'project:id,name,client', 'agent:id,name']
            : ['creator:id,name', 'project:id,name,client', 'allocation:id,name', 'subAllocation:id,name']);

        $attachmentPath = $record->{$attachmentField};

        return [
            'type' => $type,
            'record' => $record->toArray(),
            'attachment_url' => $storedAttachment !== null && $attachmentPath === $storedAttachment
                ? Storage::disk('public')->url($storedAttachment)
                : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function decodedData(): array
    {
        $raw = $this->option('data');
        if (blank($raw)) {
            throw new InvalidArgumentException('Opsi --data=<json> wajib diisi.');
        }

        $data = json_decode($raw, true);
        if (! is_array($data) || array_is_list($data)) {
            throw new InvalidArgumentException('Opsi --data harus berupa objek JSON yang valid.');
        }

        return $data;
    }

    private function withTelegramMarker(mixed $text): mixed
    {
        if (! is_string($text) && $text !== null) {
            return $text;
        }

        $text = trim((string) $text);

        return $text === '' ? self::TELEGRAM_MARKER : $text."\n".self::TELEGRAM_MARKER;
    }

    /**
     * Copy a local file to the public disk and return its stored path.
     */
    private function storeAttachment(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        if (! is_file($path) || ! is_readable($path)) {
            throw new InvalidArgumentException('File lampiran tidak ditemukan atau tidak bisa dibaca.');
        }

        $file = new File($path);

        if ($file->getSize() > self::MAX_ATTACHMENT_BYTES) {
            throw new InvalidArgumentException('File lampiran melebihi 10 MB.');
        }

        if (! in_array($file->getMimeType(), self::ALLOWED_ATTACHMENT_TYPES, true)) {
            throw new InvalidArgumentException('Jenis file lampiran tidak didukung. Gunakan jpg, png, webp, atau pdf.');
        }

        $storedPath = Storage::disk('public')->putFile(self::ATTACHMENT_DIRECTORY, $file);
        if ($storedPath === false) {
            throw new InvalidArgumentException('File lampiran gagal disimpan.');
        }

        return $storedPath;
    }
}
