export const toAbsoluteUrl = (baseUrl: string, maybeRelativePath: string): string => {
  if (/^https?:\/\//i.test(maybeRelativePath)) {
    return maybeRelativePath;
  }

  return new URL(maybeRelativePath, baseUrl).toString();
};
