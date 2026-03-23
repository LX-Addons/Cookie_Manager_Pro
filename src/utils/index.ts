export * from "./domain";
export * from "./cookie-risk";
export * from "./format";
export * from "./theme";
export * from "./domain-utils";

export {
  clearSingleCookie,
  createCookie,
  editCookie,
  clearCookies,
  getAllCookies,
} from "./cleanup/cookie-ops";
export { buildOrigins, buildNonEmptyOrigins, clearBrowserData } from "./cleanup/site-data-ops";

export const toggleSetValue = (set: Set<string>, value: string): Set<string> => {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
};
