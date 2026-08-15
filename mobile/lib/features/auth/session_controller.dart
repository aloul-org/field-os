import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/supabase.dart';
import '../../models/team_role.dart';

/// The signed-in user's company + membership, mirroring `ActiveContext` and
/// `getActiveContext()` in the web app's `lib/auth/session.ts`.
class ActiveContext {
  const ActiveContext({
    required this.user,
    required this.company,
    required this.member,
    required this.role,
  });

  final User user;
  final Map<String, dynamic> company;
  final Map<String, dynamic> member;
  final TeamRole role;

  String get companyId => company['id'] as String;
  String get companyName => (company['name'] as String?) ?? 'Your company';
  String get memberName => (member['name'] as String?) ?? user.email ?? '';
  String get trade => (company['trade'] as String?) ?? '';
  String get region => (company['region'] as String?) ?? 'UK';

  /// Currency symbol for the company's region. The web app formats money
  /// server-side; mobile has to derive it, and region is what drives it there.
  String get currencySymbol => switch (region) {
        'DE' || 'AT' || 'FR' || 'ES' || 'IT' || 'NL' => '€',
        'US' => r'$',
        _ => '£',
      };
}

/// Streams auth state so the router redirects on sign-in/sign-out automatically.
final authStateProvider = StreamProvider<AuthState>(
  (ref) => supabase.auth.onAuthStateChange,
);

/// Resolves the active context for the signed-in user, or null when signed out
/// or not yet onboarded (no accepted team membership — the web app sends those
/// users to /onboarding/company).
///
/// Rebuilds whenever auth state changes, so signing out clears it.
final activeContextProvider = FutureProvider<ActiveContext?>((ref) async {
  // Establish the dependency so this refetches on login/logout.
  ref.watch(authStateProvider);

  final user = supabase.auth.currentUser;
  if (user == null) return null;

  // Same lookup as the web: first accepted membership, oldest first.
  final member = await supabase
      .from('team_members')
      .select()
      .eq('user_id', user.id)
      .not('invite_accepted_at', 'is', null)
      .order('created_at', ascending: true)
      .limit(1)
      .maybeSingle();

  if (member == null) return null;

  final company = await supabase
      .from('companies')
      .select()
      .eq('id', member['company_id'] as String)
      .maybeSingle();

  if (company == null) return null;

  final role = teamRoleFromString(member['role'] as String?);
  if (role == null) return null;

  return ActiveContext(
    user: user,
    company: company,
    member: member,
    role: role,
  );
});

/// Sign-in / sign-out actions.
class AuthController {
  Future<void> signIn({required String email, required String password}) async {
    await supabase.auth.signInWithPassword(email: email, password: password);
  }

  Future<void> signOut() => supabase.auth.signOut();
}

final authControllerProvider = Provider((ref) => AuthController());
