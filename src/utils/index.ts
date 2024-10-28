declare global {
  const IS_PRODUCTION: boolean;
}

export const isProductionBuild = () => Boolean(IS_PRODUCTION);

export const fetchFileText = async (path: string) => {
  const response = await fetch(path);
  return response.text();
};
