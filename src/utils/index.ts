export * from './static_files';
export * from './disposables';

declare global {
  const IS_PRODUCTION: boolean;
}

export const IS_NODE = typeof window === 'undefined';

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
