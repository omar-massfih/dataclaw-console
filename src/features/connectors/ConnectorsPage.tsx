import { ListDetailLayout } from '../../components/layouts';
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
      filter={state.filter}
      isLoading={state.isLoadingList}
      onFilterChange={state.setFilter}
      onSelect={state.selectConnector}
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
      validateResult={state.validateResult}
      exportResult={state.exportResult}
      reloadWarning={state.reloadWarning}
      isSaving={state.isSaving}
      isDeleting={state.isDeleting}
      onBeginEdit={state.beginEdit}
      onDelete={() => void state.removeSelected()}
      onChangeDraft={state.updateFormField}
      onUpdateSettingsField={state.updateSettingsField}
      onKindChange={state.setFormKind}
      onSave={() => void state.saveForm()}
      onCancel={state.cancelForm}
    />
  );

  return (
    <Stack gap={16} className="connectors-page">
      <Inline justify="between" align="center" wrap gap={12} className="connectors-toolbar">
        <Stack gap={4}>
          <Text as="h2" variant="h2" weight="bold">
            Connectors Config (V1)
          </Text>
          <Text tone="muted">
            SQLite draft store + backend validation + YAML export.
          </Text>
        </Stack>
        <Inline gap={12} wrap>
          <Button type="button" variant="secondary" onClick={() => void state.runValidate()} isLoading={state.isValidating}>
            Validate all
          </Button>
          <Button type="button" variant="secondary" onClick={() => void state.runExport()} isLoading={state.isExporting}>
            Export YAML
          </Button>
          <Button type="button" variant="primary" onClick={state.beginCreate}>
            New connector
          </Button>
        </Inline>
      </Inline>

      <Surface as="section" className="connectors-runtime-summary" padding={16}>
        <Stack gap={8}>
          <Text as="h3" variant="h3" weight="bold">
            Runtime visibility
          </Text>
          <Text variant="small" tone="muted">
            Generation {state.runtimeInfo?.generation ?? 0} · active connectors:{' '}
            {state.runtimeInfo?.active_connector_ids.length ?? 0}
          </Text>
          <Text variant="small" tone="muted">
            Last reload: {state.runtimeInfo?.last_reload?.succeeded ? 'ok' : 'not ok'} ·
            trigger={state.runtimeInfo?.last_reload?.trigger ?? 'n/a'} · reason=
            {state.runtimeInfo?.last_reload?.reason ?? 'n/a'}
          </Text>
          <Text variant="small" tone="muted">
            Import: attempted={String(state.importState?.attempted ?? false)} · succeeded=
            {String(state.importState?.succeeded ?? false)} · result={state.importState?.last_import_result ?? 'unknown'}
          </Text>
        </Stack>
      </Surface>

      {state.reloadWarning ? (
        <Surface as="section" className="connectors-warning" padding={16}>
          <Text weight="bold">{state.reloadWarning}</Text>
        </Surface>
      ) : null}

      <ListDetailLayout listTitle="Connectors" detailTitle="Details" list={list} detail={detail} />
    </Stack>
  );
}
