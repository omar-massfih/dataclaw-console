import { AppShell } from './components/layouts';
import { Stack, Surface, Text } from './components/primitives';
import { ConnectorsPage } from './features/connectors';

export default function App() {
  const sidebar = (
    <Stack gap={12} className="app-sidebar">
      <Surface as="section" aria-labelledby="sidebar-title">
        <Stack gap={12}>
          <Text as="h2" variant="h3" weight="bold" id="sidebar-title">
            DataClaw Console
          </Text>
          <Text variant="small" tone="muted">
            Admin operations
          </Text>
          <nav aria-label="Primary navigation">
            <ul className="app-nav">
              <li className="app-nav__item">
                <button type="button" className="app-nav__link" aria-current="page">
                  <span>Connectors</span>
                  <span className="app-nav__meta">Config drafts</span>
                </button>
              </li>
              <li className="app-nav__item">
                <button type="button" className="app-nav__link">
                  <span>Domains</span>
                  <span className="app-nav__meta">Runtime health</span>
                </button>
              </li>
              <li className="app-nav__item">
                <button type="button" className="app-nav__link" data-disabled="true" disabled>
                  <span>Runs</span>
                  <span className="app-nav__meta">Coming soon</span>
                </button>
              </li>
            </ul>
          </nav>
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
