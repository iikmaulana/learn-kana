// Vitest setup (vite.config.mjs, test.setupFiles): adds the jest-dom matchers
// (toBeInTheDocument, toHaveClass, toHaveTextContent, ...) to expect().
import '@testing-library/jest-dom';

// Node 22+/26 ships an experimental global localStorage getter that returns
// undefined unless the process runs with --localstorage-file. Under jsdom
// window === globalThis, so that broken getter shadows jsdom's real storage
// and every test touching localStorage fails on undefined.clear(). Install an
// in-memory Web Storage behind a capability guard, so a working jsdom storage
// is left untouched. Defining Storage too keeps vi.spyOn(Storage.prototype,...)
// working in storage.test.js.
if (!globalThis.localStorage) {
  class InMemoryStorage {
    constructor() {
      this.__data = new Map();
    }
    get length() {
      return this.__data.size;
    }
    key(index) {
      return [...this.__data.keys()][index] ?? null;
    }
    getItem(key) {
      const k = String(key);
      return this.__data.has(k) ? this.__data.get(k) : null;
    }
    setItem(key, value) {
      this.__data.set(String(key), String(value));
    }
    removeItem(key) {
      this.__data.delete(String(key));
    }
    clear() {
      this.__data.clear();
    }
  }
  const define = (name, value) =>
    Object.defineProperty(globalThis, name, {
      value,
      configurable: true,
      writable: true,
    });
  define('Storage', InMemoryStorage);
  define('localStorage', new InMemoryStorage());
  define('sessionStorage', new InMemoryStorage());
}

// react-router's data router (createMemoryRouter) builds a Request with the
// AbortSignal of jsdom, which Node's Request refuses: keep the signal next to
// the request instead. Only the tests run with jsdom; browsers are unaffected.
const NodeRequest = globalThis.Request;
globalThis.Request = class Request extends NodeRequest {
  constructor(input, init) {
    if (!init || !init.signal) {
      super(input, init);
      return;
    }
    const { signal, ...rest } = init;
    super(input, rest);
    Object.defineProperty(this, 'signal', { value: signal });
  }
};
