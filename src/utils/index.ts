export * from './static_files';

declare global {
  const IS_PRODUCTION: boolean;
}

export const IS_NODE = typeof window === 'undefined';

export const isProductionBuild = () => IS_NODE || Boolean(IS_PRODUCTION);

export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export const limitStackTrace = <T>(fn: () => T) => {
  if (!IS_NODE) {
    return fn();
  }

  // prevent too much text on node
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

export const ensureSuffix = (str: string, suffix: string) =>
  str.endsWith(suffix) ? str : str + suffix;

export const createArray = (len: number) =>
  Array(len)
    .fill(0)
    .map((_, i) => i);
