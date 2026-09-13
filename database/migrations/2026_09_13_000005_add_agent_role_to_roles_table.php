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
        // Ensure Agent role exists in Spatie roles
        $agentRole = Role::firstOrCreate(['name' => 'Agent', 'guard_name' => 'web']);
        
        // Create agent specific permission
        $viewAgentPortalPermission = Permission::firstOrCreate(['name' => 'view agent portal', 'guard_name' => 'web']);
        
        $agentRole->givePermissionTo($viewAgentPortalPermission);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $role = Role::where('name', 'Agent')->first();
        if ($role) {
            $role->delete();
        }
    }
};
