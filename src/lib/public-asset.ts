const ensureTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

export const publicAssetPath = (assetPath: string) => {
  const normalizedPath = assetPath.replace(/^\/+/, "");
  const baseUrl = ensureTrailingSlash(import.meta.env.BASE_URL || "/");
  return `${baseUrl}${normalizedPath}`;
};

