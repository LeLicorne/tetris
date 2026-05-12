import { configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';

// Provide a small storage wrapper that uses localStorage in the browser
// and an in-memory fallback for environments where localStorage is not available.
const storage = (() => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return {
      getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key: string, value: string) =>
        Promise.resolve(window.localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(window.localStorage.removeItem(key)),
    };
  }

  const memoryStorage: Record<string, string> = {};
  return {
    getItem: (key: string) =>
      Promise.resolve(
        Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null
      ),
    setItem: (key: string, value: string) => {
      memoryStorage[key] = value;
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
      return Promise.resolve();
    },
  };
})();

import rootReducer from './reducers';

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth', 'options'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(),
});

const persistor = persistStore(store);

export { persistor, store };

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
