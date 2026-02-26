import type { CSSProperties, ElementType, HTMLAttributes, PropsWithChildren } from 'react';

import { type SpaceScale,spaceToken } from './shared';

type StackProps<T extends ElementType = 'div'> = PropsWithChildren<{
  as?: T;
  gap?: SpaceScale;
  className?: string;
  style?: CSSProperties;
}> &
  HTMLAttributes<HTMLElement>;

export function Stack<T extends ElementType = 'div'>(props: StackProps<T>) {
  const { as, gap = 16, className, style, children, ...rest } = props;
  const Comp = as ?? 'div';

  return (
    <Comp
      {...rest}
      className={className}
      style={{
        display: 'grid',
        gap: spaceToken(gap),
        ...style,
      }}
    >
      {children}
    </Comp>
  );
}
