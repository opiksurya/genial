<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ensure Client role exists in Spatie roles
        $clientRole = Role::firstOrCreate(['name' => 'Client', 'guard_name' => 'web']);
        
        // Create client specific permission if needed
        $viewClientProjectsPermission = Permission::firstOrCreate(['name' => 'view client projects', 'guard_name' => 'web']);
        
        $clientRole->givePermissionTo($viewClientProjectsPermission);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $role = Role::where('name', 'Client')->first();
        if ($role) {
            $role->delete();
        }
    }
};
