/**
 * A modern indeterminate top progress bar. Rendered inside route-level
 * `loading.tsx` files, so its lifetime is exactly the navigation's loading
 * window — no click detection or timing hacks needed, fully reliable.
 */
export function TopLoader() {
  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-primary/15"
      role="progressbar"
      aria-label="Loading page"
    >
      <div className="h-full w-full origin-left bg-gradient-to-r from-primary/40 via-primary to-primary/40 animate-progress-indeterminate" />
    </div>
  );
}
