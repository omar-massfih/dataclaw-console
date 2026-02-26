export interface AgentHealthSnapshot {
  status: string;
  ready: boolean;
  domains: string[];
}

export interface AvailableDomain {
  key: string;
  label: string;
}
