interface ConnectorJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
}

export function ConnectorJsonEditor({
  value,
  onChange,
  error,
  disabled = false,
}: ConnectorJsonEditorProps) {
  return (
    <label className="field-label">
      Settings (JSON)
      <textarea
        className="field-input connectors-form-json"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={14}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        spellCheck={false}
      />
      <span className="field-hint">
        Backend validates connector settings by kind (`sql_reader`, `milvus`, `kafka`).
      </span>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
