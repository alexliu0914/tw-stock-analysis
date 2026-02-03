const express = require('express');
const cors = require('cors');
const stockRoutes = require('./routes/stock');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors()); // 允許所有來源的跨域請求
app.use(express.json());

// 請求日誌
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// 路由
app.use('/api/stock', stockRoutes);

// 健康檢查端點
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 根路徑
app.get('/', (req, res) => {
    res.json({
        message: '台股分析工具 API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            stock: '/api/stock/:code',
            batch: '/api/stock/batch'
        }
    });
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: '伺服器錯誤',
        message: err.message
    });
});

// 404 處理
app.use((req, res) => {
    res.status(404).json({ error: '找不到該端點' });
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`🚀 API 伺服器運行在 http://localhost:${PORT}`);
    console.log(`📊 健康檢查: http://localhost:${PORT}/health`);
});

// 優雅關閉
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信號，正在關閉伺服器...');
    process.exit(0);
});

module.exports = app;
