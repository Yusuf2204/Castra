<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\UserTemplateInitializer;
use Illuminate\Console\Command;

class InitUserTemplatesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'castra:init-templates {--user_id= : Specific user ID to initialize} {--email= : Specific user email to initialize}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Initialize standard master financial templates for users';

    /**
     * Execute the console command.
     */
    public function handle(UserTemplateInitializer $initializer): int
    {
        $query = User::query();

        if ($userId = $this->option('user_id')) {
            $query->where('id', $userId);
        } elseif ($email = $this->option('email')) {
            $query->where('email', $email);
        }

        $users = $query->get();

        if ($users->isEmpty()) {
            $this->warn('No users found to initialize.');

            return self::SUCCESS;
        }

        foreach ($users as $user) {
            $this->info("Initializing templates for user: {$user->name} ({$user->email}, ID: {$user->id})...");
            $initializer->initialize($user);
        }

        $this->info('User financial templates initialized successfully.');

        return self::SUCCESS;
    }
}
