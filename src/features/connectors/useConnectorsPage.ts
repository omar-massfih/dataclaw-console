import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createConnector,
  deleteConnector,
  exportConnectors,
  listConnectors,
  replaceConnector,
  validateConnectors,
} from './api';
import {
  connectorToFormDraft,
  createDefaultConnectorFormDraft,
  serializeSettingsDraft,
  switchSettingsDraftKind,
} from './form-mappers';
import type {
  ConnectorApiError,
  ConnectorDraft,
  ConnectorDraftInput,
  ConnectorFormDraft,
  ConnectorFormFieldError,
  CreateOrUpdateConnectorResponse,
  DeleteConnectorResponse,
  EditorMode,
  ExportConnectorsResponse,
  ImportStatePayload,
  RuntimePayload,
  ValidateConnectorsResponse,
} from './types';

function sortConnectors(connectors: ConnectorDraft[]): ConnectorDraft[] {
  return connectors.slice().sort((a, b) => a.id.localeCompare(b.id, undefined, { sensitivity: 'base' }));
}

function normalizeError(error: ConnectorApiError | null): string | null {
  if (!error) return null;
  if (error.code && error.param) {
    return `${error.message} (${error.code}: ${error.param})`;
  }
  if (error.code) {
    return `${error.message} (${error.code})`;
  }
  return error.message;
}

function isCommittedCreateOrUpdate(response: CreateOrUpdateConnectorResponse | null): response is CreateOrUpdateConnectorResponse {
  return Boolean(response && response.saved && response.connector?.id);
}

function isCommittedDelete(response: DeleteConnectorResponse | null): response is DeleteConnectorResponse {
  return Boolean(response && response.deleted && response.id);
}

function hasReloadFailureAfterWriteCode(error: ConnectorApiError | null, responseErrorCode?: string): boolean {
  return Boolean(error?.code === 'reload_failed_after_write' || responseErrorCode === 'reload_failed_after_write');
}

