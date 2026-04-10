function toBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

function toNumber(value: string | undefined, defaultValue: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:4000/api/v1',
  apiTimeoutMs: toNumber(import.meta.env.VITE_API_TIMEOUT_MS, 15000),
  enableMockAuth: toBoolean(import.meta.env.VITE_ENABLE_MOCK_AUTH, false),
};
