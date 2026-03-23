export const buildDomainString = (
  clearedDomains: Set<string>,
  successMsg: string,
  currentDomain: string,
  t: (path: string, params?: Record<string, string | number>) => string
): string => {
  if (clearedDomains.size === 1) {
    return Array.from(clearedDomains)[0];
  }
  if (clearedDomains.size > 1) {
    return t("common.domains", {
      domain: Array.from(clearedDomains)[0],
      count: clearedDomains.size,
    });
  }
  return successMsg.includes(t("common.allWebsites")) ? t("common.allWebsites") : currentDomain;
};
