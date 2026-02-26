interface Env {
  apiBaseUrl: string;
}

function requireNonEmptyEnv(value: string | undefined, name: string): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return normalized;
}

export function getEnv(): Env {
  return {
    apiBaseUrl: requireNonEmptyEnv(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL'),
  };
}
