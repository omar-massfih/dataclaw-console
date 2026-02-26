import { AppShell } from './components/layouts';
import { Stack, Surface, Text } from './components/primitives';
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

  return (
    <main className="app-shell">
      <AppShell sidebar={sidebar}>
        <ConnectorsPage />
      </AppShell>
    </main>
  );
}
