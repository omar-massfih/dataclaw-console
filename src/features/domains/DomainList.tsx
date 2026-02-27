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
  onEditSelected: () => void;
  onStartDelete: (key: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onCreate: () => void;
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
  onEditSelected,
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
        <ul className="domains-list" aria-label="Agent drafts">
          {domains.map((domain) => {
            const active = domain.key === selectedDomainKey;
            const confirmingDelete = pendingDeleteKey === domain.key;
            const runtimeActive = runtimeActiveKeys.includes(domain.key);
            return (
              <li key={domain.key}>
                <button
                  type="button"
                  className={`domains-list__row${active ? ' domains-list__row--active domains-list__row--selected' : ''}`}
                  onClick={() => onSelectInList(domain.key)}
                >
                  <span>
                    <Text as="span" weight="bold">
                      {domain.key}
                    </Text>
                    <Text as="span" variant="small" tone="muted" className="domains-list__sub">
                      {domain.display_name || '(no display name)'}
                    </Text>
                  </span>
                  <Inline gap={8} align="center">
                    <span className={`status-chip ${domain.is_recall_only ? 'status-warning' : 'status-success'}`}>
                      {domain.is_recall_only ? 'recall-only' : 'active tools'}
                    </span>
                    {runtimeActive ? <span className="status-chip status-info">runtime active</span> : null}
                  </Inline>
                </button>

                {active ? (
                  <Inline
                    gap={8}
                    align="center"
                    className={`domains-list__actions${confirmingDelete ? ' domains-list__actions-confirm' : ''}`}
                  >
                    {confirmingDelete ? (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          className="domains-list__actions-btn"
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
                          className="domains-list__actions-btn"
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
                          className="domains-list__actions-btn"
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
                          className="domains-list__actions-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            onStartDelete(domain.key);
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
