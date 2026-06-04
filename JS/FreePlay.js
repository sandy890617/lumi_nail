// =========================================================================
// 📢 【未來修改區 1】變數與 API 設定
// =========================================================================
let singleColorProductsData = []; 

// 1. 這裡換成妳新部署的 Google 試算表後端 API 網址
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyQwvZrB0ObX5CSvQ_bNDGy6u04Gdp0tThqdKcZMnxt-ASEKOSjAozFv2WLft3AWJXe/exec?action=getFreePlay"; 

// 2. 快取 Key 的名字
const CACHE_KEY = "FreePlay_color_products_cache_v1"; 

// 1. ⚡ 網頁一載入立即執行
document.addEventListener('DOMContentLoaded', () => {
    initLightbox(); 
    
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (cachedData) {
        try {
            singleColorProductsData = JSON.parse(cachedData);
            renderSingleColorProducts(singleColorProductsData);
        } catch (e) {
            showSingleColorSkeleton(); 
        }
    } else {
        showSingleColorSkeleton(); 
    }
    
    fetchSingleColorData(!!cachedData);
    
    // 超時防呆
    setTimeout(() => {
        const container = document.getElementById("product-container");
        if (container && (!singleColorProductsData || singleColorProductsData.length === 0) && container.innerHTML.includes("pulse")) {
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
 * ⚡ 單色專屬骨架屏
 */
function showSingleColorSkeleton() {
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

    if (!document.getElementById('skeleton-style')) {
        const style = document.createElement('style');
        style.id = 'skeleton-style';
        style.innerHTML = `@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`;
        document.head.appendChild(style);
    }
}

// 撈取 Google 試算表資料
async function fetchSingleColorData(isBackground = false) {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        const isDataChanged = JSON.stringify(data) !== JSON.stringify(singleColorProductsData);
        
        if (isDataChanged || !isBackground) {
            singleColorProductsData = data;
            localStorage.setItem(CACHE_KEY, JSON.stringify(data)); 
            renderSingleColorProducts(singleColorProductsData);
            console.log("🔄 自由發揮資料已同步最新狀態！");
        }
        
    } catch (error) {
        console.error("資料撈取失敗:", error);
        const container = document.getElementById("product-container");
        if (container && (!singleColorProductsData || singleColorProductsData.length === 0)) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: red;">資料庫連線失敗，請檢查 API 設定。</div>`;
        }
    }
}

// =========================================================================
// 📢 【未來修改區 2】模糊欄位比對 (試算表表頭對應)
// =========================================================================
function getCompatibleRow(product) {
    const keys = Object.keys(product).map(k => k.trim());
    const cleanProduct = {};
    Object.keys(product).forEach(k => {
        cleanProduct[k.trim()] = product[k];
    });

    const nameKey = keys.find(k => k.includes('名字') || k.includes('姓名') || k.toLowerCase().includes('name')) || '';
    const pathKey = keys.find(k => k.includes('圖片') || k.includes('路徑') || k.toLowerCase().includes('path') || k.toLowerCase().includes('image')) || '';
    const materialKey = keys.find(k => k.includes('材料') || k.toLowerCase().includes('material')) || '';
    const priceKey = keys.find(k => k.includes('原價') || k.includes('價格') || k.toLowerCase().includes('price')) || '';

    let finalName = nameKey && cleanProduct[nameKey] ? String(cleanProduct[nameKey]).trim() : '';
    if (!finalName || finalName === 'undefined') {
        finalName = '未填名稱';
    }

    return {
        name: finalName,
        imagePath: pathKey && cleanProduct[pathKey] ? String(cleanProduct[pathKey]).trim() : '',
        material: materialKey && cleanProduct[materialKey] ? String(cleanProduct[materialKey]).trim() : '',
        price: priceKey && cleanProduct[priceKey] ? String(cleanProduct[priceKey]).trim() : '0'
    };
}

// ⚡ 渲染主畫面網格
function renderSingleColorProducts(products) {
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
        
        allHtml += `
            <div class="color-item" onclick="openSingleColorModal(${index})" style="cursor: pointer;">
                <div style="position: relative; width: 100%; aspect-ratio: 1/1; overflow: hidden; border-radius: 8px; background: #fafafa;">
                    <img src="${coverImage}" alt="${displayName}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
                </div>
                <p style="margin: 10px 0 2px 0; font-weight: 500; font-size: 14.5px; color: #333; text-align: center;">${displayName}</p>
            </div>
        `;
    });
    
    container.innerHTML = allHtml; 
}

// 彈跳視窗邏輯
function openSingleColorModal(index) {
    const product = singleColorProductsData[index];
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
    
    // 📢 【1. 圖片區塊】產生多圖縮圖 HTML
    let additionalImagesHtml = '';
    if (paths.length > 1) {
        additionalImagesHtml += '<div style="margin-top: 5px; display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch;">';
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

    // 📢 【2. 價格區塊】產生原價提醒卡片 HTML
    const priceTipHtml = `
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #EADED7; text-align: center;">
            <p style="margin: 0; color: #8c7e74; font-size: 13.5px; font-weight: bold; letter-spacing: 0.5px;">
                ✨ 若挑選此款式，此款價格為 <span style="font-size: 16px; color: #5D5451;">${row.price}</span> 元
            </p>
        </div>
    `;

    // 📢 【3. 材料區塊】處理材料段落 HTML
    let descHtml = '';
    if (row.material) {
        descHtml = `<p style="margin: 12px 0 5px 0; color: #5D5451; font-size: 14px; text-align: center; font-weight: 500;">使用材料：${row.material}</p>`;
    } else {
        descHtml = `<p style="margin: 12px 0 5px 0; color: #5D5451; font-size: 13px; text-align: center;">* 本款式均包含精緻前置基礎保養、真甲高防護建構加厚。</p>`;
    }

    // 📢 【最終組合】嚴格按照：圖片 ➔ 價格 ➔ 材料 的順序渲染
    document.getElementById("modalDesc").innerHTML = `
        ${additionalImagesHtml ? `<p style="margin: 5px 0 5px 0; color: #5D5451; font-weight: bold; font-size: 14px;">更多角度 / 實拍細節：</p>${additionalImagesHtml}` : ''}
        ${priceTipHtml}
        ${descHtml}
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