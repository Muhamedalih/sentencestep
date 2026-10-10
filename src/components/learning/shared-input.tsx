"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject,
} from "react";

/**
 * One typing <input> for a whole session.
 *
 * Every sentence (or word) used to mount its own input, so the one the learner
 * was typing in was removed from the page at the end of each sentence. On iOS
 * that closes the on-screen keyboard (a new input cannot be focused from a
 * timer), and the learner had to tap the sentence again after every sentence.
 *
 * Here a provider owns the single input — rendered by <SharedInputHost>, which
 * stays mounted for the whole session — and each screen's <SharedInput> hands
 * over the props it would have put on its own input (value, handlers, label).
 * Outside a provider (Books, Fix Your Mistakes, …) <SharedInput> is a plain
 * <input>, so nothing else changes.
 */

type InputProps = ComponentPropsWithoutRef<"input">;

/**
 * Every typing input in the app (this shared one, and Dictation/Typing/Word Lists through it)
 * asks the browser and password managers to leave it alone. A literal `autocomplete="off"` is
 * ignored by Chrome's autofill heuristics, so an unrecognized token is used instead (it falls
 * outside them); the `data-*` flags are the opt-outs LastPass, 1Password, Bitwarden and Dashlane
 * honor. These are hints, not a guarantee: the key / card / pin strip above Chrome Android's
 * keyboard is Chrome's own UI and no page can switch it off for sure.
 */
export const NO_AUTOFILL_ATTRS = {
  autoComplete: "sentencestep-no-suggestions",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: false,
  "data-lpignore": "true",
  "data-1p-ignore": "true",
  "data-bwignore": "true",
  "data-form-type": "other",
} as const;

interface Slot {
  token: symbol;
  props: InputProps;
}

class InputStore {
  element: HTMLInputElement | null = null;
  private slot: Slot | null = null;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.slot;

  publish(slot: Slot) {
    this.slot = slot;
    this.emit();
  }

  /** Only clears the slot while it is still this publisher's, so a successor that already took over keeps it. */
  unpublish(token: symbol) {
    if (this.slot?.token !== token) return;
    this.slot = null;
    this.emit();
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

const SharedInputContext = createContext<InputStore | null>(null);

const noopSubscribe = () => () => {};
const noSnapshot = () => null;
const noop = () => {};

/** Between sentences nothing is publishing: the input stays in the page, empty and inert. */
const IDLE_PROPS: InputProps = {
  value: "",
  readOnly: true,
  tabIndex: -1,
  "aria-hidden": true,
  onChange: noop,
};

export function SharedInputProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<InputStore | null>(null);
  storeRef.current ??= new InputStore();
  return (
    <SharedInputContext.Provider value={storeRef.current}>{children}</SharedInputContext.Provider>
  );
}

/** The real input. Place it before the screens that publish into it, inside a `relative` box that covers the typing area. */
export function SharedInputHost() {
  const store = useContext(SharedInputContext);
  const slot = useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    store ? store.getSnapshot : noSnapshot,
    noSnapshot,
  );
  const setElement = useCallback(
    (element: HTMLInputElement | null) => {
      if (store) store.element = element;
    },
    [store],
  );
  if (!store) return null;
  const { className: _slotClassName, ...props } = slot?.props ?? IDLE_PROPS;
  void _slotClassName;
  return (
    <input
      ref={setElement}
      {...props}
      {...NO_AUTOFILL_ATTRS}
      className="pointer-events-none absolute inset-0 h-full w-full cursor-text opacity-0"
    />
  );
}

/**
 * Drop-in for an `<input>` whose `ref` is `inputRef`. Inside a provider it renders nothing itself:
 * it publishes its props to the shared input and points `inputRef` at it.
 */
export function SharedInput({
  inputRef,
  ...props
}: InputProps & { inputRef: RefObject<HTMLInputElement | null> }) {
  const store = useContext(SharedInputContext);
  const tokenRef = useRef<symbol | null>(null);
  tokenRef.current ??= Symbol("shared-input");

  // Every render: the value and handlers change with each keystroke.
  useLayoutEffect(() => {
    if (store && tokenRef.current) store.publish({ token: tokenRef.current, props });
  });

  useLayoutEffect(() => {
    if (!store) return;
    const token = tokenRef.current;
    inputRef.current = store.element;
    return () => {
      if (token) store.unpublish(token);
      if (inputRef.current === store.element) inputRef.current = null;
    };
  }, [store, inputRef]);

  if (store) return null;
  return <input ref={inputRef} {...props} {...NO_AUTOFILL_ATTRS} />;
}
