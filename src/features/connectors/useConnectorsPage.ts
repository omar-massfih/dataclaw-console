import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createConnector,
  deleteConnector,
  exportConnectors,
  listConnectors,
  replaceConnector,
  validateConnectors,
} from './api';
import { getConnectorSettingsTemplateText, isDefaultConnectorSettingsText } from './templates';
import type {
  ConnectorApiError,
  ConnectorDraft,
  ConnectorDraftInput,
  ConnectorFormDraft,
  EditorMode,
  ExportConnectorsResponse,
  ValidateConnectorsResponse,
} from './types';

function sortConnectors(connectors: ConnectorDraft[]): ConnectorDraft[] {
  return connectors.slice().sort((a, b) => a.id.localeCompare(b.id, undefined, { sensitivity: 'base' }));
}

function toFormDraft(connector?: ConnectorDraft | null): ConnectorFormDraft {
  if (!connector) {
    return {
      id: '',
      kind: 'sql_reader',
      enabled: true,
      settingsText: getConnectorSettingsTemplateText('sql_reader'),
    };
  }

  return {
    id: connector.id,
    kind: connector.kind,
    enabled: connector.enabled,
    settingsText: JSON.stringify(connector.settings, null, 2),
  };
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

function parseSettingsObject(settingsText: string): { ok: true; value: Record<string, unknown> } | { ok: false; message: string } {
  try {
    const parsed = JSON.parse(settingsText) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return { ok: false, message: 'Settings JSON must be an object.' };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Invalid JSON.',
    };
  }
}

export function useConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorDraft[]>([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>('view');
  const [filter, setFilter] = useState('');
  const [formDraft, setFormDraft] = useState<ConnectorFormDraft>(() => toFormDraft(null));
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [validateResult, setValidateResult] = useState<ValidateConnectorsResponse | null>(null);
  const [exportResult, setExportResult] = useState<ExportConnectorsResponse | null>(null);

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
        setSelectedConnectorId(null);
        setPageError(normalizeError(result.error));
        return;
      }

      const next = sortConnectors(result.data.connectors);
      setConnectors(next);
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
    setJsonParseError(null);
    setFormDraft(toFormDraft(null));
  }, []);

  const beginEdit = useCallback(() => {
    if (!selectedConnector) return;
    setMode('edit');
    setFormError(null);
    setJsonParseError(null);
    setFormDraft(toFormDraft(selectedConnector));
  }, [selectedConnector]);

  const cancelForm = useCallback(() => {
    setMode('view');
    setFormError(null);
    setJsonParseError(null);
    setFormDraft(toFormDraft(selectedConnector));
  }, [selectedConnector]);

  const selectConnector = useCallback(
    (id: string) => {
      setSelectedConnectorId(id);
      setMode('view');
      setFormError(null);
      setJsonParseError(null);
      const next = connectors.find((item) => item.id === id) ?? null;
      setFormDraft(toFormDraft(next));
    },
    [connectors],
  );

  useEffect(() => {
    if (mode === 'view') {
      setFormDraft(toFormDraft(selectedConnector));
    }
  }, [mode, selectedConnector]);

  const updateFormField = useCallback(<K extends keyof ConnectorFormDraft>(field: K, value: ConnectorFormDraft[K]) => {
    setFormDraft((prev) => ({ ...prev, [field]: value }));
    if (field === 'settingsText') {
      setJsonParseError(null);
    }
    setFormError(null);
  }, []);

  const setFormKind = useCallback((nextKind: ConnectorFormDraft['kind']) => {
    setFormDraft((prev) => {
      if (prev.kind === nextKind) return prev;

      const shouldReplaceSettings =
        mode === 'create' && isDefaultConnectorSettingsText(prev.kind, prev.settingsText);

      return {
        ...prev,
        kind: nextKind,
        settingsText: shouldReplaceSettings ? getConnectorSettingsTemplateText(nextKind) : prev.settingsText,
      };
    });
    setFormError(null);
  }, [mode]);

  const resetFormSettingsToTemplate = useCallback(() => {
    setFormDraft((prev) => ({
      ...prev,
      settingsText: getConnectorSettingsTemplateText(prev.kind),
    }));
    setJsonParseError(null);
    setFormError(null);
  }, []);

  const saveForm = useCallback(async () => {
    setFormError(null);
    setJsonParseError(null);

    const parsed = parseSettingsObject(formDraft.settingsText);
    if (!parsed.ok) {
      setJsonParseError(parsed.message);
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
      setFormError(normalizeError(result.error));
      return { ok: false as const };
    }

    setMode('view');
    await reloadList(result.data.id);
    return { ok: true as const };
  }, [formDraft, mode, reloadList, selectedConnectorId]);

  const removeSelected = useCallback(async () => {
    if (!selectedConnectorId) return;
    setIsDeleting(true);
    setPageError(null);
    const result = await deleteConnector(selectedConnectorId);
    setIsDeleting(false);
    if (result.error) {
      setPageError(normalizeError(result.error));
      return;
    }
    setMode('view');
    await reloadList(selectedConnectorId);
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
    jsonParseError,
    isLoadingList,
    isSaving,
    isDeleting,
    isValidating,
    isExporting,
    validateResult,
    exportResult,
    setFilter,
    selectConnector,
    beginCreate,
    beginEdit,
    cancelForm,
    updateFormField,
    setFormKind,
    resetFormSettingsToTemplate,
    saveForm,
    removeSelected,
    runValidate,
    runExport,
    reloadList,
  };
}
