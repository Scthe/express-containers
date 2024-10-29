export * from './static_files';

declare global {
  const IS_PRODUCTION: boolean;
}

export const IS_NODE = typeof window === 'undefined';

export const isProductionBuild = () => IS_NODE || Boolean(IS_PRODUCTION);

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
