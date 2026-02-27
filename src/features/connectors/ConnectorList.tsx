import { useEffect, useRef, useState } from 'react';

import dotsThreeVerticalIcon from '../../assets/dots-three-vertical.svg';
import searchIcon from '../../assets/search.svg';
import { Button, Inline, Stack, Text } from '../../components/primitives';
import type { ConnectorDraft } from './types';

interface ConnectorListProps {
  connectors: ConnectorDraft[];
  selectedConnectorId: string | null;
  pendingDeleteId: string | null;
  filter: string;
  isLoading: boolean;
  isDeleting: boolean;
  onFilterChange: (value: string) => void;
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
  onEditRow,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
  onCreate,
}: ConnectorListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const openMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!openMenuRef.current) {
        return;
      }
      if (!openMenuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  return (
    <Stack gap={12}>
      <div className="list-search-wrap">
        <div className="list-search">
          <span className="list-search__icon" aria-hidden="true">
            <img src={searchIcon} alt="" className="list-search__icon-image" />
          </span>
          <input
            className="field-input list-search__input"
            aria-label="Filter connectors"
            placeholder="Search by id or kind"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
          />
          {filter.trim() ? (
            <button
              type="button"
              className="list-search__clear"
              aria-label="Clear connector search"
              onClick={() => onFilterChange('')}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

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
                const menuOpen = openMenuId === connector.id;
                const menuId = `connector-actions-${connector.id}`;
                return (
                  <tr key={connector.id} className={active ? 'is-selected' : undefined}>
                    <td>
                      <button
                        type="button"
                        className="data-table__name-button"
                        onClick={() => onEditRow(connector.id)}
                      >
                        <Text as="span">{connector.id}</Text>
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
                              className="data-table__action-link data-table__action-link--muted"
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
                              className="data-table__menu-trigger"
                              aria-label={`Open actions for ${connector.id}`}
                              aria-expanded={menuOpen}
                              aria-controls={menuId}
                              onClick={() => setOpenMenuId((current) => (current === connector.id ? null : connector.id))}
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
                                  aria-label={`Edit ${connector.id}`}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onEditRow(connector.id);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="data-table__menu-item data-table__menu-item--danger"
                                  aria-label={`Delete ${connector.id}`}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onStartDelete(connector.id);
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
