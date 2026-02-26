import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
};

export function Button({
  variant = 'secondary',
  isLoading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = isLoading || disabled === true;
  const classes = ['btn', variant === 'primary' ? 'btn-primary' : 'btn-secondary', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={isDisabled} {...rest}>
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
