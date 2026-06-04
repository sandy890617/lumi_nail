/**
 * 1. 彈跳視窗控制 (核心邏輯：自動判斷現貨或售完)
 */
function openModal(name, price, desc, imgSrc) {
    // 填入資訊
    document.getElementById('modalTitle').innerText = name;
    document.getElementById('modalPrice').innerText = price;
    document.getElementById('modalDesc').innerText = desc;
    
    // 修正：有些圖片 ID 可能是 modalImg 或 modalImage，請統一
    const imgElement = document.getElementById('modalImg') || document.getElementById('modalImage');
    if (imgElement) imgElement.src = imgSrc;

    // 抓取按鈕 (改用 ID 抓取最保險)
    const modalBtn = document.getElementById('modalBtn');
    if (!modalBtn) return; // 防呆：如果找不到按鈕就結束

    // 判定邏輯：將字串轉小寫並檢查關鍵字
    // 包含 "售完"、"sold out"、或描述裡有 "暫無現貨"
    const isSoldOut = name.toLowerCase().includes("售完") || 
                      desc.includes("售完") || 
                      desc.includes("暫無現貨");

    if (isSoldOut) {
        modalBtn.innerText = "私訊詢問是否可訂製";
        modalBtn.style.backgroundColor = "#8c7e74"; // 強制變色
        modalBtn.onclick = function() {
            const lineUrl = `https://line.me/R/ti/p/@yourid?text=${encodeURIComponent('您好！我想詢問款式：' + name + ' 是否可以訂製尺寸？')}`;
            window.open(lineUrl, '_blank');
        };
    } else {
        modalBtn.innerText = "立即下單";
        modalBtn.style.backgroundColor = "#5d524a"; // 回復原色
        modalBtn.onclick = function() {
            // 帶參數跳轉
            const urlPrice = price.replace('NT$ ', '').trim();
            window.location.href = `order.html?name=${encodeURIComponent(name)}&price=${urlPrice}`;
        };
    }

    document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

// 點擊背景遮罩關閉視窗
window.onclick = function(event) {
    const overlay = document.getElementById('modalOverlay');
    if (event.target === overlay) {
        closeModal();
    }
};

/**
 * 2. 規格數據庫
 */
const nailData = {
    "中方型": { "XS": [14, 11.6, 11.1, 10.1, 7.5], "S": [15, 12, 11.5, 10.5, 8.5], "M": [16, 12.5, 12, 11.2, 9], "L": [17, 13, 12.5, 12, 10] },
    "短T型": { "XS": [14.3, 10, 11.2, 10.1, 9], "S": [15.1, 11.1, 11.1, 11.2, 9.1], "M": [13.2, 9.2, 9.2, 10.2, 8.2], "L": [17.4, 12.6, 14.2, 13.1, 11.1] },
    "長T型": { "XS": [14.6, 9.7, 11.4, 10.3, 9.4], "S": [15.5, 10.9, 12.4, 11.5, 9.4], "M": [16.5, 11.9, 13.4, 12.5, 10.3], "L": [17.4, 12.9, 14.4, 13.4, 11.5] },
    "短方圓型": { "XS": [14, 11.6, 11.1, 10.1, 7.5], "S": [15, 11.1, 12, 11.1, 9.2], "M": [16, 11.6, 13.1, 12.1, 10.1], "L": [17, 13.1, 14, 13.1, 11.1] },
    "新短方型": { "XS": [14, 9.9, 11, 9.9, 8.1], "S": [15.3, 10.7, 12.1, 11, 9], "M": [16.1, 11.8, 12.9, 12.1, 9.9], "L": [17.1, 12.9, 14, 12.9, 11] },
    "中杏仁型": { "XS": [14.1, 9.5, 11, 10, 9], "S": [15.1, 11, 12, 11, 9.1], "M": [16.4, 12.1, 13.2, 12.2, 10.1], "L": [17.1, 12.7, 14, 13.1, 10.5] }
};

let currentType = "中方型"; 
let currentSize = "XS";

/**
 * 3. 規格選取與顯示邏輯
 */
document.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', function() {
        const group = this.parentElement;
        const label = group.previousElementSibling.innerText;
        const value = this.innerText;

        // UI 切換
        group.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // 更新數據紀錄
        if (label.includes("甲型")) currentType = value;
        if (label.includes("尺寸")) currentSize = value;

        updateSizeDisplay();
    });
});

function updateSizeDisplay() {
    const displayBox = document.getElementById('size-detail-display');
    const customHint = document.getElementById('custom-hint');
    const ids = ['d-thumb', 'd-index', 'd-middle', 'd-ring', 'd-pinky'];

    if (!displayBox) return;
    displayBox.style.display = 'block';

    if (currentSize === "客製化") {
        if (customHint) customHint.style.display = 'block';
        ids.forEach(id => document.getElementById(id).innerText = '--');
    } else {
        if (customHint) customHint.style.display = 'none';
        const data = nailData[currentType] ? nailData[currentType][currentSize] : null;
        if (data) {
            ids.forEach((id, index) => {
                document.getElementById(id).innerText = data[index];
            });
        }
    }
}

/**
 * 4. 初始化與頁面載入
 */
document.addEventListener('DOMContentLoaded', () => {
    // 預設選取第一個選項
    updateSizeDisplay();
    
    // 如果是下單頁面，從 URL 抓取資訊
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const price = params.get('price');
    
    if (name && document.getElementById('product-name')) {
        document.getElementById('product-name').innerText = name;
    }
    if (price && document.getElementById('product-price')) {
        document.getElementById('product-price').innerText = price;
    }
});