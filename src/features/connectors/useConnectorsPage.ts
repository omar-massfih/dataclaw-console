import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createConnector,
  deleteConnector,
  listConnectors,
  replaceConnector,
  uploadConnectorSslCafile,
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
  ImportStatePayload,
  RuntimePayload,
  UploadConnectorSslCafileResponse,
  UploadedSslCafilePayload,
} from './types';

const CONNECTORS_VIEW_MODE_STORAGE_KEY = 'connectors.viewMode.v1';

type ConnectorsViewMode = 'list' | 'detail';
type SaveStatus = 'idle' | 'saving' | 'saved';

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

function isCommittedSslUpload(
  response: UploadConnectorSslCafileResponse | null,
): response is UploadConnectorSslCafileResponse {
  return Boolean(response?.uploaded && response.connector?.id && response.file?.path);
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isDeleting, setIsDeleting] = useState(false);
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimePayload | null>(null);
  const [importState, setImportState] = useState<ImportStatePayload | null>(null);
  const [reloadWarning, setReloadWarning] = useState<string | null>(null);
  const [isUploadingSslCafile, setIsUploadingSslCafile] = useState(false);
  const [sslUploadError, setSslUploadError] = useState<string | null>(null);
  const [sslUploadInfo, setSslUploadInfo] = useState<UploadedSslCafilePayload | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ConnectorsViewMode>(() => {
    if (typeof window === 'undefined') return 'list';
    const stored = window.localStorage.getItem(CONNECTORS_VIEW_MODE_STORAGE_KEY);
    return stored === 'detail' ? 'detail' : 'list';
  });

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

    },
    [selectedConnectorId],
  );

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CONNECTORS_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'detail' && mode === 'view' && !selectedConnector) {
      setViewMode('list');
    }
  }, [mode, selectedConnector, viewMode]);

  const openListView = useCallback(() => {
    setViewMode('list');
    setPendingDeleteId(null);
    setSslUploadError(null);
    setSslUploadInfo(null);
    setSaveStatus('idle');
  }, []);

  const openDetailView = useCallback(
    (connectorId?: string) => {
      if (connectorId) {
        setSelectedConnectorId(connectorId);
      }
      setViewMode('detail');
      setPendingDeleteId(null);
    },
    [],
  );

  const beginCreate = useCallback(() => {
    setMode('create');
    setViewMode('detail');
    setSaveStatus('idle');
    setFormError(null);
    setFormFieldError(null);
    setSslUploadError(null);
    setSslUploadInfo(null);
    setFormDraft(createDefaultConnectorFormDraft());
    setPendingDeleteId(null);
  }, []);

  const beginEdit = useCallback(() => {
    if (!selectedConnector) return;
    setMode('edit');
    setViewMode('detail');
    setSaveStatus('idle');
    setFormError(null);
    setFormFieldError(null);
    setSslUploadError(null);
    setSslUploadInfo(null);
    setFormDraft(connectorToFormDraft(selectedConnector));
    setPendingDeleteId(null);
  }, [selectedConnector]);

  const cancelForm = useCallback(() => {
    setMode('view');
    setSaveStatus('idle');
    setFormError(null);
    setFormFieldError(null);
    setSslUploadError(null);
    setSslUploadInfo(null);
    setFormDraft(selectedConnector ? connectorToFormDraft(selectedConnector) : createDefaultConnectorFormDraft());
    setPendingDeleteId(null);
    setViewMode('list');
  }, [selectedConnector]);

  const selectConnector = useCallback(
    (id: string) => {
      setSelectedConnectorId(id);
      setMode('view');
      setFormError(null);
      setFormFieldError(null);
      setSslUploadError(null);
      setSslUploadInfo(null);
      setPendingDeleteId(null);
      setSaveStatus('idle');
      const next = connectors.find((item) => item.id === id) ?? null;
      setFormDraft(next ? connectorToFormDraft(next) : createDefaultConnectorFormDraft());
    },
    [connectors],
  );

  const selectConnectorInList = useCallback(
    (id: string) => {
      selectConnector(id);
      setViewMode('list');
      setPendingDeleteId(null);
    },
    [selectConnector],
  );

  const onConnectorSelectForDetail = useCallback(
    (id: string) => {
      selectConnector(id);
      setViewMode('detail');
      setPendingDeleteId(null);
    },
    [selectConnector],
  );

  const openEditFromList = useCallback(() => {
    if (!selectedConnector) return;
    setViewMode('detail');
    setPendingDeleteId(null);
    setMode('edit');
    setSaveStatus('idle');
    setFormError(null);
    setFormFieldError(null);
    setSslUploadError(null);
    setSslUploadInfo(null);
    setFormDraft(connectorToFormDraft(selectedConnector));
  }, [selectedConnector]);

  const startDeleteFromList = useCallback((id: string) => {
    setSelectedConnectorId(id);
    setPendingDeleteId(id);
    setViewMode('list');
  }, []);

  const cancelDeleteFromList = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  useEffect(() => {
    if (mode === 'view') {
      setFormDraft(selectedConnector ? connectorToFormDraft(selectedConnector) : createDefaultConnectorFormDraft());
    }
  }, [mode, selectedConnector]);

  const updateFormField = useCallback(<K extends keyof ConnectorFormDraft>(field: K, value: ConnectorFormDraft[K]) => {
    setFormDraft((prev) => ({ ...prev, [field]: value }));
    setFormFieldError(null);
    setFormError(null);
    setSslUploadError(null);
    setSaveStatus('idle');
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
    setSslUploadError(null);
    setSaveStatus('idle');
  }, []);

  const setFormKind = useCallback((nextKind: ConnectorFormDraft['kind']) => {
    setFormDraft((prev) => switchSettingsDraftKind(prev, nextKind));
    setFormFieldError(null);
    setFormError(null);
    setSslUploadError(null);
    setSaveStatus('idle');
  }, []);

  const uploadSelectedConnectorSslCafile = useCallback(
    async (file: File) => {
      if (!selectedConnectorId || selectedConnector?.kind !== 'kafka') {
        setSslUploadError('SSL certificate upload is available only for persisted kafka connectors.');
        return { ok: false as const };
      }

      setSslUploadError(null);
      setSslUploadInfo(null);
      setIsUploadingSslCafile(true);

      const result = await uploadConnectorSslCafile(selectedConnectorId, file);
      setIsUploadingSslCafile(false);

      if (result.error) {
        const response = result.data;
        if (isCommittedSslUpload(response) && hasReloadFailureAfterWriteCode(result.error, response.error?.code)) {
          setReloadWarning(response.error?.message ?? 'SSL CA file uploaded, but runtime reload failed. SQLite state was kept.');
          setSslUploadInfo(response.file);
          setFormDraft(connectorToFormDraft(response.connector));
          await reloadList(response.connector.id);
          return { ok: true as const };
        }
        setSslUploadError(normalizeError(result.error));
        return { ok: false as const };
      }

      setReloadWarning(null);
      setSslUploadInfo(result.data.file);
      setFormDraft(connectorToFormDraft(result.data.connector));
      await reloadList(result.data.connector.id);
      return { ok: true as const };
    },
    [reloadList, selectedConnector, selectedConnectorId],
  );

  const saveForm = useCallback(async () => {
    setFormError(null);
    setFormFieldError(null);
    setSaveStatus('idle');

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
    setSaveStatus('saving');

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
        setSaveStatus('saved');
        if (mode === 'create') {
          setSelectedConnectorId(response.connector.id);
          setMode('edit');
        }
        await reloadList(response.connector.id);
        return { ok: true as const };
      }
      setSaveStatus('idle');
      setFormError(normalizeError(result.error));
      return { ok: false as const };
    }

    setReloadWarning(null);
    setSaveStatus('saved');
    if (mode === 'create') {
      setSelectedConnectorId(result.data.connector.id);
      setMode('edit');
    }
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
        setViewMode('list');
        setPendingDeleteId(null);
        await reloadList(response.id);
        return;
      }
      setPageError(normalizeError(result.error));
      return;
    }
    setReloadWarning(null);
    setMode('view');
    setViewMode('list');
    setPendingDeleteId(null);
    await reloadList(result.data.id);
  }, [reloadList, selectedConnectorId]);

  const confirmDeleteFromList = useCallback(async () => {
    if (!selectedConnectorId) return;
    await removeSelected();
    setViewMode('list');
    setPendingDeleteId(null);
  }, [removeSelected, selectedConnectorId]);

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
    saveStatus,
    isDeleting,
    isUploadingSslCafile,
    runtimeInfo,
    importState,
    reloadWarning,
    sslUploadError,
    sslUploadInfo,
    pendingDeleteId,
    viewMode,
    setFilter,
    selectConnector,
    selectConnectorInList,
    onConnectorSelectForDetail,
    openListView,
    openDetailView,
    openEditFromList,
    startDeleteFromList,
    cancelDeleteFromList,
    confirmDeleteFromList,
    beginCreate,
    beginEdit,
    cancelForm,
    updateFormField,
    updateSettingsField,
    setFormKind,
    uploadSelectedConnectorSslCafile,
    saveForm,
    removeSelected,
    reloadList,
  };
}
