const express = require('express');
const router = express.Router();
const yahooService = require('../services/yahoo');
const cache = require('../utils/cache');

/**
 * 獲取單一股票數據
 * GET /api/stock/:code
 */
router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;

        console.log(`📊 請求股票: ${code}`);

        // 檢查快取
        const cached = cache.get(code);
        if (cached) {
            console.log(`✅ 從快取返回: ${code}`);
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }

        // 從 Yahoo Finance 獲取數據
        const data = await yahooService.fetchStock(code);

        // 儲存到快取（5 分鐘）
        cache.set(code, data, 300);

        console.log(`✅ 成功獲取: ${code}`);

        res.json({
            success: true,
            data: data,
            cached: false
        });

    } catch (error) {
        console.error(`❌ 獲取 ${req.params.code} 失敗:`, error.message);
        res.status(500).json({
            success: false,
            error: '無法獲取股票數據',
            message: error.message
        });
    }
});

/**
 * 批量獲取股票數據
 * POST /api/stock/batch
 * Body: { codes: ['2330', '2317', '2454'] }
 */
router.post('/batch', async (req, res) => {
    try {
        const { codes } = req.body;

        if (!codes || !Array.isArray(codes)) {
            return res.status(400).json({
                success: false,
                error: '請提供股票代號陣列'
            });
        }

        console.log(`📊 批量請求: ${codes.length} 支股票`);

        // 批量獲取
        const results = await yahooService.fetchBatch(codes);

        console.log(`✅ 批量完成: ${results.length}/${codes.length} 成功`);

        res.json({
            success: true,
            data: results,
            total: codes.length,
            success_count: results.length
        });

    } catch (error) {
        console.error('❌ 批量獲取失敗:', error.message);
        res.status(500).json({
            success: false,
            error: '批量獲取失敗',
            message: error.message
        });
    }
});

/**
 * 清除快取
 * DELETE /api/stock/cache/:code
 */
router.delete('/cache/:code', (req, res) => {
    const { code } = req.params;
    const deleted = cache.del(code);

    res.json({
        success: true,
        message: deleted ? `已清除 ${code} 的快取` : `${code} 沒有快取`
    });
});

/**
 * 清除所有快取
 * DELETE /api/stock/cache
 */
router.delete('/cache', (req, res) => {
    cache.flushAll();

    res.json({
        success: true,
        message: '已清除所有快取'
    });
});

/**
 * 獲取快取統計
 * GET /api/stock/cache/stats
 */
router.get('/cache/stats', (req, res) => {
    const stats = cache.getStats();

    res.json({
        success: true,
        stats: stats
    });
});

module.exports = router;
