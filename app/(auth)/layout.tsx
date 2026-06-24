/**
 * Pass-through group layout. Each leaf owns its own chrome: the login / register
 * / reset pages use <AuthShell> (two-column brand panel), while onboarding uses
 * its own centered wizard layout — so neither constrains the other.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
