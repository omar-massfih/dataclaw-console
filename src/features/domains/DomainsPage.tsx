import { Button, Inline, Stack, Surface, Text } from '../../components/primitives';
import { DomainDetailPanel } from './DomainDetailPanel';
import { DomainList } from './DomainList';
import { useDomainsPage } from './useDomainsPage';

export function DomainsPage() {
  const state = useDomainsPage();
  const toolNames = state.formDraft.tool_names_text
    .split('\n')
    .map((line) => line.trim())
    .filter((line, index, items) => line.length > 0 && items.indexOf(line) === index);
  const passthroughToolNames = state.formDraft.passthrough_tool_names_text
    .split('\n')
    .map((line) => line.trim())
    .filter((line, index, items) => line.length > 0 && items.indexOf(line) === index);

  const list = (
    <DomainList
      domains={state.visibleDomains}
      selectedDomainKey={state.selectedDomainKey}
      pendingDeleteKey={state.pendingDeleteKey}
      filter={state.filter}
      isLoading={state.isLoadingList}
      isSearchingDomains={state.isSearchingDomains}
      domainsSearchError={state.domainsSearchError}
      isDeleting={state.isDeleting}
      runtimeActiveKeys={state.runtimeInfo?.active_domain_keys ?? []}
      onFilterChange={state.setFilter}
      onSelectInList={state.selectDomainInList}
      onEditRow={state.openEditForListRow}
      onStartDelete={state.startDeleteFromList}
      onCancelDelete={state.cancelDeleteFromList}
      onConfirmDelete={() => void state.confirmDeleteFromList()}
      onCreate={state.beginCreate}
    />
  );

  const detail = (
    <DomainDetailPanel
      mode={state.mode}
      selectedDomain={state.selectedDomain}
      draft={state.formDraft}
      availableTools={state.availableTools}
      isLoadingTools={state.isLoadingTools}
      toolsError={state.toolsError}
      toolSearchHits={state.toolSearchHits}
      isSearchingTools={state.isSearchingTools}
      toolSearchError={state.toolSearchError}
      toolNames={toolNames}
      passthroughToolNames={passthroughToolNames}
      formError={state.formError}
      formFieldError={state.formFieldError}
      pageError={state.pageError}
      reloadWarning={state.reloadWarning}
      isSaving={state.isSaving}
      saveStatus={state.saveStatus}
      isDeleting={state.isDeleting}
      onBeginEdit={state.beginEdit}
      onDelete={() => void state.removeSelected()}
      onChangeDraft={state.updateFormField}
      onAddToolName={state.addToolName}
      onRemoveToolName={state.removeToolName}
      onAddPassthroughToolName={state.addPassthroughToolName}
      onRemovePassthroughToolName={state.removePassthroughToolName}
      onToolSearchQueryChange={state.setToolSearchQuery}
      onSave={() => void state.saveForm()}
      onCancel={state.cancelForm}
    />
  );

  return (
    <Stack gap={16} className="domains-page">
      <Inline justify="between" align="center" wrap gap={12} className="domains-toolbar">
        <Stack gap={4}>
          <Text as="h2" variant="h2" weight="bold">
            Agents Config
          </Text>
          <Text tone="muted">Create and manage agent configs.</Text>
        </Stack>
        <Inline gap={12} wrap>
          <Button type="button" variant="primary" onClick={state.beginCreate}>
            New agent
          </Button>
        </Inline>
      </Inline>

      <Surface as="section" className="domains-runtime-summary" padding={16}>
        <Stack gap={8}>
          <Text as="h3" variant="h3" weight="bold">
            Runtime status
          </Text>
          <Text variant="small" tone="muted">
            Runtime: {state.runtimeInfo?.last_reload?.succeeded ? 'healthy' : 'issue detected'}
          </Text>
          <Text variant="small" tone="muted">
            Active agents: {state.runtimeInfo?.active_domain_keys.length ?? 0}
          </Text>
          <Text variant="small" tone="muted">
            Last reload: {state.runtimeInfo?.last_reload?.succeeded ? 'ok' : 'not ok'} · trigger=
            {state.runtimeInfo?.last_reload?.trigger ?? 'n/a'} · reason={state.runtimeInfo?.last_reload?.reason ?? 'n/a'}
          </Text>
        </Stack>
      </Surface>

      {state.reloadWarning ? (
        <Surface as="section" className="domains-warning" padding={16}>
          <Text weight="bold">{state.reloadWarning}</Text>
        </Surface>
      ) : null}

      {state.pageError ? (
        <Surface as="section" className="domains-error" padding={16}>
          <Text weight="bold">{state.pageError}</Text>
        </Surface>
      ) : null}

      {state.viewMode === 'list' ? (
        <Surface as="section" className="domains-view" padding={24}>
          <Stack gap={12}>
            <Text as="h2" variant="h2" weight="bold">
              Agents
            </Text>
            {list}
          </Stack>
        </Surface>
      ) : (
        <Surface as="section" className="domains-view" padding={24}>
          <Stack gap={12}>
            <Inline className="domains-view__header" justify="between" align="center" wrap gap={12}>
              <Stack gap={4}>
                <Text as="h2" variant="h2" weight="bold">
                  Agent form
                </Text>
                <Text tone="muted" variant="small">
                  {state.mode === 'create' ? 'New agent draft' : `Edit agent: ${state.selectedDomain?.key ?? ''}`}
                </Text>
              </Stack>
              <Button type="button" variant="secondary" className="domains-back-link" onClick={state.openListView}>
                Back to agents list
              </Button>
            </Inline>
            {detail}
          </Stack>
        </Surface>
      )}
    </Stack>
  );
}
