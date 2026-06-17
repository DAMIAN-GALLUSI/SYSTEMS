const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
const EMAIL_KEY = 'rememberedAuthEmail';

export const getStoredAuthToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

export const storeAuthSession = (token: string, role: string, rememberMe: boolean) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  storage.setItem(TOKEN_KEY, token);
  storage.setItem(ROLE_KEY, role);
  otherStorage.removeItem(TOKEN_KEY);
  otherStorage.removeItem(ROLE_KEY);
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
};

export const storeRememberedEmail = (email: string) => {
  localStorage.setItem(EMAIL_KEY, email);
};

export const getRememberedEmail = () => localStorage.getItem(EMAIL_KEY) || '';

export const clearRememberedEmail = () => {
  localStorage.removeItem(EMAIL_KEY);
};