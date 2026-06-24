/**
 * Rotating tinted icon-chip colours for marketing feature cards. Static literal
 * class strings so Tailwind's JIT picks them up. Mirrors the app nav palette.
 */
export const CHIP_COLORS = [
  "bg-primary/10 text-primary",
  "bg-[#2563EB]/10 text-[#2563EB]",
  "bg-[#7C3AED]/10 text-[#7C3AED]",
  "bg-success/10 text-success",
  "bg-[#0EA5E9]/10 text-[#0EA5E9]",
  "bg-warning/10 text-warning",
];

export function chipColor(i: number): string {
  return CHIP_COLORS[i % CHIP_COLORS.length];
}
