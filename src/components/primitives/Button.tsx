import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'success';
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
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'success' ? 'btn-success' : 'btn-secondary';
  const classes = ['btn', variantClass, className ?? ''].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={isDisabled} {...rest}>
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
