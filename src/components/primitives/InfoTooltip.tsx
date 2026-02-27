import { useEffect, useId, useRef, useState } from 'react';

import infoIcon from '../../assets/info.svg';

interface InfoTooltipProps {
  content: string;
  label: string;
  className?: string;
}

export function InfoTooltip({ content, label, className }: InfoTooltipProps) {
  const tooltipId = useId();
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);

  const isOpen = isHovered || isFocused || isPinnedOpen;

  useEffect(() => {
    function handleOutsidePointer(event: MouseEvent) {
      if (!isPinnedOpen) return;
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setIsPinnedOpen(false);
    }

    document.addEventListener('mousedown', handleOutsidePointer);
    return () => {
      document.removeEventListener('mousedown', handleOutsidePointer);
    };
  }, [isPinnedOpen]);

  return (
    <span ref={rootRef} className={['info-tooltip', className ?? ''].filter(Boolean).join(' ')}>
      <button
        ref={triggerRef}
        type="button"
        className="info-tooltip__trigger"
        aria-label={label}
        aria-expanded={isOpen}
        aria-controls={tooltipId}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          setIsPinnedOpen(false);
        }}
        onClick={() => setIsPinnedOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsHovered(false);
            setIsFocused(false);
            setIsPinnedOpen(false);
            triggerRef.current?.blur();
          }
        }}
      >
        <img src={infoIcon} alt="" className="info-tooltip__icon" aria-hidden="true" />
      </button>
      {isOpen ? (
        <span id={tooltipId} role="tooltip" className="info-tooltip__panel">
          {content}
        </span>
      ) : null}
    </span>
  );
}
