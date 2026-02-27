import { Button, Inline, Input, Stack, Text } from '../../components/primitives';
import type { ConnectorDraft } from './types';

interface ConnectorListProps {
  connectors: ConnectorDraft[];
  selectedConnectorId: string | null;
  pendingDeleteId: string | null;
  filter: string;
  isLoading: boolean;
  isDeleting: boolean;
  onFilterChange: (value: string) => void;
  onSelectInList: (id: string) => void;
  onEditSelected: () => void;
  onStartDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onCreate: () => void;
}

export function ConnectorList({
  connectors,
  selectedConnectorId,
  pendingDeleteId,
  filter,
  isLoading,
  isDeleting,
  onFilterChange,
  onSelectInList,
  onEditSelected,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
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
            const confirmingDelete = pendingDeleteId === connector.id;
            return (
              <li key={connector.id}>
                <button
                  type="button"
                  className={`connectors-list__row${active ? ' connectors-list__row--active connectors-list__row--selected' : ''}`}
                  onClick={() => onSelectInList(connector.id)}
                >
                  <span>
                    <Text as="span" weight="bold">
                      {connector.id}
                    </Text>
                    <Text as="span" variant="small" tone="muted" className="connectors-list__sub">
                      {connector.kind}
                    </Text>
                  </span>
                  <Inline gap={8} align="center">
                    <span className={`status-chip ${connector.enabled ? 'status-success' : 'status-warning'}`}>
                      {connector.enabled ? 'enabled' : 'disabled'}
                    </span>
                    {connector.runtime_active ? (
                      <span className="status-chip status-info connectors-runtime-chip">runtime active</span>
                    ) : null}
                  </Inline>
                </button>

                {active ? (
                  <Inline gap={8} align="center" className={`connectors-list__actions${confirmingDelete ? ' connectors-list__actions-confirm' : ''}`}>
                    {confirmingDelete ? (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          className="connectors-list__actions-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            void onConfirmDelete();
                          }}
                          isLoading={isDeleting}
                        >
                          Confirm delete
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="connectors-list__actions-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            onCancelDelete();
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          className="connectors-list__actions-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditSelected();
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="connectors-list__actions-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            onStartDelete(connector.id);
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Inline>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </Stack>
  );
}
