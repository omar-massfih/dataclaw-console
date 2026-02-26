import type { CSSProperties, ElementType, HTMLAttributes, PropsWithChildren } from 'react';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'small';
type TextTone = 'default' | 'muted' | 'danger';
type TextWeight = 'regular' | 'medium' | 'bold';

type TextProps<T extends ElementType = 'p'> = PropsWithChildren<{
  as?: T;
  variant?: TextVariant;
  tone?: TextTone;
  weight?: TextWeight;
  className?: string;
  style?: CSSProperties;
}> &
  HTMLAttributes<HTMLElement>;

const variantStyles: Record<TextVariant, CSSProperties> = {
  h1: { fontSize: 'var(--font-size-h1)', lineHeight: 'var(--line-height-heading)' },
  h2: { fontSize: 'var(--font-size-h2)', lineHeight: 'var(--line-height-heading)' },
  h3: { fontSize: 'var(--font-size-h3)', lineHeight: 'var(--line-height-heading)' },
  body: { fontSize: 'var(--font-size-body)', lineHeight: 'var(--line-height-body)' },
  small: { fontSize: 'var(--font-size-small)', lineHeight: 'var(--line-height-small)' },
};

const toneStyles: Record<TextTone, CSSProperties> = {
  default: { color: 'var(--color-text)' },
  muted: { color: 'var(--color-muted)' },
  danger: { color: 'var(--color-danger)' },
};

const weightStyles: Record<TextWeight, CSSProperties> = {
  regular: { fontWeight: 400 },
  medium: { fontWeight: 500 },
  bold: { fontWeight: 700 },
};

export function Text<T extends ElementType = 'p'>(props: TextProps<T>) {
  const {
    as,
    variant = 'body',
    tone = 'default',
    weight = 'regular',
    className,
    style,
    children,
    ...rest
  } = props;
  const Comp = as ?? 'p';

  return (
    <Comp
      {...rest}
      className={className}
      style={{
        margin: 0,
        ...variantStyles[variant],
        ...toneStyles[tone],
        ...weightStyles[weight],
        ...style,
      }}
    >
      {children}
    </Comp>
  );
}