export function useConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorDraft[]>([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>('view');
  const [filter, setFilter] = useState('');
  const [formDraft, setFormDraft] = useState<ConnectorFormDraft>(() => createDefaultConnectorFormDraft());
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formFieldError, setFormFieldError] = useState<ConnectorFormFieldError | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [validateResult, setValidateResult] = useState<ValidateConnectorsResponse | null>(null);
  const [exportResult, setExportResult] = useState<ExportConnectorsResponse | null>(null);
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimePayload | null>(null);
  const [importState, setImportState] = useState<ImportStatePayload | null>(null);
  const [reloadWarning, setReloadWarning] = useState<string | null>(null);

  const selectedConnector = useMemo(
    () => connectors.find((connector) => connector.id === selectedConnectorId) ?? null,
    [connectors, selectedConnectorId],
  );

  const visibleConnectors = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return connectors.filter((connector) =>
      q ? connector.id.toLowerCase().includes(q) || connector.kind.toLowerCase().includes(q) : true,
    );
  }, [connectors, filter]);

  const reloadList = useCallback(
    async (nextSelectedId?: string | null) => {
      setIsLoadingList(true);
      setPageError(null);
      const result = await listConnectors();
      if (result.error) {
        setIsLoadingList(false);
        setConnectors([]);
        setRuntimeInfo(null);
        setImportState(null);
        setSelectedConnectorId(null);
        setPageError(normalizeError(result.error));
        return;
      }

      const next = sortConnectors(result.data.connectors);
      setConnectors(next);
      setRuntimeInfo(result.data.runtime);
      setImportState(result.data.import_state);
      setIsLoadingList(false);

      const preferred = nextSelectedId ?? selectedConnectorId;
      const selectedExists = preferred ? next.some((item) => item.id === preferred) : false;
      const finalSelection = selectedExists ? preferred : (next[0]?.id ?? null);
      setSelectedConnectorId(finalSelection);

      if (!next.length) {
        setExportResult(null);
        setValidateResult(null);
      }
    },
    [selectedConnectorId],
  );

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  const beginCreate = useCallback(() => {
    setMode('create');
    setFormError(null);
    setFormFieldError(null);
    setFormDraft(createDefaultConnectorFormDraft());
  }, []);

  const beginEdit = useCallback(() => {
    if (!selectedConnector) return;
    setMode('edit');
    setFormError(null);
    setFormFieldError(null);
    setFormDraft(connectorToFormDraft(selectedConnector));
  }, [selectedConnector]);

  const cancelForm = useCallback(() => {
    setMode('view');
    setFormError(null);
    setFormFieldError(null);
    setFormDraft(selectedConnector ? connectorToFormDraft(selectedConnector) : createDefaultConnectorFormDraft());
  }, [selectedConnector]);

  const selectConnector = useCallback(
    (id: string) => {
      setSelectedConnectorId(id);
      setMode('view');
      setFormError(null);
      setFormFieldError(null);
      const next = connectors.find((item) => item.id === id) ?? null;
      setFormDraft(next ? connectorToFormDraft(next) : createDefaultConnectorFormDraft());
    },
    [connectors],
  );

  useEffect(() => {
    if (mode === 'view') {
      setFormDraft(selectedConnector ? connectorToFormDraft(selectedConnector) : createDefaultConnectorFormDraft());
    }
  }, [mode, selectedConnector]);

  const updateFormField = useCallback(<K extends keyof ConnectorFormDraft>(field: K, value: ConnectorFormDraft[K]) => {
    setFormDraft((prev) => ({ ...prev, [field]: value }));
    setFormFieldError(null);
    setFormError(null);
  }, []);

  const updateSettingsField = useCallback((field: string, value: string | boolean) => {
    setFormDraft((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        values: {
          ...prev.settings.values,
          [field]: value,
        },
      } as ConnectorFormDraft['settings'],
    }));
    setFormFieldError(null);
    setFormError(null);
  }, []);

  const setFormKind = useCallback((nextKind: ConnectorFormDraft['kind']) => {
    setFormDraft((prev) => switchSettingsDraftKind(prev, nextKind));
    setFormFieldError(null);
    setFormError(null);
  }, []);

  const saveForm = useCallback(async () => {
    setFormError(null);
    setFormFieldError(null);

    const parsed = serializeSettingsDraft(formDraft.settings);
    if (!parsed.ok) {
      setFormFieldError({ field: parsed.field, message: parsed.message });
      return { ok: false as const };
    }

    const payload: ConnectorDraftInput = {
      id: formDraft.id.trim(),
      kind: formDraft.kind,
      enabled: formDraft.enabled,
      settings: parsed.value,
    };

    if (!payload.id) {
      setFormError('Connector id is required.');
      return { ok: false as const };
    }

    setIsSaving(true);

    const result =
      mode === 'create'
        ? await createConnector(payload)
        : await replaceConnector(selectedConnectorId ?? payload.id, payload);

    setIsSaving(false);

    if (result.error) {
      const response = result.data;
      if (
        isCommittedCreateOrUpdate(response) &&
        hasReloadFailureAfterWriteCode(result.error, response.error?.code)
      ) {
        setReloadWarning(response.error?.message ?? 'Connector saved, but runtime reload failed. SQLite state was kept.');
        setMode('view');
        await reloadList(response.connector.id);
        return { ok: true as const };
      }
      setFormError(normalizeError(result.error));
      return { ok: false as const };
    }

    setReloadWarning(null);
    setMode('view');
    await reloadList(result.data.connector.id);
    return { ok: true as const };
  }, [formDraft, mode, reloadList, selectedConnectorId]);

  const removeSelected = useCallback(async () => {
    if (!selectedConnectorId) return;
    setIsDeleting(true);
    setPageError(null);
    const result = await deleteConnector(selectedConnectorId);
    setIsDeleting(false);
    if (result.error) {
      const response = result.data;
      if (isCommittedDelete(response) && hasReloadFailureAfterWriteCode(result.error, response.error?.code)) {
        setReloadWarning(response.error?.message ?? 'Connector deleted, but runtime reload failed. SQLite state was kept.');
        setMode('view');
        await reloadList(response.id);
        return;
      }
      setPageError(normalizeError(result.error));
      return;
    }
    setReloadWarning(null);
    setMode('view');
    await reloadList(result.data.id);
  }, [reloadList, selectedConnectorId]);

  const runValidate = useCallback(async () => {
    setIsValidating(true);
    setPageError(null);
    const result = await validateConnectors();
    setIsValidating(false);
    if (result.error) {
      setPageError(normalizeError(result.error));
      return;
    }
    setValidateResult(result.data);
  }, []);

  const runExport = useCallback(async () => {
    setIsExporting(true);
    setPageError(null);
    const result = await exportConnectors();
    setIsExporting(false);
    if (result.error) {
      setPageError(normalizeError(result.error));
      return;
    }
    setExportResult(result.data);
  }, []);

  return {
    connectors,
    visibleConnectors,
    selectedConnectorId,
    selectedConnector,
    mode,
    filter,
    formDraft,
    pageError,
    formError,
    formFieldError,
    isLoadingList,
    isSaving,
    isDeleting,
    isValidating,
    isExporting,
    validateResult,
    exportResult,
    runtimeInfo,
    importState,
    reloadWarning,
    setFilter,
    selectConnector,
    beginCreate,
    beginEdit,
    cancelForm,
    updateFormField,
    updateSettingsField,
    setFormKind,
    saveForm,
    removeSelected,
    runValidate,
    runExport,
    reloadList,
  };
}
