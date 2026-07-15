/// Port of the web app's `lib/auth/roles.ts`. Keep the two in sync — if a role's
/// access changes there, change it here too.
///
/// As on the web, this drives friendly UX (what to show, where to land) only.
/// RLS in Supabase is the real data boundary, so a mismatch here is a cosmetic
/// bug rather than a security hole.
library;

enum AppSection {
  dashboard,
  leads,
  calls,
  schedule,
  jobs,
  estimates,
  invoices,
  customers,
  materials,
  finance,
  coach,
  reviews,
  team,
  settings,
  billing,
}

enum TeamRole { owner, admin, dispatcher, estimator, technician, viewer }

TeamRole? teamRoleFromString(String? value) => switch (value) {
      'owner' => TeamRole.owner,
      'admin' => TeamRole.admin,
      'dispatcher' => TeamRole.dispatcher,
      'estimator' => TeamRole.estimator,
      'technician' => TeamRole.technician,
      'viewer' => TeamRole.viewer,
      _ => null,
    };

const _all = AppSection.values;

final _readonlyAll = _all
    .where((s) => s != AppSection.billing && s != AppSection.team)
    .toList();

/// Per-role section access (office surface). `technician` is intentionally empty
/// — technicians use the field surface only, and are routed away from the office.
final Map<TeamRole, List<AppSection>> _roleSections = {
  TeamRole.owner: _all,
  TeamRole.admin: _all.where((s) => s != AppSection.billing).toList(),
  TeamRole.dispatcher: const [
    AppSection.dashboard,
    AppSection.schedule,
    AppSection.jobs,
    AppSection.leads,
    AppSection.calls,
    AppSection.customers,
  ],
  TeamRole.estimator: const [
    AppSection.dashboard,
    AppSection.estimates,
    AppSection.customers,
    AppSection.leads,
  ],
  TeamRole.technician: const [],
  TeamRole.viewer: _readonlyAll,
};

bool canAccess(TeamRole role, AppSection section) =>
    _roleSections[role]?.contains(section) ?? false;

List<AppSection> accessibleSections(TeamRole role) => _roleSections[role] ?? [];

/// Viewer is read-only everywhere; technician has no office write access.
bool canWrite(TeamRole role) =>
    role != TeamRole.viewer && role != TeamRole.technician;

/// Where a user lands after login — mirrors `homeDestination(role)` on the web.
/// Estimating is the headline feature, so anyone who can write estimates opens
/// straight into the estimate screen.
String homeDestination(TeamRole role) {
  if (role == TeamRole.technician) return '/tech/today';
  if (canAccess(role, AppSection.estimates) && canWrite(role)) return '/';
  return '/dashboard';
}

const Map<TeamRole, String> roleLabels = {
  TeamRole.owner: 'Owner',
  TeamRole.admin: 'Admin',
  TeamRole.dispatcher: 'Dispatcher',
  TeamRole.estimator: 'Estimator',
  TeamRole.technician: 'Technician',
  TeamRole.viewer: 'Viewer',
};
