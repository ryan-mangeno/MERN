// Backend API configuration that adapts to environment
export const getApiBaseUrl = (): string => {
  if (import.meta.env.MODE === 'production') {
    return import.meta.env.VITE_API_URL || 'http://206.81.0.15:5000';
  }
  return 'http://localhost:5000';
};

export const buildPath = (route: string): string => {
  return `${getApiBaseUrl()}/${route}`;
};
