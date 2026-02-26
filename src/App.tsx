import { Inline, Stack, Surface, Text } from './components/primitives';
import { AvailableDomainsPanel } from './features/domains';

export default function App() {
  return (
    <main className="app-shell">
      <div className="page-stack">
        <Surface as="section" className="hero-card" elevated aria-labelledby="app-title">
          <Stack gap={16}>
            <Text as="p" variant="small" weight="bold" className="eyebrow">
              DataClaw Console
            </Text>
            <Text as="h1" variant="h1" weight="bold" id="app-title">
              Available domains (MVP)
            </Text>
            <Text tone="muted">
              Built with primitives first: layout, typography, surfaces, and shared controls. This
              avoids one-off div soup and keeps the UI consistent.
            </Text>
            <Inline gap={12} wrap>
              <span className="status-chip status-primary">primitives</span>
              <span className="status-chip status-success">domains list</span>
              <span className="status-chip status-warning">mvp</span>
            </Inline>
          </Stack>
        </Surface>

        <AvailableDomainsPanel />
      </div>
    </main>
  );
}
