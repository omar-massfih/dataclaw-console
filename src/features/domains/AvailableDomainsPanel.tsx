import { Button, Inline, Input, Stack, Surface, Text } from '../../components/primitives';
import { useAvailableDomains } from './useAvailableDomains';

export function AvailableDomainsPanel() {
  const { isLoading, error, filter, setFilter, visibleDomains, refresh } = useAvailableDomains();

  return (
    <Surface as="section" aria-labelledby="available-domains-title" className="domains-panel" elevated>
      <Stack gap={16}>
        <Inline justify="between" align="center" wrap gap={12}>
          <Stack gap={4}>
            <Text as="h2" variant="h2" weight="bold" id="available-domains-title">
              Available Domains
            </Text>
            <Text tone="muted">
              Loaded from <code>/api/agent/health</code>.
            </Text>
          </Stack>
          <Button type="button" variant="secondary" onClick={() => void refresh()}>
            Refresh
          </Button>
        </Inline>

        <Input
          aria-label="Filter domains"
          placeholder="Filter domains (e.g. sql)"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />

        {isLoading ? (
          <Text tone="muted">Loading domains...</Text>
        ) : null}

        {!isLoading && error ? (
          <Surface as="div" padding={16} className="domains-alert">
            <Stack gap={12}>
              <Text tone="danger" weight="bold">
                Failed to load domains
              </Text>
              <Text tone="muted">{error}</Text>
              <Inline gap={12}>
                <Button type="button" variant="primary" onClick={() => void refresh()}>
                  Retry
                </Button>
              </Inline>
            </Stack>
          </Surface>
        ) : null}

        {!isLoading && !error && visibleDomains.length === 0 ? (
          <Text tone="muted">No domains available.</Text>
        ) : null}

        {!isLoading && !error && visibleDomains.length > 0 ? (
          <Stack as="ul" gap={8} className="domains-list" aria-label="Available domain list">
            {visibleDomains.map((domain) => (
              <li key={domain.key} className="domains-row">
                <Inline justify="between" align="center" gap={12}>
                  <Stack gap={4}>
                    <Text as="span" variant="body" weight="bold">
                      {domain.label || domain.key}
                    </Text>
                    <Text as="span" variant="small" tone="muted">
                      {domain.key}
                    </Text>
                  </Stack>
                  <span className="status-chip status-primary">available</span>
                </Inline>
              </li>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Surface>
  );
}
