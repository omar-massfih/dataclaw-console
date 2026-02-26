import { apiRequest } from '../../lib/api-client';
import type { ApiResponse } from '../../types/api';
import type { AgentHealthSnapshot } from './types';

export function fetchAvailableDomains(): Promise<ApiResponse<AgentHealthSnapshot>> {
  return apiRequest<AgentHealthSnapshot>('/api/agent/health');
}
