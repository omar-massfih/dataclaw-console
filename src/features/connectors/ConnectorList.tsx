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
  onEditRow: (id: string) => void;
  onStartDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onCreate: () => void;
}

function getConnectorStatus(connector: ConnectorDraft): { className: string; label: string } {
  if (!connector.enabled) {
    return connector.runtime_active
      ? { className: 'status-danger', label: 'Error (runtime)' }
      : { className: 'status-muted', label: 'Disabled' };
  }

  if (connector.runtime_active === true && connector.runtime_loaded !== false) {
    return { className: 'status-success', label: 'Active' };
  }

  return { className: 'status-danger', label: 'Error (runtime)' };
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
  onEditRow,
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
        <div className="data-table-wrap">
          <table className="data-table connectors-table" aria-label="Connector drafts">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {connectors.map((connector) => {
                const active = connector.id === selectedConnectorId;
                const confirmingDelete = pendingDeleteId === connector.id;
                const status = getConnectorStatus(connector);
                return (
                  <tr key={connector.id} className={active ? 'is-selected' : undefined}>
                    <td>
                      <button
                        type="button"
                        className="data-table__name-button"
                        onClick={() => onSelectInList(connector.id)}
                      >
                        <Text as="span" weight="bold">
                          {connector.id}
                        </Text>
                      </button>
                    </td>
                    <td>
                      <Text as="span" variant="small" tone="muted">
                        {connector.kind}
                      </Text>
                    </td>
                    <td>
                      <span className={`status-chip ${status.className}`}>{status.label}</span>
                    </td>
                    <td>
                      <div className={`data-table__actions${confirmingDelete ? ' data-table__actions--confirm' : ''}`}>
                        {confirmingDelete ? (
                          <>
                            <button
                              type="button"
                              className="data-table__action-link"
                              aria-label={`Confirm delete ${connector.id}`}
                              onClick={() => {
                                void onConfirmDelete();
                              }}
                              disabled={isDeleting}
                            >
                              Confirm delete
                            </button>
                            <span className="data-table__divider" aria-hidden="true">
                              ·
                            </span>
                            <button
                              type="button"
                              className="data-table__action-link"
                              aria-label={`Cancel delete ${connector.id}`}
                              onClick={onCancelDelete}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="data-table__action-link"
                              aria-label={`Edit ${connector.id}`}
                              onClick={() => onEditRow(connector.id)}
                            >
                              Edit
                            </button>
                            <span className="data-table__divider" aria-hidden="true">
                              ·
                            </span>
                            <button
                              type="button"
                              className="data-table__action-link"
                              aria-label={`Delete ${connector.id}`}
                              onClick={() => onStartDelete(connector.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </Stack>
  );
}
