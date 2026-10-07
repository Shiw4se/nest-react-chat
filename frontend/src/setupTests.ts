import '@testing-library/jest-dom';

// Node 26 ships an experimental global localStorage that shadows jsdom's and
// is undefined without --localstorage-file. Provide an in-memory one so
// zustand's persist middleware works in tests.
const hasWorkingStorage = (() => {
  try {
    window.localStorage.setItem('__probe__', '1');
    window.localStorage.removeItem('__probe__');
    return true;
  } catch {
    return false;
  }
})();

if (!hasWorkingStorage) {
  const data = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
  Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true });
}
