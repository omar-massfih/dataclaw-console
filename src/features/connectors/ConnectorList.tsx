import { Button, Inline, Input, Stack, Text } from '../../components/primitives';
import type { ConnectorDraft } from './types';

interface ConnectorListProps {
  connectors: ConnectorDraft[];
  selectedConnectorId: string | null;
  filter: string;
  isLoading: boolean;
  onFilterChange: (value: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function ConnectorList({
  connectors,
  selectedConnectorId,
  filter,
  isLoading,
  onFilterChange,
  onSelect,
  onCreate,
}: ConnectorListProps) {
  return (
    <Stack gap={12}>
      <Input
        aria-label="Filter connectors"
        placeholder="Filter by id or kind"
        value={filter}
        onChange={(event) => onFilterChange(event.target.value)}
      />

      {isLoading ? <Text tone="muted">Loading connectors...</Text> : null}

      {!isLoading && connectors.length === 0 ? (
        <div className="connectors-empty">
          <Stack gap={12}>
            <Text tone="muted">No connector drafts yet.</Text>
            <Inline>
              <Button type="button" variant="primary" onClick={onCreate}>
                Create first connector
              </Button>
            </Inline>
          </Stack>
        </div>
      ) : null}

      {!isLoading && connectors.length > 0 ? (
        <ul className="connectors-list" aria-label="Connector drafts">
          {connectors.map((connector) => {
            const active = connector.id === selectedConnectorId;
            return (
              <li key={connector.id}>
                <button
                  type="button"
                  className={`connectors-list__row${active ? ' connectors-list__row--active' : ''}`}
                  onClick={() => onSelect(connector.id)}
                >
                  <span>
                    <Text as="span" weight="bold">
                      {connector.id}
                    </Text>
                    <Text as="span" variant="small" tone="muted" className="connectors-list__sub">
                      {connector.kind}
                    </Text>
                  </span>
                  <span className={`status-chip ${connector.enabled ? 'status-success' : 'status-warning'}`}>
                    {connector.enabled ? 'enabled' : 'disabled'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </Stack>
  );
}
