export class TabUrlManager {
  private readonly tabUrlMap = new Map<number, string>();

  async initializeFromTabs(): Promise<void> {
    try {
      const allTabs = await chrome.tabs.query({});
      this.tabUrlMap.clear();
      for (const tab of allTabs) {
        if (tab.id && tab.url) {
          this.tabUrlMap.set(tab.id, tab.url);
        }
      }
    } catch (e) {
      console.error("Failed to initialize tab URL map from tabs:", e);
    }
  }

  get(tabId: number): string | undefined {
    return this.tabUrlMap.get(tabId);
  }

  set(tabId: number, url: string): void {
    this.tabUrlMap.set(tabId, url);
  }

  delete(tabId: number): boolean {
    return this.tabUrlMap.delete(tabId);
  }

  has(tabId: number): boolean {
    return this.tabUrlMap.has(tabId);
  }

  getUrls(): string[] {
    return Array.from(this.tabUrlMap.values());
  }

  get size(): number {
    return this.tabUrlMap.size;
  }

  clear(): void {
    this.tabUrlMap.clear();
  }
}
