export * from './static_files';
export * from './disposables';

declare global {
  const IS_PRODUCTION: boolean;
}

export const IS_NODE = typeof window === 'undefined';

export type WithClassName = { className?: string };

export const isProductionBuild = () => IS_NODE || Boolean(IS_PRODUCTION);

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/** prevent too much text on node */
export const withLimitedStackTrace = <T>(fn: () => T) => {
  if (!IS_NODE) {
    return fn();
  }

  try {
    return fn(); // can throw on error!
  } catch (e) {
    if (e && typeof e === 'object' && 'message' in e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new Error(e.message as any);
    }
    throw e;
  }
};

export const removeSuffix = (str: string, suffix: string) =>
  str.endsWith(suffix) ? str.slice(0, -suffix.length) : str;

export const replaceSuffix = (
  str: string,
  suffix: string,
  suffixNew: string
) => {
  const changedStr = removeSuffix(str, suffix);
  // if removed suffix (made change), then set nex suffix
  return changedStr !== str ? changedStr + suffixNew : str;
};

export const ensureSuffix = (str: string, suffix: string) =>
  str.endsWith(suffix) ? str : str + suffix;

export const ensurePrefix = (str: string, prefix: string) =>
  str.startsWith(prefix) ? str : prefix + str;

export const createArray = (len: number) =>
  Array(len)
    .fill(0)
    .map((_, i) => i);

/** Same as `Object.keys()`, but preserves key type if record used */
export function typesafeObjectKeys<T extends string | number | symbol>(
  obj: Record<T, unknown>
): T[] {
  const result = Object.keys(obj);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return result as any;
}

export const delay = (timeMs = 1500): Promise<undefined> =>
  new Promise((res, _rej) => {
    setTimeout(res, timeMs);
  });

export const stringify = (a: unknown): string => {
  if (a === null) return 'null';
  if (Array.isArray(a)) return `[${a.map((e) => stringify(e)).join(', ')}]`;

  switch (typeof a) {
    case 'undefined':
      return 'undefined';
    case 'function':
      return String(a);
    case 'object':
      return safeJsonStringify(a);
    default:
      return String(a);
  }
};

/** https://github.com/Scthe/ai-prompt-editor/blob/master/src/utils/index.ts#L50 */
export function safeJsonStringify(data: unknown, space?: number): string {
  const seen: unknown[] = [];

  return JSON.stringify(
    data,
    function (_key, val) {
      if (val != null && typeof val == 'object') {
        if (seen.indexOf(val) >= 0) {
          return '<cyclic>';
        }
        seen.push(val);
      }
      return val;
    },
    space
  );
}
