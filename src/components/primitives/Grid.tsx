import type { CSSProperties, PropsWithChildren } from 'react';

import { type SpaceScale,spaceToken } from './shared';

type GridProps = PropsWithChildren<{
  gap?: SpaceScale;
  minItemWidth?: number;
  className?: string;
  style?: CSSProperties;
}>;

export function Grid(props: GridProps) {
  const { gap = 16, minItemWidth = 240, className, style, children } = props;

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gap: spaceToken(gap),
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
