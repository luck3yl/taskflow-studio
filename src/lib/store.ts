import { useSyncExternalStore } from 'react';

type Listener = () => void;

export function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<Listener>();

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const getState = () => state;

  const setState = (fn: (prev: T) => T) => {
    state = fn(state);
    listeners.forEach((l) => l());
  };

  const useStore = <U>(selector: (state: T) => U): U => {
    return useSyncExternalStore(
      subscribe,
      () => selector(state),
      () => selector(initialState)
    );
  };

  return { getState, setState, useStore, subscribe };
}
