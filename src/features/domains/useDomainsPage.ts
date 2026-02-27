import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createDomain,
  deleteDomain,
  listAgentTools,
  listDomains,
  replaceDomain,
  searchDomainConfigs,
  searchToolConfigs,
} from './api';
import {
  createDefaultDomainFormDraft,
  domainToFormDraft,
  serializeDomainFormDraft,
} from './form-mappers';
import type {
  AgentToolInfo,
  CreateOrUpdateDomainResponse,
  DeleteDomainResponse,
  DomainApiError,
  DomainDraft,
  DomainEditorMode,
  DomainFormDraft,
  DomainFormFieldError,
  DomainImportStatePayload,
  DomainRuntimePayload,
} from './types';

const DOMAINS_VIEW_MODE_STORAGE_KEY = 'domains.viewMode.v1';

type DomainsViewMode = 'list' | 'detail';
type SaveStatus = 'idle' | 'saving' | 'saved';

function sortDomains(domains: DomainDraft[]): DomainDraft[] {
  return domains.slice().sort((a, b) => a.key.localeCompare(b.key, undefined, { sensitivity: 'base' }));
}

function normalizeError(error: DomainApiError | null): string | null {
  if (!error) return null;
  if (error.code && error.param) return `${error.message} (${error.code}: ${error.param})`;
  if (error.code) return `${error.message} (${error.code})`;
  return error.message;
}

function isCommittedCreateOrUpdate(
  response: CreateOrUpdateDomainResponse | null,
): response is CreateOrUpdateDomainResponse {
  return Boolean(response?.saved && response.domain?.key);
}

function isCommittedDelete(response: DeleteDomainResponse | null): response is DeleteDomainResponse {
  return Boolean(response?.deleted && response.key);
}

function hasReloadFailureAfterWriteCode(error: DomainApiError | null, responseErrorCode?: string): boolean {
  return Boolean(error?.code === 'reload_failed_after_write' || responseErrorCode === 'reload_failed_after_write');
}

function parseLineValues(text: string): string[] {
  const values = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return Array.from(new Set(values));
}

function toLineValues(values: string[]): string {
  return values.join('\n');
}

