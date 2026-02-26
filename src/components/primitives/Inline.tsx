import type { CSSProperties, ElementType, HTMLAttributes, PropsWithChildren } from 'react';

import { type SpaceScale,spaceToken } from './shared';

type Align = 'start' | 'center' | 'end' | 'stretch';
type Justify = 'start' | 'between' | 'end';

type InlineProps<T extends ElementType = 'div'> = PropsWithChildren<{
  as?: T;
  gap?: SpaceScale;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
}> &
  HTMLAttributes<HTMLElement>;

const alignMap: Record<Align, CSSProperties['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

const justifyMap: Record<Justify, CSSProperties['justifyContent']> = {
  start: 'flex-start',
  between: 'space-between',
  end: 'flex-end',
};

export function Inline<T extends ElementType = 'div'>(props: InlineProps<T>) {
  const {
    as,
    gap = 12,
    align = 'center',
    justify = 'start',
    wrap = false,
    className,
    style,
    children,
    ...rest
  } = props;
  const Comp = as ?? 'div';

  return (
    <Comp
      {...rest}
      className={className}
      style={{
        display: 'flex',
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
        gap: spaceToken(gap),
        flexWrap: wrap ? 'wrap' : 'nowrap',
        ...style,
      }}
    >
      {children}
    </Comp>
  );
}
