/**
 * Icon service fetch wrapper with retry + concurrency queue.
 *
 * The @antv/infographic engine's built-in icon service
 * (https://www.weavefox.cn/api/v1/infographic/icon) is unstable and often
 * returns {"success":false,"message":"failed"}, especially under high
 * concurrency. The engine has NO retry mechanism.
 *
 * This module patches globalThis.fetch to intercept icon service requests
 * and add:
 * 1. Concurrency queue (max 3 concurrent requests)
 * 2. Retry on failure (up to 3 attempts with 500ms delay)
 * 3. Response caching (successful results are cached for the session)
 */

const ICON_SERVICE_HOST = 'www.weavefox.cn'
const MAX_CONCURRENT = 3
const MAX_RETRIES = 3
const RETRY_DELAY = 500

interface QueueItem {
  url: string
  resolve: (response: Response) => void
}

let activeCount = 0
const queue: QueueItem[] = []
const responseCache = new Map<string, Response>()

function processQueue() {
  while (activeCount < MAX_CONCURRENT && queue.length > 0) {
    const item = queue.shift()!
    activeCount++
    processItem(item)
  }
}

async function processItem(item: QueueItem) {
  try {
    // Check cache first
    const cached = responseCache.get(item.url)
    if (cached) {
      item.resolve(cached.clone())
      return
    }

    let lastResponse: Response | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        // Wait before retry (exponential backoff)
        await new Promise(r => setTimeout(r, RETRY_DELAY * attempt))
      }

      try {
        const response = await originalFetch(item.url)
        if (response.ok) {
          // Check if the response body is a success
          const cloned = response.clone()
          try {
            const json = await cloned.json()
            if (json?.success === false) {
              // Service returned failure — retry
              lastResponse = response
              continue
            }
          } catch {
            // Not JSON — assume success
          }

          // Success! Cache and return
          responseCache.set(item.url, response.clone())
          item.resolve(response)
          return
        }
        lastResponse = response
      } catch {
        // Network error — retry
      }
    }

    // All retries exhausted — return last response (or a failure response)
    if (lastResponse) {
      item.resolve(lastResponse)
    } else {
      item.resolve(new Response('{"success":false,"message":"All retries failed"}', {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }))
    }
  } finally {
    activeCount--
    processQueue()
  }
}

function queuedFetch(url: string): Promise<Response> {
  return new Promise(resolve => {
    queue.push({ url, resolve })
    processQueue()
  })
}

// Store original fetch
const originalFetch = globalThis.fetch

let installed = false

/**
 * Install the icon service fetch interceptor. Call this once on app startup.
 * It patches globalThis.fetch to intercept requests to the icon service host
 * and route them through the retry + queue logic.
 */
export function installIconServiceInterceptor() {
  if (installed) return
  installed = true

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

    // Only intercept GET requests to the icon service
    if (url.includes(ICON_SERVICE_HOST) && (!init || !init.method || init.method === 'GET')) {
      return queuedFetch(url)
    }

    // Pass through all other requests
    return originalFetch(input, init)
  }) as typeof globalThis.fetch
}

/**
 * Remove the icon service fetch interceptor (for cleanup/testing).
 */
export function uninstallIconServiceInterceptor() {
  if (!installed) return
  installed = false
  globalThis.fetch = originalFetch
}
