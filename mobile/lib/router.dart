import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/supabase.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/session_controller.dart';
import 'features/estimates/estimate_draft_screen.dart';
import 'features/home/estimate_home_screen.dart';
import 'features/shell/app_shell.dart';
import 'features/shell/coming_soon_screen.dart';
import 'features/tech/tech_today_screen.dart';
import 'models/estimate.dart';
import 'models/team_role.dart';
import 'widgets/brand_mark.dart';

/// Rebuilds the router when auth state changes, so sign-in/sign-out redirect.
class _AuthRefresh extends ChangeNotifier {
  _AuthRefresh(Ref ref) {
    ref.listen(authStateProvider, (_, __) => notifyListeners());
  }
}

final _refreshProvider = Provider((ref) => _AuthRefresh(ref));

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    refreshListenable: ref.watch(_refreshProvider),
    // Only the session (synchronously available) drives redirects. Role-based
    // landing is decided in _HomeGate instead, because the role loads
    // asynchronously and a redirect can't await it without misrouting.
    redirect: (context, state) {
      final signedIn = supabase.auth.currentSession != null;
      final atLogin = state.matchedLocation == '/login';

      if (!signedIn) return atLogin ? null : '/login';
      if (atLogin) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/estimates/draft',
        builder: (_, state) =>
            EstimateDraftScreen(draft: state.extra! as EstimateDraft),
      ),
      GoRoute(path: '/tech/today', builder: (_, __) => const TechTodayScreen()),
      ShellRoute(
        builder: (_, __, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (_, __) => const _HomeGate()),
          // Every remaining section resolves to an honest placeholder until its
          // screen is built — see mobile/README.md for the running order.
          ...allSections.map(
            (s) => GoRoute(
              path: s.route,
              builder: (_, __) => ComingSoonScreen(title: s.label),
            ),
          ),
        ],
      ),
    ],
  );
});

/// Decides what "home" means for this user, mirroring `homeDestination(role)`
/// on the web: technicians get the field surface, estimate-writers get the
/// estimate prompt, everyone else gets the dashboard.
class _HomeGate extends ConsumerWidget {
  const _HomeGate();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(activeContextProvider);

    return async.when(
      loading: () => const _Splash(),
      error: (_, __) => const _LoadFailed(),
      data: (ctx) {
        // Signed in but no accepted membership — the web app sends these users
        // to /onboarding/company, which mobile doesn't implement yet.
        if (ctx == null) return const _NeedsOnboarding();
        if (ctx.role == TeamRole.technician) return const TechTodayScreen();
        if (!canAccess(ctx.role, AppSection.estimates) || !canWrite(ctx.role)) {
          return const ComingSoonScreen(title: 'Dashboard');
        }
        return const EstimateHomeScreen();
      },
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) => const Scaffold(
        body: Center(child: BrandMark(size: 48)),
      );
}

class _LoadFailed extends ConsumerWidget {
  const _LoadFailed();

  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  "Couldn't load your workspace.",
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Check your connection and try again.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: () => ref.invalidate(activeContextProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
}

class _NeedsOnboarding extends ConsumerWidget {
  const _NeedsOnboarding();

  @override
  Widget build(BuildContext context, WidgetRef ref) => Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const BrandMark(size: 44),
                const SizedBox(height: 24),
                const Text(
                  'Finish setting up on the web',
                  style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                const Text(
                  'This account has no company yet. Complete onboarding in the '
                  'web app, then sign back in here.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                OutlinedButton(
                  onPressed: () => ref.read(authControllerProvider).signOut(),
                  child: const Text('Sign out'),
                ),
              ],
            ),
          ),
        ),
      );
}
