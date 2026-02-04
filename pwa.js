// PWA Installation and Service Worker Registration
// This script handles PWA installation prompts and service worker lifecycle

let deferredPrompt;
let isInstalled = false;

// 檢查是否已安裝
function checkIfInstalled() {
    // 檢查是否在 standalone 模式下運行（已安裝）
    if (window.matchMedia('(display-mode: standalone)').matches) {
        isInstalled = true;
        console.log('[PWA] App is running in standalone mode');
        return true;
    }

    // 檢查 iOS Safari
    if (window.navigator.standalone === true) {
        isInstalled = true;
        console.log('[PWA] App is running in iOS standalone mode');
        return true;
    }

    return false;
}

// 註冊 Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('[PWA] Service Worker registered successfully:', registration.scope);

            // 監聽更新
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('[PWA] New Service Worker found');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // 有新版本可用
                        showUpdateNotification();
                    }
                });
            });

            // 檢查更新
            registration.update();

            return registration;
        } catch (error) {
            console.error('[PWA] Service Worker registration failed:', error);
        }
    } else {
        console.log('[PWA] Service Workers are not supported');
    }
}

// 顯示更新通知
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
    <div class="update-content">
      <p>🎉 有新版本可用！</p>
      <button id="updateBtn" class="btn btn-primary">立即更新</button>
      <button id="dismissBtn" class="btn btn-secondary">稍後</button>
    </div>
  `;

    document.body.appendChild(notification);

    // 更新按鈕
    document.getElementById('updateBtn').addEventListener('click', () => {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    });

    // 關閉按鈕
    document.getElementById('dismissBtn').addEventListener('click', () => {
        notification.remove();
    });
}

// 顯示安裝提示
function showInstallPrompt() {
    if (isInstalled || !deferredPrompt) {
        return;
    }

    const installBanner = document.createElement('div');
    installBanner.className = 'install-banner';
    installBanner.innerHTML = `
    <div class="install-content">
      <div class="install-icon">📱</div>
      <div class="install-text">
        <h3>安裝台股分析工具</h3>
        <p>加入主畫面，像 App 一樣使用</p>
      </div>
      <div class="install-actions">
        <button id="installBtn" class="btn btn-primary">安裝</button>
        <button id="closeInstallBtn" class="btn-icon">✕</button>
      </div>
    </div>
  `;

    document.body.appendChild(installBanner);

    // 安裝按鈕
    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('[PWA] User choice:', outcome);

            if (outcome === 'accepted') {
                console.log('[PWA] User accepted the install prompt');
            }

            deferredPrompt = null;
            installBanner.remove();
        }
    });

    // 關閉按鈕
    document.getElementById('closeInstallBtn').addEventListener('click', () => {
        installBanner.remove();
        // 記住用戶關閉了提示（24小時內不再顯示）
        localStorage.setItem('installPromptDismissed', Date.now());
    });
}

// 檢查是否應該顯示安裝提示
function shouldShowInstallPrompt() {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const now = Date.now();
        const hoursPassed = (now - dismissedTime) / (1000 * 60 * 60);

        // 24小時後才再次顯示
        if (hoursPassed < 24) {
            return false;
        }
    }
    return true;
}

// 監聽安裝提示事件
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] beforeinstallprompt event fired');
    e.preventDefault();
    deferredPrompt = e;

    // 延遲顯示安裝提示（讓用戶先體驗 App）
    if (shouldShowInstallPrompt()) {
        setTimeout(() => {
            showInstallPrompt();
        }, 30000); // 30秒後顯示
    }
});

// 監聽安裝成功事件
window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    isInstalled = true;
    deferredPrompt = null;

    // 顯示感謝訊息
    const thankYouMessage = document.createElement('div');
    thankYouMessage.className = 'thank-you-message';
    thankYouMessage.innerHTML = `
    <div class="thank-you-content">
      <h3>🎉 安裝成功！</h3>
      <p>現在您可以從主畫面快速開啟台股分析工具</p>
    </div>
  `;
    document.body.appendChild(thankYouMessage);

    setTimeout(() => {
        thankYouMessage.remove();
    }, 5000);
});

// iOS Safari 安裝提示
function showIOSInstallPrompt() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone === true;

    if (isIOS && !isInStandaloneMode && shouldShowInstallPrompt()) {
        const iosBanner = document.createElement('div');
        iosBanner.className = 'ios-install-banner';
        iosBanner.innerHTML = `
      <div class="ios-install-content">
        <div class="ios-install-icon">📱</div>
        <div class="ios-install-text">
          <h3>安裝到主畫面</h3>
          <p>點擊 <span class="share-icon">⎋</span> 然後選擇「加入主畫面」</p>
        </div>
        <button id="closeIOSBanner" class="btn-icon">✕</button>
      </div>
    `;

        document.body.appendChild(iosBanner);

        document.getElementById('closeIOSBanner').addEventListener('click', () => {
            iosBanner.remove();
            localStorage.setItem('installPromptDismissed', Date.now());
        });

        // 10秒後自動關閉
        setTimeout(() => {
            if (iosBanner.parentNode) {
                iosBanner.remove();
            }
        }, 10000);
    }
}

// 初始化 PWA
async function initPWA() {
    console.log('[PWA] Initializing...');

    // 檢查是否已安裝
    checkIfInstalled();

    // 註冊 Service Worker
    await registerServiceWorker();

    // 顯示 iOS 安裝提示（如果適用）
    setTimeout(() => {
        showIOSInstallPrompt();
    }, 5000);

    console.log('[PWA] Initialization complete');
}

// 當頁面載入完成時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPWA);
} else {
    initPWA();
}

// 導出函數供其他腳本使用
window.PWA = {
    isInstalled: () => isInstalled,
    showInstallPrompt: showInstallPrompt,
    checkIfInstalled: checkIfInstalled
};
