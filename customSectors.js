// 自定義板塊管理模組
// 使用 localStorage 儲存使用者自定義的板塊

/**
 * 獲取所有自定義板塊
 */
function getCustomSectors() {
    const stored = localStorage.getItem('customSectors');
    return stored ? JSON.parse(stored) : {};
}

/**
 * 儲存自定義板塊
 */
function saveCustomSectors(sectors) {
    localStorage.setItem('customSectors', JSON.stringify(sectors));
}

/**
 * 新增自定義板塊
 */
function addCustomSector(name, stocks) {
    const customSectors = getCustomSectors();
    const id = 'custom_' + Date.now();

    customSectors[id] = {
        name: name,
        stocks: stocks,
        isCustom: true,
        createdAt: new Date().toISOString()
    };

    saveCustomSectors(customSectors);
    return id;
}

/**
 * 更新自定義板塊
 */
function updateCustomSector(id, name, stocks) {
    const customSectors = getCustomSectors();

    if (customSectors[id]) {
        customSectors[id].name = name;
        customSectors[id].stocks = stocks;
        customSectors[id].updatedAt = new Date().toISOString();
        saveCustomSectors(customSectors);
        return true;
    }

    return false;
}

/**
 * 刪除自定義板塊
 */
function deleteCustomSector(id) {
    const customSectors = getCustomSectors();

    if (customSectors[id]) {
        delete customSectors[id];
        saveCustomSectors(customSectors);
        return true;
    }

    return false;
}

/**
 * 獲取所有板塊（包含預設和自定義）
 */
function getAllSectors() {
    // 預設板塊
    const defaultSectors = Object.keys(SECTORS).map(key => ({
        id: key,
        name: SECTORS[key].name,
        stocks: SECTORS[key].stocks,
        isCustom: false
    }));

    // 自定義板塊
    const customSectors = getCustomSectors();
    const customSectorsList = Object.keys(customSectors).map(key => ({
        id: key,
        name: customSectors[key].name,
        stocks: customSectors[key].stocks,
        isCustom: true
    }));

    return [...defaultSectors, ...customSectorsList];
}

/**
 * 獲取特定板塊的股票（支援自定義板塊）
 */
function getSectorStocksById(sectorId) {
    // 先檢查預設板塊
    if (SECTORS[sectorId]) {
        return SECTORS[sectorId].stocks;
    }

    // 檢查自定義板塊
    const customSectors = getCustomSectors();
    if (customSectors[sectorId]) {
        return customSectors[sectorId].stocks;
    }

    return [];
}

/**
 * 驗證股票代號是否存在
 */
function validateStockCode(code) {
    return STOCK_NAMES.hasOwnProperty(code);
}

/**
 * 解析股票代號輸入（支援逗號、空格分隔）
 */
function parseStockCodes(input) {
    if (!input) return [];

    // 移除多餘空白，用逗號或空格分隔
    const codes = input
        .replace(/\s+/g, ',')  // 將空格替換為逗號
        .split(',')             // 用逗號分隔
        .map(code => code.trim())  // 移除前後空白
        .filter(code => code.length > 0);  // 移除空字串

    // 驗證並過濾有效的股票代號
    const validCodes = [];
    const invalidCodes = [];

    codes.forEach(code => {
        if (validateStockCode(code)) {
            validCodes.push(code);
        } else {
            invalidCodes.push(code);
        }
    });

    return {
        valid: validCodes,
        invalid: invalidCodes
    };
}

/**
 * 匯出自定義板塊（JSON 格式）
 */
function exportCustomSectors() {
    const customSectors = getCustomSectors();
    const dataStr = JSON.stringify(customSectors, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom_sectors_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * 匯入自定義板塊（JSON 格式）
 */
function importCustomSectors(jsonData) {
    try {
        const imported = JSON.parse(jsonData);
        const customSectors = getCustomSectors();

        // 合併匯入的板塊
        Object.keys(imported).forEach(key => {
            const newId = 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            customSectors[newId] = {
                ...imported[key],
                isCustom: true,
                importedAt: new Date().toISOString()
            };
        });

        saveCustomSectors(customSectors);
        return true;
    } catch (error) {
        console.error('匯入失敗:', error);
        return false;
    }
}
