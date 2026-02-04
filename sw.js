// Service Worker for Taiwan Stock Analysis PWA
// Version: 1.0.0

const CACHE_NAME = 'tw-stock-v1.0.0';
const RUNTIME_CACHE = 'tw-stock-runtime';

// 需要快取的核心檔案
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/analysis.js',
    '/stockData.js',
    '/charts.js',
    '/customSectors.js',
    '/customSectorHandlers.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                console.log('[SW] Core assets cached successfully');
                return self.skipWaiting(); // 立即啟用新的 Service Worker
            })
            .catch((error) => {
                console.error('[SW] Failed to cache core assets:', error);
            })
    );
});

// 啟用 Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // 刪除舊版本的快取
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim(); // 立即控制所有頁面
            })
    );
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 跳過非 GET 請求
    if (request.method !== 'GET') {
        return;
    }

    // 跳過外部 API 請求（讓它們直接訪問網路）
    if (url.origin !== location.origin) {
        // 對於 API 請求，使用 Network First 策略
        if (url.hostname.includes('yahoo') || url.hostname.includes('api')) {
            event.respondWith(networkFirst(request));
            return;
        }
        // 對於 CDN 資源（如 Chart.js），使用 Cache First 策略
        if (url.hostname.includes('cdn')) {
            event.respondWith(cacheFirst(request));
            return;
        }
    }

    // 對於本地資源，使用 Cache First 策略
    event.respondWith(cacheFirst(request));
});

// Cache First 策略：優先使用快取，失敗時才訪問網路
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        console.log('[SW] Serving from cache:', request.url);
        return cached;
    }

    try {
        console.log('[SW] Fetching from network:', request.url);
        const response = await fetch(request);

        // 只快取成功的回應
        if (response.ok) {
            const runtimeCache = await caches.open(RUNTIME_CACHE);
            await runtimeCache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);

        // 如果是 HTML 請求且離線，返回離線頁面
        if (request.destination === 'document') {
            return new Response(
                `<!DOCTYPE html>
        <html lang="zh-TW">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>離線模式 - 台股分析工具</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .offline-container {
              text-align: center;
              max-width: 500px;
            }
            h1 { font-size: 3em; margin: 0; }
            p { font-size: 1.2em; opacity: 0.8; }
            .retry-btn {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              border: none;
              padding: 12px 24px;
              font-size: 1em;
              border-radius: 8px;
              cursor: pointer;
              margin-top: 20px;
            }
            .retry-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <h1>📡</h1>
            <h2>目前處於離線模式</h2>
            <p>無法連接到網路。請檢查您的網路連線後重試。</p>
            <button class="retry-btn" onclick="location.reload()">重新載入</button>
          </div>
        </body>
        </html>`,
                {
                    headers: { 'Content-Type': 'text/html' }
                }
            );
        }

        throw error;
    }
}

// Network First 策略：優先訪問網路，失敗時才使用快取
async function networkFirst(request) {
    try {
        const response = await fetch(request);

        // 快取成功的回應
        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            await cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        const cached = await caches.match(request);

        if (cached) {
            return cached;
        }

        throw error;
    }
}

// 監聽訊息（用於手動更新快取等）
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

console.log('[SW] Service Worker loaded');
