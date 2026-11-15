<?php

namespace App\Providers;

use App\Models\Project;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureProjectBinding();
    }

    /**
     * Every route with a {project} parameter answers 404 when a member-only user (Client, Reviewer)
     * asks for a project they do not belong to. Guests fall through to the auth middleware.
     */
    protected function configureProjectBinding(): void
    {
        Route::bind('project', function (string $value): Project {
            $project = Project::findOrFail($value);

            abort_unless($project->isVisibleTo(request()->user()), 404);

            return $project;
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
