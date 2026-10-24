<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The application timezone moved from UTC to Asia/Jakarta (WIB, UTC+7, no DST).
 * Laravel stores datetimes as wall-clock text in the application timezone, so
 * every existing UTC value is shifted by +7 hours to keep the same instant.
 */
return new class extends Migration
{
    private const OFFSET_HOURS = 7;

    /**
     * Framework tables whose time columns are epoch integers or must not change.
     *
     * @var list<string>
     */
    private const SKIPPED_TABLES = [
        'migrations',
        'jobs',
        'job_batches',
        'failed_jobs',
        'sessions',
        'cache',
        'cache_locks',
    ];

    /**
     * Columns that already hold WIB wall-clock values (entered via datetime-local inputs).
     *
     * @var list<string>
     */
    private const SKIPPED_COLUMNS = [
        'meetings.start_time',
        'meetings.end_time',
    ];

    /**
     * @var list<string>
     */
    private const DATETIME_TYPES = [
        'datetime',
        'datetimetz',
        'timestamp',
        'timestamptz',
        'timestamp without time zone',
        'timestamp with time zone',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->shiftAll(self::OFFSET_HOURS);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->shiftAll(-self::OFFSET_HOURS);
    }

    /**
     * List every datetime/timestamp column that this migration converts.
     *
     * @return list<array{table: string, column: string}>
     */
    public function datetimeColumns(): array
    {
        $columns = [];

        foreach (Schema::getTables() as $table) {
            $tableName = $table['name'];

            if (in_array($tableName, self::SKIPPED_TABLES, true) || str_starts_with($tableName, 'sqlite_')) {
                continue;
            }

            foreach (Schema::getColumns($tableName) as $column) {
                if (! in_array(strtolower($column['type_name']), self::DATETIME_TYPES, true)) {
                    continue;
                }

                if (in_array("{$tableName}.{$column['name']}", self::SKIPPED_COLUMNS, true)) {
                    continue;
                }

                $columns[] = ['table' => $tableName, 'column' => $column['name']];
            }
        }

        return $columns;
    }

    /**
     * Shift every converted column by the given number of hours in one transaction.
     */
    private function shiftAll(int $hours): void
    {
        DB::transaction(function () use ($hours): void {
            foreach ($this->datetimeColumns() as ['table' => $table, 'column' => $column]) {
                DB::table($table)
                    ->whereNotNull($column)
                    ->update([$column => DB::raw($this->shiftExpression(DB::getQueryGrammar()->wrap($column), $hours))]);
            }
        });
    }

    /**
     * Build a driver-specific SQL expression that adds hours to a datetime column.
     * On SQLite, values that cannot be parsed as a datetime are left untouched.
     */
    private function shiftExpression(string $wrappedColumn, int $hours): string
    {
        return match (DB::getDriverName()) {
            'sqlite' => sprintf("coalesce(datetime(%s, '%+d hours'), %s)", $wrappedColumn, $hours, $wrappedColumn),
            'mysql', 'mariadb' => sprintf('date_add(%s, interval %d hour)', $wrappedColumn, $hours),
            'pgsql' => sprintf("%s + interval '%d hours'", $wrappedColumn, $hours),
            default => throw new RuntimeException('Unsupported database driver for timezone conversion.'),
        };
    }
};
