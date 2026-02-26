const semanticSwatches = [
  ['Background', '--color-bg', 'Page canvas'],
  ['Surface', '--color-surface', 'Cards and panels'],
  ['Text', '--color-text', 'Primary text'],
  ['Muted', '--color-muted', 'Secondary text'],
  ['Primary', '--color-primary', 'Actions and links'],
  ['Danger', '--color-danger', 'Error states'],
  ['Border', '--color-border', 'Inputs and dividers'],
  ['Focus', '--color-focus', 'Focus ring'],
  ['Success', '--color-success', 'Positive states'],
  ['Warning', '--color-warning', 'Warning states'],
] as const;

const spacingScale = [4, 8, 12, 16, 24, 32, 48] as const;

function ColorSwatch(props: { name: string; token: string; note: string }) {
  const { name, token, note } = props;

  return (
    <article className="swatch">
      <div className="swatch-chip" style={{ background: `var(${token})` }} aria-hidden="true" />
      <p className="swatch-name">{name}</p>
      <p className="swatch-note">
        <code>{token}</code> · {note}
      </p>
    </article>
  );
}

export default function App() {
  return (
    <main className="app-shell">
      <div className="page-stack">
        <section className="hero-card" aria-labelledby="design-system-title">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">DataClaw Console</p>
              <h1 id="design-system-title">Small design system contract</h1>
              <p className="muted hero-copy">
                Lock spacing, type, semantic colors, and interaction rules once. Future UI should
                reuse this contract instead of inventing new values. Visual direction: sharper,
                border-led, Carbon-like system UI.
              </p>
              <div className="toolbar" role="group" aria-label="Interaction states">
                <button className="btn btn-primary" type="button">
                  Primary
                </button>
                <button className="btn btn-secondary" type="button">
                  Secondary
                </button>
                <button className="btn btn-primary" type="button" disabled>
                  Disabled
                </button>
              </div>
            </div>

            <aside className="panel" aria-labelledby="interaction-rules-title">
              <h2 id="interaction-rules-title" className="panel-title">
                Interaction rules (locked)
              </h2>
              <ul className="panel-list">
                <li>Hover: increase contrast, no layout shift.</li>
                <li>Active: stronger pressed state than hover.</li>
                <li>Focus: one global ring via `:focus-visible` and `--color-focus`.</li>
                <li>Disabled: reduced opacity, no hover/active response.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="grid grid-2" aria-label="Design system previews">
          <section className="panel" aria-labelledby="spacing-scale-title">
            <h2 id="spacing-scale-title" className="panel-title">
              Spacing scale
            </h2>
            <p className="panel-copy">Use only: 4, 8, 12, 16, 24, 32, 48.</p>
            <div className="scale-list">
              {spacingScale.map((space) => (
                <div key={space} className="scale-item">
                  <p className="scale-item-label">
                    <code>{`--space-${space}`}</code> ({space}px)
                  </p>
                  <div
                    className="scale-bar"
                    style={{ width: `var(--space-${space})` }}
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="type-scale-title">
            <h2 id="type-scale-title" className="panel-title">
              Type scale
            </h2>
            <p className="panel-copy">Three headings, one body, one small. Nothing extra.</p>
            <div className="type-stack">
              <div className="type-sample">
                <small>
                  <code>--font-size-h1</code>
                </small>
                <h1>Heading 1 sample</h1>
              </div>
              <div className="type-sample">
                <small>
                  <code>--font-size-h2</code>
                </small>
                <h2>Heading 2 sample</h2>
              </div>
              <div className="type-sample">
                <small>
                  <code>--font-size-h3</code>
                </small>
                <h3>Heading 3 sample</h3>
              </div>
              <div className="type-sample">
                <small>
                  <code>--font-size-body</code>
                </small>
                <p className="type-body">Body text for descriptions, forms, and normal content.</p>
              </div>
              <div className="type-sample">
                <small>
                  <code>--font-size-small</code>
                </small>
                <p className="type-small">Small text for hints, metadata, and support copy.</p>
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="semantic-colors-title">
            <h2 id="semantic-colors-title" className="panel-title">
              Semantic colors (10 roles)
            </h2>
            <p className="panel-copy">Map colors to roles, not component-specific names.</p>
            <div className="swatch-grid">
              {semanticSwatches.map(([name, token, note]) => (
                <ColorSwatch key={token} name={name} token={token} note={note} />
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="state-rules-title">
            <h2 id="state-rules-title" className="panel-title">
              Derived state patterns
            </h2>
            <p className="panel-copy">
              Status visuals are derived from the compact semantic set using shared rules and
              rendered as rectangular tags (not pills).
            </p>
            <div className="status-row" aria-label="Derived status chips">
              <div className="status-chip status-primary">Primary</div>
              <div className="status-chip status-success">Success</div>
              <div className="status-chip status-warning">Warning</div>
              <div className="status-chip status-danger">Danger</div>
            </div>
            <div className="field-group">
              <label className="field-label">
                Example input
                <input className="field-input" placeholder="Focus me with keyboard" type="text" />
              </label>
              <p className="field-hint">Hover, focus, invalid, and disabled are shared globally.</p>
            </div>
            <div className="field-group">
              <label className="field-label">
                Invalid input
                <input className="field-input" aria-invalid="true" defaultValue="Broken value" />
              </label>
              <p className="field-error">Danger color is reused for invalid state messaging.</p>
            </div>
            <div className="field-group">
              <label className="field-label">
                Disabled input
                <input className="field-input" defaultValue="Disabled control" disabled />
              </label>
            </div>
          </section>
        </section>

        <section className="panel" aria-labelledby="contract-checklist-title">
          <h2 id="contract-checklist-title" className="panel-title">
            Review checklist
          </h2>
          <div className="contract-grid">
            <div className="meta-card">
              <p className="meta-label">Spacing</p>
              <p className="meta-value">4 / 8 / 12 / 16 / 24 / 32 / 48 only</p>
            </div>
            <div className="meta-card">
              <p className="meta-label">Type</p>
              <p className="meta-value">H1 / H2 / H3 / Body / Small</p>
            </div>
            <div className="meta-card">
              <p className="meta-label">Colors</p>
              <p className="meta-value">Semantic roles, no raw hex outside tokens</p>
            </div>
          </div>
          <ul className="panel-list">
            <li>Do not add ad hoc spacing or font sizes in feature styles.</li>
            <li>Use semantic tokens (`--color-*`) and derive states with shared patterns.</li>
            <li>Review hover, active, focus, and disabled states before merging.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
