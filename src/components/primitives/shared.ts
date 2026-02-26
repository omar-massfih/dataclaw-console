export type SpaceScale = 4 | 8 | 12 | 16 | 24 | 32 | 48;

export function spaceToken(value: SpaceScale): string {
  return `var(--space-${value})`;
}
