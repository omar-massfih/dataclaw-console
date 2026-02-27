import type { InputHTMLAttributes } from 'react';

import { InfoTooltip } from './InfoTooltip';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  infoTooltip?: string;
};

export function Input({
  label,
  error,
  infoTooltip,
  className,
  id,
  'aria-label': ariaLabelProp,
  ...rest
}: InputProps) {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const ariaLabel = ariaLabelProp ?? label;

  if (!label) {
    return (
      <input
        id={inputId}
        className={['field-input', className ?? ''].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
        aria-invalid={error ? 'true' : rest['aria-invalid']}
        {...rest}
      />
    );
  }

  return (
    <label className="field-label">
      <span className="field-label__row">
        <span className="field-label__title">{label}</span>
        {infoTooltip ? <InfoTooltip label={`About ${label}`} content={infoTooltip} /> : null}
      </span>
      <input
        id={inputId}
        className={['field-input', className ?? ''].filter(Boolean).join(' ')}
        aria-label={ariaLabel}
        aria-invalid={error ? 'true' : rest['aria-invalid']}
        {...rest}
      />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
