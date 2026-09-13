<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('client_logo');
            $table->string('article_title')->nullable()->after('slug');
            $table->text('article_subtitle')->nullable()->after('article_title');
            $table->longText('article_content')->nullable()->after('article_subtitle');
            $table->string('initial_revenue')->nullable()->after('article_content');
            $table->string('current_revenue')->nullable()->after('initial_revenue');
            $table->string('initial_roas')->nullable()->after('current_revenue');
            $table->string('current_roas')->nullable()->after('initial_roas');
            $table->string('growth_percentage')->nullable()->after('current_roas');
            $table->text('collaboration_story')->nullable()->after('growth_percentage');
            $table->text('key_results')->nullable()->after('collaboration_story');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'slug',
                'article_title',
                'article_subtitle',
                'article_content',
                'initial_revenue',
                'current_revenue',
                'initial_roas',
                'current_roas',
                'growth_percentage',
                'collaboration_story',
                'key_results',
            ]);
        });
    }
};
