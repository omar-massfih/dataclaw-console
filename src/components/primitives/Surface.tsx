import type { CSSProperties, ElementType, HTMLAttributes, PropsWithChildren } from 'react';

type Padding = 12 | 16 | 24 | 32;

type SurfaceProps<T extends ElementType = 'section'> = PropsWithChildren<{
  as?: T;
  padding?: Padding;
  bordered?: boolean;
  elevated?: boolean;
  className?: string;
  style?: CSSProperties;
}> &
  HTMLAttributes<HTMLElement>;

export function Surface<T extends ElementType = 'section'>(props: SurfaceProps<T>) {
  const {
    as,
    padding = 24,
    bordered = true,
    elevated = false,
    className,
    children,
    style,
    ...rest
  } = props;
  const Comp = as ?? 'section';

  const classes = [
    'surface',
    bordered ? 'surface--bordered' : '',
    elevated ? 'surface--elevated' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Comp {...rest} className={classes} style={{ padding: `var(--space-${padding})`, ...style }}>
      {children}
    </Comp>
  );
}
