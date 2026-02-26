import { AppShell } from './components/layouts';
import { Inline, Stack, Surface, Text } from './components/primitives';
import { ConnectorsPage } from './features/connectors';

export default function App() {
  const sidebar = (
    <Stack gap={12}>
      <Surface as="section" aria-labelledby="sidebar-title">
        <Stack gap={12}>
          <Text as="h2" variant="h3" weight="bold" id="sidebar-title">
            DataClaw Console
          </Text>
          <Text variant="small" tone="muted">
            Standardized app shell template
          </Text>
          <ul className="sidebar-nav" aria-label="Primary navigation">
            <li className="sidebar-nav__item">
              <Text as="span" weight="bold">
                Connectors
              </Text>
            </li>
            <li className="sidebar-nav__item">
              <Text as="span" tone="muted">
                Domains
              </Text>
            </li>
            <li className="sidebar-nav__item">
              <Text as="span" tone="muted">
                Runs (coming soon)
              </Text>
            </li>
          </ul>
        </Stack>
      </Surface>
    </Stack>
  );

  const header = (
    <Surface as="section" className="hero-card" elevated aria-labelledby="app-title">
      <Stack gap={16}>
        <Text as="p" variant="small" weight="bold" className="eyebrow">
          DataClaw Console
        </Text>
        <Text as="h1" variant="h1" weight="bold" id="app-title">
          Connectors Config (V1)
        </Text>
        <Text tone="muted">
          Built with primitives plus reusable page templates. Manage connector drafts, validate
          config, and export YAML from the backend config API.
        </Text>
        <Inline gap={12} wrap>
          <span className="status-chip status-primary">app shell</span>
          <span className="status-chip status-success">connectors api</span>
          <span className="status-chip status-warning">yaml export</span>
        </Inline>
      </Stack>
    </Surface>
  );

  return (
    <main className="app-shell">
      <AppShell sidebar={sidebar} header={header}>
        <ConnectorsPage />
      </AppShell>
    </main>
  );
}
