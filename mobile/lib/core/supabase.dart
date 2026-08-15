import 'package:supabase_flutter/supabase_flutter.dart';

import 'env.dart';

/// The shared Supabase client. Handles auth AND all CRUD directly — the mobile
/// app talks to PostgREST the same way the web app's server components do, with
/// RLS enforcing company scoping. Only AI work goes through the Next.js API
/// (see [ApiClient]), because that needs server-held provider keys.
SupabaseClient get supabase => Supabase.instance.client;

/// The current user's JWT, or null when signed out. Used as the bearer token for
/// Next.js API calls.
String? get accessToken => supabase.auth.currentSession?.accessToken;

Future<void> initSupabase() async {
  await Supabase.initialize(
    url: Env.supabaseUrl,
    // Supabase renamed "anon key" to "publishable key"; the value is unchanged,
    // so the env var keeps the ANON name to match the web app's NEXT_PUBLIC_*.
    publishableKey: Env.supabaseAnonKey,
    // Sessions persist to secure storage and refresh in the background, so the
    // user stays signed in between launches (the web equivalent of cookies).
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );
}
