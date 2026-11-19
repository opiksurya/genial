<?php

namespace App\Services\ClientPortal;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

/**
 * The single gateway for client-portal project data: every portal query must
 * take its project ids from here so a client never sees another client's data.
 */
final class ClientScope
{
    /** @var Collection<int, Project>|null */
    private ?Collection $projects = null;

    private function __construct(
        private readonly User $user,
        private readonly ?int $requestedProjectId,
    ) {}

    public static function for(Request $request): self
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->hasAnyRole(Project::MEMBER_ONLY_ROLES)) {
            abort(403);
        }

        $raw = $request->query('project_id');
        $requested = is_string($raw) && ctype_digit($raw) ? (int) $raw : null;

        return new self($user, $requested);
    }

    /**
     * @return Collection<int, Project>
     */
    public function projects(): Collection
    {
        return $this->projects ??= Project::visibleTo($this->user)
            ->select(['id', 'name', 'client', 'status', 'progress'])
            ->orderBy('name')
            ->get();
    }

    public function selectedProjectId(): ?int
    {
        if ($this->requestedProjectId === null) {
            return null;
        }

        return in_array($this->requestedProjectId, $this->allProjectIds(), true) ? $this->requestedProjectId : null;
    }

    /**
     * @return list<int>
     */
    public function projectIds(): array
    {
        $selected = $this->selectedProjectId();

        return $selected !== null ? [$selected] : $this->allProjectIds();
    }

    /**
     * @return list<int>
     */
    public function allProjectIds(): array
    {
        return array_values($this->projects()->map(fn (Project $project): int => (int) $project->id)->all());
    }
}
