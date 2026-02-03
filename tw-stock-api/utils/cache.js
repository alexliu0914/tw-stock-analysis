const NodeCache = require('node-cache');

// 創建快取實例
// stdTTL: 預設過期時間（秒）
// checkperiod: 自動刪除過期項目的檢查間隔（秒）
const cache = new NodeCache({
    stdTTL: 300,      // 預設 5 分鐘
    checkperiod: 60   // 每 60 秒檢查一次
});

/**
 * 獲取快取
 */
function get(key) {
    return cache.get(key);
}

/**
 * 設置快取
 */
function set(key, value, ttl) {
    if (ttl) {
        return cache.set(key, value, ttl);
    }
    return cache.set(key, value);
}

/**
 * 刪除快取
 */
function del(key) {
    return cache.del(key);
}

/**
 * 清除所有快取
 */
function flushAll() {
    return cache.flushAll();
}

/**
 * 獲取快取統計
 */
function getStats() {
    return cache.getStats();
}

/**
 * 獲取所有鍵
 */
function keys() {
    return cache.keys();
}

// 快取事件監聽
cache.on('set', (key, value) => {
    console.log(`💾 快取設置: ${key}`);
});

cache.on('del', (key, value) => {
    console.log(`🗑️  快取刪除: ${key}`);
});

cache.on('expired', (key, value) => {
    console.log(`⏰ 快取過期: ${key}`);
});

module.exports = {
    get,
    set,
    del,
    flushAll,
    getStats,
    keys
};
