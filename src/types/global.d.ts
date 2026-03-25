declare global {
  namespace chrome.cookies {
    interface Cookie {
      firstPartyDomain?: string;
    }
  }
}

export {};
