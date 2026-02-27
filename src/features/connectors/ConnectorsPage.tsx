import { Button, Inline, Stack, Surface, Text } from '../../components/primitives';
import { ConnectorDetailPanel } from './ConnectorDetailPanel';
import { ConnectorList } from './ConnectorList';
import { useConnectorsPage } from './useConnectorsPage';

export function ConnectorsPage() {
  const state = useConnectorsPage();

  const list = (
    <ConnectorList
      connectors={state.visibleConnectors}
      selectedConnectorId={state.selectedConnectorId}
      pendingDeleteId={state.pendingDeleteId}
      filter={state.filter}
      isLoading={state.isLoadingList}
      isDeleting={state.isDeleting}
      onFilterChange={state.setFilter}
      onSelectInList={state.selectConnectorInList}
      onEditSelected={state.openEditFromList}
      onStartDelete={state.startDeleteFromList}
      onCancelDelete={state.cancelDeleteFromList}
      onConfirmDelete={() => void state.confirmDeleteFromList()}
      onCreate={state.beginCreate}
    />
  );

  const detail = (
    <ConnectorDetailPanel
      mode={state.mode}
      selectedConnector={state.selectedConnector}
      draft={state.formDraft}
      formError={state.formError}
      formFieldError={state.formFieldError}
      pageError={state.pageError}
      reloadWarning={state.reloadWarning}
      isSaving={state.isSaving}
      saveStatus={state.saveStatus}
      isDeleting={state.isDeleting}
      selectedConnectorId={state.selectedConnectorId}
      isUploadingSslCafile={state.isUploadingSslCafile}
      sslUploadError={state.sslUploadError}
      sslUploadInfo={state.sslUploadInfo}
      onBeginEdit={state.beginEdit}
      onDelete={() => void state.removeSelected()}
      onChangeDraft={state.updateFormField}
      onUpdateSettingsField={state.updateSettingsField}
      onKindChange={state.setFormKind}
      onUploadSslCafile={state.uploadSelectedConnectorSslCafile}
      onSave={() => void state.saveForm()}
      onCancel={state.cancelForm}
    />
  );

  return (
    <Stack gap={16} className="connectors-page">
      <Inline justify="between" align="center" wrap gap={12} className="connectors-toolbar">
        <Stack gap={4}>
          <Text as="h2" variant="h2" weight="bold">
            Connectors Config
          </Text>
          <Text tone="muted">
            Create and manage connector configs.
          </Text>
        </Stack>
        <Inline gap={12} wrap>
          <Button type="button" variant="primary" onClick={state.beginCreate}>
            New connector
          </Button>
        </Inline>
      </Inline>

      <Surface as="section" className="connectors-runtime-summary" padding={16}>
        <Stack gap={8}>
          <Text as="h3" variant="h3" weight="bold">
            Runtime status
          </Text>
          <Text variant="small" tone="muted">
            Runtime: {state.runtimeInfo?.last_reload?.succeeded ? 'healthy' : 'issue detected'}
          </Text>
          <Text variant="small" tone="muted">
            Active connectors: {state.runtimeInfo?.active_connector_ids.length ?? 0}
          </Text>
          <Text variant="small" tone="muted">
            Last reload: {state.runtimeInfo?.last_reload?.succeeded ? 'ok' : 'not ok'} · trigger=
            {state.runtimeInfo?.last_reload?.trigger ?? 'n/a'} · reason={state.runtimeInfo?.last_reload?.reason ?? 'n/a'}
          </Text>
        </Stack>
      </Surface>

      {state.reloadWarning ? (
        <Surface as="section" className="connectors-warning" padding={16}>
          <Text weight="bold">{state.reloadWarning}</Text>
        </Surface>
      ) : null}

      {state.viewMode === 'list' ? (
        <Surface as="section" className="connectors-view" padding={24}>
          <Stack gap={12}>
            <Text as="h2" variant="h2" weight="bold">
              Connectors
            </Text>
            {list}
          </Stack>
        </Surface>
      ) : (
        <Surface as="section" className="connectors-view" padding={24}>
          <Stack gap={12}>
            <Inline className="connectors-view__header" justify="between" align="center" wrap gap={12}>
              <Stack gap={4}>
                <Text as="h2" variant="h2" weight="bold">
                  Connector form
                </Text>
                <Text tone="muted" variant="small">
                  {state.mode === 'create' ? 'New connector draft' : `Edit connector: ${state.selectedConnector?.id ?? ''}`}
                </Text>
              </Stack>
              <Button type="button" variant="secondary" className="connectors-back-link" onClick={state.openListView}>
                Back to connectors list
              </Button>
            </Inline>
            {detail}
          </Stack>
        </Surface>
      )}
    </Stack>
  );
}
