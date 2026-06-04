// 全域變數：儲存試算表資料
let cateyeProductsData = [];

// 妳的後端 API 網址
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyhv8Zgj5wKM8ror9eOl-oxQaOCeq-IXzprvZE9j8PVy8csT2o8PAQHeBKi_H9Hm3mj/exec?action=getCatEye"; 
// 💥 快取 Key
const CACHE_KEY = "cateye_products_cache_v3"; 

// 1. ⚡ 網頁一載入立即執行 (與 Lumi 一樣的秒開設計)
document.addEventListener('DOMContentLoaded', () => {
    initLightbox(); // 初始化大圖放大功能
    
    // 檢查快取
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (cachedData) {
        try {
            // 有快取就立刻秒開渲染
            cateyeProductsData = JSON.parse(cachedData);
            renderCatEyeProducts(cateyeProductsData);
        } catch (e) {
            showCatEyeSkeleton(); // 失敗就顯示骨架
        }
    } else {
        showCatEyeSkeleton(); // 完全沒快取時顯示骨架屏
    }
    
    // 背景默默抓取最新資料
    fetchCatEyeData(!!cachedData);
    
    // 超時防呆 (只有在完全沒資料時才觸發提示)
    setTimeout(() => {
        const container = document.getElementById("product-container");
        if (container && (!cateyeProductsData || cateyeProductsData.length === 0) && container.innerHTML.includes("pulse")) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #d9534f; background: #fdf7f7; border-radius: 8px; border: 1px dashed #d9534f; max-width: 500px; margin: 0 auto;">
                    <p style="font-weight: bold; margin-bottom: 8px;">⚠️ 載入逾時提示</p>
                    <p style="font-size: 13px; color: #666;">試算表資料讀取時間過長。請確認 Google 試算表是否有正常部署為網頁應用程式。</p>
                </div>
            `;
        }
    }, 6000);
});

/**
 * ⚡ 貓眼專屬骨架屏：讓使用者感覺「網頁已經動了」
 */
function showCatEyeSkeleton() {
    const container = document.getElementById('product-container');
    if (!container) return;
    let skeletonHTML = '';
    for(let i=0; i<6; i++) {
        skeletonHTML += `
            <div style="padding: 10px; display: flex; flex-direction: column; gap: 10px;">
                <div class="skeleton" style="width: 100%; aspect-ratio: 1/1; background: #f0f0f0; border-radius: 8px; animation: pulse 1.5s infinite;"></div>
                <div class="skeleton" style="width: 60%; height: 16px; background: #f0f0f0; margin: 0 auto; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
            </div>
        `;
    }
    container.innerHTML = skeletonHTML;

    // 注入動態閃爍的 CSS (如果原本 CSS 沒寫到的話)
    if (!document.getElementById('skeleton-style')) {
        const style = document.createElement('style');
        style.id = 'skeleton-style';
        style.innerHTML = `@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`;
        document.head.appendChild(style);
    }
}

// 撈取 Google 試算表資料
async function fetchCatEyeData(isBackground = false) {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        // 檢查新舊資料是否有一致
        const isDataChanged = JSON.stringify(data) !== JSON.stringify(cateyeProductsData);
        
        if (isDataChanged || !isBackground) {
            cateyeProductsData = data;
            localStorage.setItem(CACHE_KEY, JSON.stringify(data)); 
            renderCatEyeProducts(cateyeProductsData);
            console.log("🔄 貓表資料已同步最新狀態！");
        }
        
    } catch (error) {
        console.error("資料撈取失敗:", error);
        const container = document.getElementById("product-container");
        if (container && (!cateyeProductsData || cateyeProductsData.length === 0)) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: red;">資料庫連線失敗，請檢查 API 設定。</div>`;
        }
    }
}

// 模糊欄位比對
function getCompatibleRow(product) {
    const keys = Object.keys(product).map(k => k.trim());
    const cleanProduct = {};
    Object.keys(product).forEach(k => {
        cleanProduct[k.trim()] = product[k];
    });

    const brandKey = keys.find(k => k.includes('品牌') || k.toLowerCase().includes('brand')) || '';
    const colorKey = keys.find(k => k.includes('色號') || k.includes('名稱') || k.toLowerCase().includes('color')) || '';
    const nameKey = keys.find(k => k.includes('名字') || k.includes('姓名') || k.toLowerCase().includes('colorname') || k.toLowerCase().includes('name')) || '';
    const pathKey = keys.find(k => k.includes('圖片') || k.includes('路徑') || k.toLowerCase().includes('path') || k.toLowerCase().includes('image')) || '';

    let finalName = nameKey && cleanProduct[nameKey] ? String(cleanProduct[nameKey]).trim() : '';
    
    if (!finalName || finalName === 'undefined') {
        const fallbackColor = colorKey && cleanProduct[colorKey] ? String(cleanProduct[colorKey]).trim() : '';
        finalName = fallbackColor ? fallbackColor.replace(/_/g, ' ') : '未填名稱';
    }

    return {
        brand: brandKey && cleanProduct[brandKey] ? String(cleanProduct[brandKey]).trim() : '未填品牌',
        color: colorKey && cleanProduct[colorKey] ? String(cleanProduct[colorKey]).trim() : '未填色號',
        name: finalName,
        imagePath: pathKey && cleanProduct[pathKey] ? String(cleanProduct[pathKey]).trim() : ''
    };
}

// ⚡ 渲染主畫面網格 (優化效能：一次性注入，並加入 lazy loading)
function renderCatEyeProducts(products) {
    const container = document.getElementById("product-container");
    if (!container) return;
    
    let allHtml = ""; 

    products.forEach((product, index) => {
        const row = getCompatibleRow(product);
        const displayName = row.name; 
        const paths = row.imagePath ? row.imagePath.split(',').map(p => p.trim()).filter(p => p !== "") : [];
        
        let coverImage = 'img/default-cover.jpg'; 
        if (paths.length > 0) {
            const firstImg = paths.find(p => !p.toLowerCase().endsWith('.mp4'));
            coverImage = firstImg ? firstImg : paths[0];
        }
        
        // 加上 loading="lazy" 降低圖片阻塞造成的卡頓
        allHtml += `
            <div class="color-item" onclick="openCatEyeModal(${index})" style="cursor: pointer;">
                <div style="position: relative; width: 100%; aspect-ratio: 1/1; overflow: hidden; border-radius: 8px; background: #fafafa;">
                    <img src="${coverImage}" alt="${displayName}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                </div>
                <p style="margin: 10px 0 2px 0; font-weight: 500; font-size: 14.5px; color: #333; text-align: center;">${displayName}</p>
            </div>
        `;
    });
    
    container.innerHTML = allHtml; // 一次性寫入 DOM，速度最快
}

// 彈跳視窗邏輯
function openCatEyeModal(index) {
    const product = cateyeProductsData[index];
    if (!product) return;

    const row = getCompatibleRow(product);
    const displayName = row.name; 
    const paths = row.imagePath ? row.imagePath.split(',').map(p => p.trim()).filter(p => p !== "") : [];
    
    const modal = document.getElementById("modalOverlay");
    if (!modal) {
        console.error("找不到 id='modalOverlay' 的彈窗元件！");
        return;
    }

    document.getElementById("modalTitle").innerText = displayName;
    
    const priceEl = document.getElementById("modalPrice");
    if (priceEl) priceEl.style.display = "none";
    
    let additionalImagesHtml = '';
    if (paths.length > 1) {
        additionalImagesHtml += '<div style="margin-top: 15px; display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch;">';
        paths.forEach((path) => {
            const isVideo = path.toLowerCase().endsWith('.mp4');
            if (isVideo) {
                additionalImagesHtml += `
                    <div style="width: 60px; height: 60px; flex-shrink: 0; cursor: pointer; border: 1px solid #EADED7; border-radius: 4px; background: #222; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: bold;"
                         onclick="switchModalMedia('${path}')">▶ 影片</div>
                `;
            } else {
                additionalImagesHtml += `
                    <img src="${path}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #EADED7; flex-shrink: 0;" 
                         onclick="switchModalMedia('${path}')" loading="lazy">
                `;
            }
        });
        additionalImagesHtml += '</div>';
    }

    document.getElementById("modalDesc").innerHTML = `
        <p style="margin: 5px 0; color: #5D5451; font-size: 13px; text-align: center;">* 本款式均包含精緻前置基礎保養、真甲高防護建構加厚。</p>
        ${additionalImagesHtml ? `<p style="margin: 15px 0 5px 0; color: #5D5451; font-weight: bold; font-size: 14px;">更多角度 / 實拍細節：</p>${additionalImagesHtml}` : ''}
    `;

    if (paths.length > 0) {
        switchModalMedia(paths[0]);
    }
    
    modal.classList.add("active");
    modal.style.display = "flex"; 
}

// 核心安全切換
function switchModalMedia(url) {
    const mainMediaContainer = document.querySelector(".main-media-wrap");
    if (!mainMediaContainer) return;

    const isVideo = url.toLowerCase().endsWith('.mp4');
    
    if (isVideo) {
        mainMediaContainer.innerHTML = `
            <video src="${url}" controls autoplay muted style="width: 100%; height: 100%; background: #000; border-radius: 8px; object-fit: contain;"></video>
        `;
    } else {
        mainMediaContainer.innerHTML = `
            <img src="${url}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; cursor: zoom-in;" onclick="zoomImage(this.src)">
            <div id="zoom-hint" style="position: absolute; bottom: 10px; right: 10px; background: rgba(93, 84, 81, 0.75); color: #fff; padding: 4px 10px; font-size: 11px; border-radius: 20px; pointer-events: none; letter-spacing: 0.5px;">🔍 點擊大圖放大</div>
        `;
    }
}

// 關閉彈窗
function closeModal() {
    const modal = document.getElementById("modalOverlay");
    if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
    }
}

// 全螢幕大圖放大燈箱
function initLightbox() {
    if (document.getElementById("image-lightbox")) return;
    
    const lightbox = document.createElement("div");
    lightbox.id = "image-lightbox";
    lightbox.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); z-index: 99999;
        display: flex; justify-content: center; align-items: center;
        opacity: 0; pointer-events: none; transition: opacity 0.25s ease;
        cursor: zoom-out;
    `;
    lightbox.innerHTML = `
        <img id="lightbox-img" style="max-width: 95%; max-height: 95%; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 25px rgba(0,0,0,0.6);">
        <div style="position: absolute; top: 20px; right: 20px; color: #fff; font-size: 35px; font-weight: 100; pointer-events: none; line-height: 1;">&times;</div>
    `;
    
    lightbox.onclick = () => {
        lightbox.style.opacity = "0";
        lightbox.style.pointerEvents = "none";
    };
    
    document.body.appendChild(lightbox);
}

function zoomImage(src) {
    if (!src) return;
    const lightbox = document.getElementById("image-lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    if (lightbox && lightboxImg) {
        lightboxImg.src = src;
        lightbox.style.opacity = "1";
        lightbox.style.pointerEvents = "auto";
    }
}