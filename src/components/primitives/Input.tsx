import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...rest }: InputProps) {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  if (!label) {
    return (
      <input
        id={inputId}
        className={['field-input', className ?? ''].filter(Boolean).join(' ')}
        aria-invalid={error ? 'true' : rest['aria-invalid']}
        {...rest}
      />
    );
  }

  return (
    <label className="field-label">
      {label}
      <input
        id={inputId}
        className={['field-input', className ?? ''].filter(Boolean).join(' ')}
        aria-invalid={error ? 'true' : rest['aria-invalid']}
        {...rest}
      />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
