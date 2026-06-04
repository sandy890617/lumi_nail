/**
 * 嚕咪美學 Lumi Beauty - 穿戴甲專區腳本 (效能優化版)
 */

const API_URL = "https://script.google.com/macros/s/AKfycbzJua0aKOpdULsMNkNxQf92aFukIFeNMC0CkZESZTrj61lSneFOFKSfbpHToA3T-7hO/exec";

// 1. 網頁一載入立即執行 (不等待 window.onload)
document.addEventListener('DOMContentLoaded', () => {
    // 先嘗試讀取上次暫存的資料 (秒開關鍵)
    const cachedData = localStorage.getItem('lumi_products_cache');
    if (cachedData) {
        renderProducts(JSON.parse(cachedData));
    } else {
        showSkeleton(); // 沒快取就顯示骨架屏
    }
    
    // 背景靜默更新最新資料
    loadProducts();
});

/**
 * 骨架屏：讓使用者感覺「網頁已經動了」
 */
function showSkeleton() {
    const container = document.getElementById('product-container');
    let skeletonHTML = '';
    for(let i=0; i<6; i++) {
        skeletonHTML += `
            <div class="product-card skeleton" style="height: 300px; background: #f0f0f0; border-radius: 8px; animation: pulse 1.5s infinite;"></div>
        `;
    }
    container.innerHTML = skeletonHTML;
}

/**
 * 核心載入邏輯
 */
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}?action=getProducts`);
        const products = await response.json();

        if (products && products.length > 0) {
            // 存入本地快取，供下次使用
            localStorage.setItem('lumi_products_cache', JSON.stringify(products));
            renderProducts(products);
        } else if (!localStorage.getItem('lumi_products_cache')) {
            document.getElementById('product-container').innerHTML = "目前暫無商品";
        }
    } catch (error) {
        console.error("載入失敗:", error);
        if (!localStorage.getItem('lumi_products_cache')) {
            document.getElementById('product-container').innerHTML = "載入失敗，請重新整理";
        }
    }
}

/**
 * 渲染畫面邏輯 (獨立出來以便重複呼叫)
 */
/**
 * 渲染畫面邏輯 (修正價格顯示版本)
 */
function renderProducts(products) {
    const container = document.getElementById('product-container');
    container.innerHTML = ""; 

    products.forEach(item => {
        const isSoldOut = String(item['是否售罄']).toUpperCase() === "YES";
        const card = document.createElement('div');
        card.className = `product-card ${isSoldOut ? 'sold-out' : ''}`;
        
        // --- 修改後的價格邏輯 ---
        let priceHTML = '';
        const salePrice = item['特價'];
        const originalPrice = item['原價'];

        if (salePrice && salePrice !== "") {
            // 有特價時：顯示特價為主，原價帶刪除線
            const originalHTML = originalPrice 
                ? `<span style="text-decoration: line-through; color: #888; margin-left: 8px; font-size: 11px;">原價 ${originalPrice}</span>` 
                : '';
            priceHTML = `NT$ ${salePrice} ${originalHTML}`;
        } else {
            // 沒有特價時：直接顯示原價，不加刪除線
            priceHTML = originalPrice ? `NT$ ${originalPrice}` : '價格未定';
        }
        // -----------------------

        card.innerHTML = `
            <div class="image-container" style="position: relative; overflow: hidden; background: #f9f9f9;">
                ${isSoldOut ? '<div class="sold-out-label" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; z-index: 1;">SOLD OUT</div>' : '<span class="stock-tag" style="position: absolute; top: 10px; left: 10px; background: #8c7e74; color: white; padding: 2px 8px; font-size: 12px;">現貨</span>'}
                <img src="${item['圖片路徑']}" alt="${item['姓名']}" style="width: 100%; display: block;" loading="lazy">
            </div>
            <div class="product-info" style="padding: 10px; text-align: center;">
                <div class="product-name" style="font-weight: bold; color: #5a5a5a;">${item['姓名']}</div>
                <div class="product-specs" style="font-size: 12px; color: #888; margin: 5px 0;">
                    ${item['甲型']} / ${item['尺寸']}
                </div>
                <div class="product-price" style="color: #8c7e74; font-weight: bold;">
                    ${priceHTML}
                </div>
            </div>
        `;

        card.onclick = () => {
            if (isSoldOut) {
                alert("這件款式已經賣完囉！");
                return;
            }
            const specDesc = `款式規格：${item['甲型']} / ${item['尺寸']}`;
            const cleanDesc = item['描述'] ? item['描述'].replace(/\\n/g, '\n') : specDesc;
            
            // 點擊彈窗時也使用邏輯判斷後的顯示價格
            const finalPriceText = salePrice && salePrice !== "" ? `NT$ ${salePrice}` : `NT$ ${originalPrice}`;
            openModal(item['姓名'], finalPriceText, cleanDesc, item['圖片路徑']);
        };
        container.appendChild(card);
    });
}

// 彈窗與跳轉邏輯保持不變
function openModal(name, price, desc, imgUrl) {
    const title = document.getElementById('modalTitle');
    const priceEl = document.getElementById('modalPrice');
    const descEl = document.getElementById('modalDesc');
    const img = document.getElementById('modalImg');
    const overlay = document.getElementById('modalOverlay');
    const modalBtn = document.getElementById('modalBtn');

    if (title && priceEl && descEl && img && overlay) {
        title.innerText = name;
        priceEl.innerText = price;
        descEl.innerText = desc;
        img.src = imgUrl;
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        if (modalBtn) modalBtn.onclick = () => goToOrderPage(name, price);
    }
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function goToOrderPage(name, priceText) {
    const price = priceText.replace(/[^0-9]/g, '');
    window.location.href = `Shopping_nail.html?name=${encodeURIComponent(name)}&price=${price}`;
}