/**
 * Demo accounts come from the build env (VITE_DEMO_ACCOUNTS="demo,alex,maria",
 * VITE_DEMO_PASSWORD). Leave them unset and this card disappears.
 */
export const demoConfig = (env: Record<string, string | undefined> = import.meta.env) => {
  const accounts = (env.VITE_DEMO_ACCOUNTS ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
  const password = env.VITE_DEMO_PASSWORD ?? '';
  return accounts.length > 0 && password ? { accounts, password } : null;
};
