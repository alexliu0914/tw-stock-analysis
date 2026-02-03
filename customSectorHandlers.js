
/**
 * 設置自定義板塊事件監聽器
 */
function setupCustomSectorListeners() {
    // 新增自定義板塊按鈕
    addCustomSectorBtn.addEventListener('click', () => {
        currentEditingSectorId = null;
        document.getElementById('customSectorModalTitle').textContent = '新增自定義板塊';
        sectorName.value = '';
        sectorStocks.value = '';
        stockValidation.style.display = 'none';
        customSectorModal.classList.add('active');
    });

    // 管理板塊按鈕
    manageSectorsBtn.addEventListener('click', () => {
        refreshCustomSectorsList();
        manageSectorsModal.classList.add('active');
    });

    // 關閉自定義板塊彈窗
    closeCustomSectorModal.addEventListener('click', () => {
        customSectorModal.classList.remove('active');
    });

    // 關閉管理板塊彈窗
    closeManageSectorsModal.addEventListener('click', () => {
        manageSectorsModal.classList.remove('active');
    });

    // 取消按鈕
    cancelCustomSector.addEventListener('click', () => {
        customSectorModal.classList.remove('active');
    });

    // 儲存自定義板塊
    saveCustomSector.addEventListener('click', handleSaveCustomSector);

    // 股票代號輸入驗證
    sectorStocks.addEventListener('input', validateStockInput);

    // 匯出板塊
    exportSectorsBtn.addEventListener('click', () => {
        exportCustomSectors();
        showError('✅ 板塊已匯出');
    });

    // 匯入板塊
    importSectorsFile.addEventListener('change', handleImportSectors);

    // 點擊背景關閉彈窗
    customSectorModal.addEventListener('click', (e) => {
        if (e.target === customSectorModal) {
            customSectorModal.classList.remove('active');
        }
    });

    manageSectorsModal.addEventListener('click', (e) => {
        if (e.target === manageSectorsModal) {
            manageSectorsModal.classList.remove('active');
        }
    });
}

/**
 * 驗證股票代號輸入
 */
function validateStockInput() {
    const input = sectorStocks.value.trim();
    if (!input) {
        stockValidation.style.display = 'none';
        return;
    }

    const result = parseStockCodes(input);

    if (result.invalid.length > 0) {
        stockValidation.className = 'validation-message warning';
        stockValidation.innerHTML = `
            ⚠️ 以下股票代號無效：<strong>${result.invalid.join(', ')}</strong><br>
            ✅ 有效代號：${result.valid.length} 個
        `;
        stockValidation.style.display = 'block';
    } else if (result.valid.length > 0) {
        stockValidation.className = 'validation-message success';
        stockValidation.textContent = `✅ 已識別 ${result.valid.length} 個有效股票代號`;
        stockValidation.style.display = 'block';
    }
}

/**
 * 處理儲存自定義板塊
 */
function handleSaveCustomSector() {
    const name = sectorName.value.trim();
    const stocksInput = sectorStocks.value.trim();

    // 驗證名稱
    if (!name) {
        stockValidation.className = 'validation-message error';
        stockValidation.textContent = '❌ 請輸入板塊名稱';
        stockValidation.style.display = 'block';
        return;
    }

    // 驗證股票代號
    if (!stocksInput) {
        stockValidation.className = 'validation-message error';
        stockValidation.textContent = '❌ 請輸入至少一個股票代號';
        stockValidation.style.display = 'block';
        return;
    }

    const result = parseStockCodes(stocksInput);

    if (result.valid.length === 0) {
        stockValidation.className = 'validation-message error';
        stockValidation.textContent = '❌ 沒有有效的股票代號';
        stockValidation.style.display = 'block';
        return;
    }

    // 儲存或更新板塊
    try {
        if (currentEditingSectorId) {
            updateCustomSector(currentEditingSectorId, name, result.valid);
            showError(`✅ 板塊「${name}」已更新`);
        } else {
            addCustomSector(name, result.valid);
            showError(`✅ 板塊「${name}」已新增`);
        }

        // 關閉彈窗並刷新列表
        customSectorModal.classList.remove('active');
        initializeSectorGrid();

    } catch (error) {
        stockValidation.className = 'validation-message error';
        stockValidation.textContent = `❌ 儲存失敗：${error.message}`;
        stockValidation.style.display = 'block';
    }
}

/**
 * 刷新自定義板塊列表
 */
function refreshCustomSectorsList() {
    const customSectors = getCustomSectors();
    const sectorIds = Object.keys(customSectors);

    if (sectorIds.length === 0) {
        customSectorsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <div class="empty-state-text">尚無自定義板塊</div>
                <div class="empty-state-hint">點擊「新增自定義板塊」開始建立</div>
            </div>
        `;
        return;
    }

    customSectorsList.innerHTML = sectorIds.map(id => {
        const sector = customSectors[id];
        const stockNames = sector.stocks.map(code => `${code} ${getStockName(code)}`).join('、');

        return `
            <div class="custom-sector-item">
                <div class="custom-sector-header">
                    <div class="custom-sector-name">${sector.name}</div>
                    <div class="custom-sector-actions">
                        <button class="icon-btn" onclick="editCustomSector('${id}')" title="編輯">
                            ✏️
                        </button>
                        <button class="icon-btn delete" onclick="confirmDeleteSector('${id}', '${sector.name}')" title="刪除">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="custom-sector-stocks">
                    ${sector.stocks.map(code => `<span class="stock-code">${code}</span>`).join('')}
                </div>
                <div class="custom-sector-meta">
                    共 ${sector.stocks.length} 支股票 • 
                    ${sector.createdAt ? '建立於 ' + new Date(sector.createdAt).toLocaleDateString('zh-TW') : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 編輯自定義板塊
 */
function editCustomSector(sectorId) {
    const customSectors = getCustomSectors();
    const sector = customSectors[sectorId];

    if (!sector) return;

    currentEditingSectorId = sectorId;
    document.getElementById('customSectorModalTitle').textContent = '編輯自定義板塊';
    sectorName.value = sector.name;
    sectorStocks.value = sector.stocks.join(', ');
    stockValidation.style.display = 'none';

    manageSectorsModal.classList.remove('active');
    customSectorModal.classList.add('active');
}

/**
 * 確認刪除板塊
 */
function confirmDeleteSector(sectorId, sectorName) {
    if (confirm(`確定要刪除板塊「${sectorName}」嗎？`)) {
        deleteCustomSector(sectorId);
        showError(`✅ 板塊「${sectorName}」已刪除`);
        refreshCustomSectorsList();
        initializeSectorGrid();
    }
}

/**
 * 處理匯入板塊
 */
function handleImportSectors(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const success = importCustomSectors(e.target.result);
            if (success) {
                showError('✅ 板塊已成功匯入');
                refreshCustomSectorsList();
                initializeSectorGrid();
            } else {
                showError('❌ 匯入失敗，請檢查檔案格式');
            }
        } catch (error) {
            showError('❌ 匯入失敗：' + error.message);
        }

        // 清除檔案選擇
        event.target.value = '';
    };

    reader.readAsText(file);
}