export function useDomainsPage() {
  const [domains, setDomains] = useState<DomainDraft[]>([]);
  const [selectedDomainKey, setSelectedDomainKey] = useState<string | null>(null);
  const [mode, setMode] = useState<DomainEditorMode>('view');
  const [filter, setFilter] = useState('');
  const [formDraft, setFormDraft] = useState<DomainFormDraft>(() => createDefaultDomainFormDraft());
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formFieldError, setFormFieldError] = useState<DomainFormFieldError | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isDeleting, setIsDeleting] = useState(false);
  const [runtimeInfo, setRuntimeInfo] = useState<DomainRuntimePayload | null>(null);
  const [importState, setImportState] = useState<DomainImportStatePayload | null>(null);
  const [reloadWarning, setReloadWarning] = useState<string | null>(null);
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);
  const [availableTools, setAvailableTools] = useState<AgentToolInfo[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [toolSearchHits, setToolSearchHits] = useState<AgentToolInfo[]>([]);
  const [isSearchingTools, setIsSearchingTools] = useState(false);
  const [toolSearchError, setToolSearchError] = useState<string | null>(null);
  const [domainSearchHits, setDomainSearchHits] = useState<string[]>([]);
  const [isSearchingDomains, setIsSearchingDomains] = useState(false);
  const [domainsSearchError, setDomainsSearchError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<DomainsViewMode>(() => {
    if (typeof window === 'undefined') return 'list';
    const stored = window.localStorage.getItem(DOMAINS_VIEW_MODE_STORAGE_KEY);
    return stored === 'detail' ? 'detail' : 'list';
  });

  const selectedDomain = useMemo(
    () => domains.find((domain) => domain.key === selectedDomainKey) ?? null,
    [domains, selectedDomainKey],
  );

  const visibleDomains = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return domains;

    const localFiltered = domains.filter(
      (domain) => domain.key.toLowerCase().includes(q) || domain.display_name.toLowerCase().includes(q),
    );

    if (domainsSearchError || domainSearchHits.length === 0) {
      return localFiltered;
    }

    const byKey = new Map(domains.map((domain) => [domain.key, domain]));
    return domainSearchHits
      .map((key) => byKey.get(key))
      .filter((domain): domain is DomainDraft => domain !== undefined);
  }, [domainSearchHits, domains, domainsSearchError, filter]);

  const reloadList = useCallback(
    async (nextSelectedKey?: string | null) => {
      setIsLoadingList(true);
      setPageError(null);
      const result = await listDomains();
      if (result.error) {
        setIsLoadingList(false);
        setDomains([]);
        setRuntimeInfo(null);
        setImportState(null);
        setSelectedDomainKey(null);
        setPageError(normalizeError(result.error));
        return;
      }

      const next = sortDomains(result.data.domains);
      setDomains(next);
      setRuntimeInfo(result.data.runtime);
      setImportState(result.data.import_state);
      setIsLoadingList(false);

      const preferred = nextSelectedKey ?? selectedDomainKey;
      const selectedExists = preferred ? next.some((item) => item.key === preferred) : false;
      const finalSelection = selectedExists ? preferred : (next[0]?.key ?? null);
      setSelectedDomainKey(finalSelection);
    },
    [selectedDomainKey],
  );

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingTools(true);
    setToolsError(null);
    void listAgentTools().then((result) => {
      if (cancelled) return;
      setIsLoadingTools(false);
      if (result.error) {
        setAvailableTools([]);
        setToolsError(result.error.message);
        return;
      }
      setAvailableTools(result.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = filter.trim();
    if (!q) {
      setIsSearchingDomains(false);
      setDomainsSearchError(null);
      setDomainSearchHits([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsSearchingDomains(true);
      setDomainsSearchError(null);
      void searchDomainConfigs({ q, top_k: 50, min_score: 0 }).then((result) => {
        if (cancelled) return;
        setIsSearchingDomains(false);
        if (result.error) {
          setDomainsSearchError(result.error.message);
          return;
        }
        const keys = (result.data?.hits ?? [])
          .map((hit) => hit.payload?.key)
          .filter((key): key is string => typeof key === 'string' && key.trim().length > 0);
        setDomainSearchHits(Array.from(new Set(keys)));
      });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filter]);

  useEffect(() => {
    const q = toolSearchQuery.trim();
    if (!q) {
      setIsSearchingTools(false);
      setToolSearchError(null);
      setToolSearchHits([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsSearchingTools(true);
      setToolSearchError(null);
      void searchToolConfigs({ q, top_k: 20, min_score: 0 }).then((result) => {
        if (cancelled) return;
        setIsSearchingTools(false);
        if (result.error) {
          setToolSearchHits([]);
          setToolSearchError(result.error.message);
          return;
        }

        const knownTools = new Map(availableTools.map((tool) => [tool.name, tool]));
        const names = (result.data?.hits ?? [])
          .map((hit) => hit.payload?.name)
          .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);
        const uniqueNames = Array.from(new Set(names));
        const mapped = uniqueNames.map(
          (name) => knownTools.get(name) ?? { name, description: '', arguments_schema: null },
        );
        setToolSearchHits(mapped);
      });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [availableTools, toolSearchQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DOMAINS_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'detail' && mode === 'view' && !selectedDomain) {
      setViewMode('list');
    }
  }, [mode, selectedDomain, viewMode]);

  const openListView = useCallback(() => {
    setViewMode('list');
    setPendingDeleteKey(null);
    setSaveStatus('idle');
  }, []);

  const beginCreate = useCallback(() => {
    setMode('create');
    setViewMode('detail');
    setSaveStatus('idle');
    setFormError(null);
    setFormFieldError(null);
    setFormDraft(createDefaultDomainFormDraft());
    setPendingDeleteKey(null);
  }, []);

  const beginEdit = useCallback(() => {
    if (!selectedDomain) return;
    setMode('edit');
    setViewMode('detail');
    setSaveStatus('idle');
    setFormError(null);
    setFormFieldError(null);
    setFormDraft(domainToFormDraft(selectedDomain));
    setPendingDeleteKey(null);
  }, [selectedDomain]);

  const cancelForm = useCallback(() => {
    setMode('view');
    setSaveStatus('idle');
    setFormError(null);
    setFormFieldError(null);
    setFormDraft(selectedDomain ? domainToFormDraft(selectedDomain) : createDefaultDomainFormDraft());
    setPendingDeleteKey(null);
    setViewMode('list');
  }, [selectedDomain]);

  const selectDomain = useCallback(
    (key: string) => {
      setSelectedDomainKey(key);
      setMode('view');
      setFormError(null);
      setFormFieldError(null);
      setPendingDeleteKey(null);
      setSaveStatus('idle');
      const next = domains.find((item) => item.key === key) ?? null;
      setFormDraft(next ? domainToFormDraft(next) : createDefaultDomainFormDraft());
    },
    [domains],
  );

  const selectDomainInList = useCallback(
    (key: string) => {
      selectDomain(key);
      setViewMode('list');
      setPendingDeleteKey(null);
    },
    [selectDomain],
  );

  const openEditFromList = useCallback(() => {
    if (!selectedDomain) return;
    setViewMode('detail');
    setPendingDeleteKey(null);
    setMode('edit');
    setSaveStatus('idle');
    setFormError(null);
    setFormFieldError(null);
    setFormDraft(domainToFormDraft(selectedDomain));
  }, [selectedDomain]);

  const startDeleteFromList = useCallback((key: string) => {
    setSelectedDomainKey(key);
    setPendingDeleteKey(key);
    setViewMode('list');
  }, []);

  const cancelDeleteFromList = useCallback(() => {
    setPendingDeleteKey(null);
  }, []);

  useEffect(() => {
    if (mode === 'view') {
      setFormDraft(selectedDomain ? domainToFormDraft(selectedDomain) : createDefaultDomainFormDraft());
    }
  }, [mode, selectedDomain]);

  const updateFormField = useCallback(<K extends keyof DomainFormDraft>(field: K, value: DomainFormDraft[K]) => {
    setFormDraft((prev) => ({ ...prev, [field]: value }));
    setFormFieldError(null);
    setFormError(null);
    setSaveStatus('idle');
  }, []);

  const addToolName = useCallback((name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    setFormDraft((prev) => {
      const nextToolNames = Array.from(new Set([...parseLineValues(prev.tool_names_text), normalized]));
      const nextPassthrough = parseLineValues(prev.passthrough_tool_names_text).filter((item) => nextToolNames.includes(item));
      return {
        ...prev,
        tool_names_text: toLineValues(nextToolNames),
        passthrough_tool_names_text: toLineValues(nextPassthrough),
      };
    });
    setFormFieldError(null);
    setFormError(null);
    setSaveStatus('idle');
    setToolSearchQuery('');
    setToolSearchError(null);
    setToolSearchHits([]);
  }, []);

  const removeToolName = useCallback((name: string) => {
    setFormDraft((prev) => {
      const nextToolNames = parseLineValues(prev.tool_names_text).filter((item) => item !== name);
      const nextPassthrough = parseLineValues(prev.passthrough_tool_names_text).filter((item) => nextToolNames.includes(item));
      return {
        ...prev,
        tool_names_text: toLineValues(nextToolNames),
        passthrough_tool_names_text: toLineValues(nextPassthrough),
      };
    });
    setFormFieldError(null);
    setFormError(null);
    setSaveStatus('idle');
  }, []);

  const addPassthroughToolName = useCallback((name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    setFormDraft((prev) => {
      const nextToolNames = parseLineValues(prev.tool_names_text);
      if (!nextToolNames.includes(normalized)) {
        return prev;
      }
      const nextPassthrough = Array.from(new Set([...parseLineValues(prev.passthrough_tool_names_text), normalized]));
      return {
        ...prev,
        passthrough_tool_names_text: toLineValues(nextPassthrough),
      };
    });
    setFormFieldError(null);
    setFormError(null);
    setSaveStatus('idle');
  }, []);

  const removePassthroughToolName = useCallback((name: string) => {
    setFormDraft((prev) => {
      const nextPassthrough = parseLineValues(prev.passthrough_tool_names_text).filter((item) => item !== name);
      return {
        ...prev,
        passthrough_tool_names_text: toLineValues(nextPassthrough),
      };
    });
    setFormFieldError(null);
    setFormError(null);
    setSaveStatus('idle');
  }, []);

  const updateToolSearchQuery = useCallback((query: string) => {
    setToolSearchQuery(query);
  }, []);

  const saveForm = useCallback(async () => {
    setFormError(null);
    setFormFieldError(null);
    setSaveStatus('idle');

    const parsed = serializeDomainFormDraft(formDraft);
    if (!parsed.ok) {
      setFormFieldError(parsed.error);
      return { ok: false as const };
    }

    setIsSaving(true);
    setSaveStatus('saving');

    const result =
      mode === 'create'
        ? await createDomain(parsed.value)
        : await replaceDomain(selectedDomainKey ?? parsed.value.key, parsed.value);

    setIsSaving(false);

    if (result.error) {
      const response = result.data;
      if (isCommittedCreateOrUpdate(response) && hasReloadFailureAfterWriteCode(result.error, response.error?.code)) {
        setReloadWarning(response.error?.message ?? 'Domain saved, but runtime reload failed. SQLite state was kept.');
        setSaveStatus('saved');
        if (mode === 'create') {
          setSelectedDomainKey(response.domain.key);
          setMode('edit');
        }
        await reloadList(response.domain.key);
        return { ok: true as const };
      }
      setSaveStatus('idle');
      setFormError(normalizeError(result.error));
      return { ok: false as const };
    }

    setReloadWarning(null);
    setSaveStatus('saved');
    if (mode === 'create') {
      setSelectedDomainKey(result.data.domain.key);
      setMode('edit');
    }
    await reloadList(result.data.domain.key);
    return { ok: true as const };
  }, [formDraft, mode, reloadList, selectedDomainKey]);

  const removeSelected = useCallback(async () => {
    if (!selectedDomainKey) return;
    setIsDeleting(true);
    setPageError(null);
    const result = await deleteDomain(selectedDomainKey);
    setIsDeleting(false);
    if (result.error) {
      const response = result.data;
      if (isCommittedDelete(response) && hasReloadFailureAfterWriteCode(result.error, response.error?.code)) {
        setReloadWarning(response.error?.message ?? 'Domain deleted, but runtime reload failed. SQLite state was kept.');
        setMode('view');
        setViewMode('list');
        setPendingDeleteKey(null);
        await reloadList(response.key);
        return;
      }
      setPageError(normalizeError(result.error));
      return;
    }
    setReloadWarning(null);
    setMode('view');
    setViewMode('list');
    setPendingDeleteKey(null);
    await reloadList(result.data.key);
  }, [reloadList, selectedDomainKey]);

  const confirmDeleteFromList = useCallback(async () => {
    if (!selectedDomainKey) return;
    await removeSelected();
    setViewMode('list');
    setPendingDeleteKey(null);
  }, [removeSelected, selectedDomainKey]);

  return {
    domains,
    visibleDomains,
    selectedDomainKey,
    selectedDomain,
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
    runtimeInfo,
    importState,
    reloadWarning,
    availableTools,
    isLoadingTools,
    toolsError,
    toolSearchQuery,
    toolSearchHits,
    isSearchingTools,
    toolSearchError,
    isSearchingDomains,
    domainsSearchError,
    pendingDeleteKey,
    viewMode,
    setFilter,
    selectDomain,
    selectDomainInList,
    openListView,
    openEditFromList,
    startDeleteFromList,
    cancelDeleteFromList,
    confirmDeleteFromList,
    beginCreate,
    beginEdit,
    cancelForm,
    updateFormField,
    addToolName,
    removeToolName,
    addPassthroughToolName,
    removePassthroughToolName,
    setToolSearchQuery: updateToolSearchQuery,
    saveForm,
    removeSelected,
    reloadList,
  };
}
