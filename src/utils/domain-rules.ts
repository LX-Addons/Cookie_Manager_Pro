import { normalizeDomain } from "@/utils/domain";

export interface AddDomainsResult {
  nextList: string[];
  changed: boolean;
}

export function addDomainsToList(newDomains: string[], existingList: string[]): AddDomainsResult {
  const normalizedNew = newDomains.map((d) => normalizeDomain(d));
  const normalizedExisting = existingList.map((d) => normalizeDomain(d));

  const filteredNew: string[] = [];
  for (const domain of normalizedNew) {
    const isCoveredByExisting = normalizedExisting.some(
      (existing) => domain === existing || domain.endsWith("." + existing)
    );
    if (isCoveredByExisting) continue;

    const isSubdomainOfAnotherNew = filteredNew.some(
      (added) => domain === added || domain.endsWith("." + added)
    );
    if (isSubdomainOfAnotherNew) continue;

    const isParentOfAnotherNew = normalizedNew.some(
      (other) => other !== domain && (other === domain || other.endsWith("." + domain))
    );
    if (isParentOfAnotherNew) {
      const alreadyHasParent = filteredNew.some(
        (added) => added === domain || added.endsWith("." + domain)
      );
      if (!alreadyHasParent) {
        filteredNew.push(domain);
      }
    } else {
      filteredNew.push(domain);
    }
  }

  const finalList: string[] = [...normalizedExisting];
  for (const newDomain of filteredNew) {
    const subdomainsToRemove = finalList.filter(
      (existing) =>
        existing !== newDomain && (existing === newDomain || existing.endsWith("." + newDomain))
    );
    const remainingList = finalList.filter((item) => !subdomainsToRemove.includes(item));
    if (!remainingList.includes(newDomain)) {
      remainingList.push(newDomain);
    }
    finalList.length = 0;
    finalList.push(...remainingList);
  }

  const sortedNext = [...finalList].sort();
  const sortedExisting = [...normalizedExisting].sort();
  const changed = JSON.stringify(sortedNext) !== JSON.stringify(sortedExisting);

  return { nextList: finalList, changed };
}
