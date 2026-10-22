<?php

namespace Database\Seeders;

use App\Models\Project;
use Illuminate\Database\Seeder;

class CaseStudySeeder extends Seeder
{
    public function run(): void
    {
        // Clean up any dummy projects
        Project::where('client', 'LIKE', '%Batik%')
            ->orWhere('client', 'LIKE', '%Glowing%')
            ->orWhere('name', 'LIKE', '%E-Commerce Website & Omnichannel%')
            ->orWhere('name', 'LIKE', '%SEO & Performance Marketing%')
            ->delete();
    }
}
