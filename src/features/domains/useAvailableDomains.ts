import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchAvailableDomains } from './api';
import type { AvailableDomain } from './types';

function formatDomainLabel(key: string): string {
  return key
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function useAvailableDomains() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [filter, setFilter] = useState('');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchAvailableDomains();

    if (result.error) {
      setDomains([]);
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    const nextDomains = Array.isArray(result.data.domains) ? result.data.domains : [];
    setDomains(nextDomains);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visibleDomains = useMemo<AvailableDomain[]>(() => {
    const q = filter.trim().toLowerCase();

    return domains
      .slice()
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .filter((key) => (q ? key.toLowerCase().includes(q) : true))
      .map((key) => ({ key, label: formatDomainLabel(key) }));
  }, [domains, filter]);

  return {
    isLoading,
    error,
    filter,
    setFilter,
    visibleDomains,
    refresh,
  };
}
