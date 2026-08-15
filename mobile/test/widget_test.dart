import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:fieldos_mobile/models/team_role.dart';
import 'package:fieldos_mobile/theme/tokens.dart';

void main() {
  group('design tokens match the web', () {
    test('primary is Signal Orange #FF5A1F in both themes', () {
      // globals.css: --primary: 16 100% 56%. The brand colour must not drift
      // between surfaces or from the web app.
      const signalOrange = Color(0xFFFF5A1F);
      expect(FieldColors.light.primary, signalOrange);
      expect(FieldColors.dark.primary, signalOrange);
    });

    test('dark background is the ink-900 base', () {
      // globals.css .dark: --background: 210 12% 9%, which converts to #14171A.
      //
      // Note the web app is internally inconsistent here by one unit per
      // channel: public/icon.svg and the --shadow-card rgba() both hardcode
      // rgb(21,24,27) = #15181B. We follow the CSS token, since that's what
      // actually paints the web surface we're matching. The difference is
      // imperceptible — this test exists to catch real drift, not to reconcile
      // that 1/255.
      expect(FieldColors.dark.background, const Color(0xFF14171A));
    });
  });

  group('role access mirrors lib/auth/roles.ts', () {
    test('technician has no office sections', () {
      expect(accessibleSections(TeamRole.technician), isEmpty);
    });

    test('owner reaches billing but admin does not', () {
      expect(canAccess(TeamRole.owner, AppSection.billing), isTrue);
      expect(canAccess(TeamRole.admin, AppSection.billing), isFalse);
    });

    test('viewer is read-only', () {
      expect(canWrite(TeamRole.viewer), isFalse);
      expect(canWrite(TeamRole.estimator), isTrue);
    });

    test('landing destination is role-aware', () {
      // Estimate-writers open straight into the estimate prompt; dispatchers
      // (no estimate access) get the dashboard; technicians get the field app.
      expect(homeDestination(TeamRole.owner), '/');
      expect(homeDestination(TeamRole.estimator), '/');
      expect(homeDestination(TeamRole.dispatcher), '/dashboard');
      expect(homeDestination(TeamRole.viewer), '/dashboard');
      expect(homeDestination(TeamRole.technician), '/tech/today');
    });
  });
}
