export const clearBrowserData = async (domains: Set<string>, options: { clearCache?: boolean, clearLocalStorage?: boolean, clearIndexedDB?: boolean }) => {
  const { clearCache, clearLocalStorage, clearIndexedDB } = options

  if (clearCache && domains.size > 0) {
    try {
      const origins: string[] = []
      domains.forEach(d => {
        origins.push(`http://${d}`, `https://${d}`)
      })
      await chrome.browsingData.remove(
        { origins },
        {
          cacheStorage: true,
          fileSystems: true,
          serviceWorkers: true
        }
      )
    } catch (e) {
      console.error("Failed to clear cache:", e)
    }
  }

  if (clearLocalStorage && domains.size > 0) {
    try {
      const origins: string[] = []
      domains.forEach(d => {
        origins.push(`http://${d}`, `https://${d}`)
      })
      await chrome.browsingData.remove(
        { origins },
        {
          localStorage: true
        }
      )
    } catch (e) {
      console.error("Failed to clear localStorage:", e)
    }
  }

  if (clearIndexedDB && domains.size > 0) {
    try {
      const origins: string[] = []
      domains.forEach(d => {
        origins.push(`http://${d}`, `https://${d}`)
      })
      await chrome.browsingData.remove(
        { origins },
        {
          indexedDB: true
        }
      )
    } catch (e) {
      console.error("Failed to clear IndexedDB:", e)
    }
  }
}
