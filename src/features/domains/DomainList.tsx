import { useEffect, useRef, useState } from 'react';

import dotsThreeVerticalIcon from '../../assets/dots-three-vertical.svg';
import searchIcon from '../../assets/search.svg';
import { Button, Inline, Stack, Text } from '../../components/primitives';
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
  onEditRow,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
  onCreate,
}: DomainListProps) {
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const openMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuKey) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!openMenuRef.current) {
        return;
      }
      if (!openMenuRef.current.contains(event.target as Node)) {
        setOpenMenuKey(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenuKey(null);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuKey]);

  return (
    <Stack gap={12}>
      <div className="list-search-wrap">
        <div className="list-search">
          <span className="list-search__icon" aria-hidden="true">
            <img src={searchIcon} alt="" className="list-search__icon-image" />
          </span>
          <input
            className="field-input list-search__input"
            aria-label="Filter agents"
            placeholder="Search by key, display name, tools, or routing intent"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
          />
          {filter.trim() ? (
            <button
              type="button"
              className="list-search__clear"
              aria-label="Clear agent search"
              onClick={() => onFilterChange('')}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>
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
                const menuOpen = openMenuKey === domain.key;
                const menuId = `domain-actions-${domain.key}`;
                return (
                  <tr key={domain.key} className={active ? 'is-selected' : undefined}>
                    <td>
                      <button
                        type="button"
                        className="data-table__name-button"
                        onClick={() => onEditRow(domain.key)}
                      >
                        <Text as="span">{domain.key}</Text>
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
                      <div
                        className={
                          confirmingDelete ? 'data-table__actions data-table__actions--confirm' : 'data-table__menu'
                        }
                        ref={menuOpen ? openMenuRef : null}
                      >
                        {confirmingDelete ? (
                          <>
                            <button
                              type="button"
                              className="data-table__action-link data-table__action-link--danger"
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
                              className="data-table__action-link data-table__action-link--muted"
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
                              className="data-table__menu-trigger"
                              aria-label={`Open actions for ${domain.key}`}
                              aria-expanded={menuOpen}
                              aria-controls={menuId}
                              onClick={() => setOpenMenuKey((current) => (current === domain.key ? null : domain.key))}
                            >
                              <img
                                src={dotsThreeVerticalIcon}
                                alt=""
                                className="data-table__menu-icon"
                                aria-hidden="true"
                              />
                            </button>
                            {menuOpen ? (
                              <div className="data-table__menu-panel" id={menuId} role="menu">
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="data-table__menu-item"
                                  aria-label={`Edit ${domain.key}`}
                                  onClick={() => {
                                    setOpenMenuKey(null);
                                    onEditRow(domain.key);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="data-table__menu-item data-table__menu-item--danger"
                                  aria-label={`Delete ${domain.key}`}
                                  onClick={() => {
                                    setOpenMenuKey(null);
                                    onStartDelete(domain.key);
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            ) : null}
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
