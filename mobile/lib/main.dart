import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/env.dart';
import 'core/supabase.dart';
import 'router.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Env.load();
  await initSupabase();
  runApp(const ProviderScope(child: FieldOsApp()));
}

class FieldOsApp extends ConsumerWidget {
  const FieldOsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'FieldOS',
      debugShowCheckedModeBanner: false,
      routerConfig: ref.watch(routerProvider),
      // The office surface is the warm "paper" light theme, matching the web.
      // The technician screens opt into ink-900 themselves (see TechTodayScreen)
      // rather than following the system setting — that surface is dark by
      // design, for outdoor glare, not by user preference.
      theme: lightTheme,
      darkTheme: lightTheme,
      themeMode: ThemeMode.light,
    );
  }
}
