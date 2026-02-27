import { Button, Inline, Input, Stack, Text } from '../../components/primitives';
import type { DomainDraft } from './types';

interface DomainListProps {
  domains: DomainDraft[];
  selectedDomainKey: string | null;
  pendingDeleteKey: string | null;
  filter: string;
  isLoading: boolean;
  isSearchingDomains: boolean;
  domainsSearchError: string | null;
  isDeleting: boolean;
  runtimeActiveKeys: string[];
  onFilterChange: (value: string) => void;
  onSelectInList: (key: string) => void;
  onEditRow: (key: string) => void;
  onStartDelete: (key: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onCreate: () => void;
}

function getDomainStatus(domain: DomainDraft, runtimeActive: boolean): { className: string; label: string } {
  if (!runtimeActive) {
    return { className: 'status-danger', label: 'Error (runtime)' };
  }

  return domain.is_recall_only
    ? { className: 'status-warning', label: 'Recall-only' }
    : { className: 'status-success', label: 'Active' };
}

export function DomainList({
  domains,
  selectedDomainKey,
  pendingDeleteKey,
  filter,
  isLoading,
  isSearchingDomains,
  domainsSearchError,
  isDeleting,
  runtimeActiveKeys,
  onFilterChange,
  onSelectInList,
  onEditRow,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
  onCreate,
}: DomainListProps) {
  return (
    <Stack gap={12}>
      <Input
        aria-label="Filter agents"
        placeholder="Search agents by key, display name, tools, or routing intent"
        value={filter}
        onChange={(event) => onFilterChange(event.target.value)}
      />
      {filter.trim() ? (
        <Text variant="small" tone="muted">
          {isSearchingDomains ? 'Searching agents...' : 'Showing ranked search results.'}
        </Text>
      ) : null}
      {domainsSearchError ? (
        <Text variant="small" className="domains-list__search-warning">
          Search is unavailable right now. Showing local results.
        </Text>
      ) : null}

      {isLoading ? <Text tone="muted">Loading agents...</Text> : null}

      {!isLoading && domains.length === 0 ? (
        <div className="domains-empty">
          <Stack gap={12}>
            <Text tone="muted">No agent drafts found.</Text>
            <Inline>
              <Button type="button" variant="primary" onClick={onCreate}>
                Create first agent
              </Button>
            </Inline>
          </Stack>
        </div>
      ) : null}

      {!isLoading && domains.length > 0 ? (
        <div className="data-table-wrap">
          <table className="data-table domains-table" aria-label="Agent drafts">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Display name</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => {
                const active = domain.key === selectedDomainKey;
                const confirmingDelete = pendingDeleteKey === domain.key;
                const runtimeActive = runtimeActiveKeys.includes(domain.key);
                const status = getDomainStatus(domain, runtimeActive);
                return (
                  <tr key={domain.key} className={active ? 'is-selected' : undefined}>
                    <td>
                      <button
                        type="button"
                        className="data-table__name-button"
                        onClick={() => onSelectInList(domain.key)}
                      >
                        <Text as="span" weight="bold">
                          {domain.key}
                        </Text>
                      </button>
                    </td>
                    <td>
                      <Text as="span" variant="small" tone="muted">
                        {domain.display_name || '(no display name)'}
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
                              aria-label={`Confirm delete ${domain.key}`}
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
                              aria-label={`Cancel delete ${domain.key}`}
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
                              aria-label={`Edit ${domain.key}`}
                              onClick={() => onEditRow(domain.key)}
                            >
                              Edit
                            </button>
                            <span className="data-table__divider" aria-hidden="true">
                              ·
                            </span>
                            <button
                              type="button"
                              className="data-table__action-link"
                              aria-label={`Delete ${domain.key}`}
                              onClick={() => onStartDelete(domain.key)}
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
