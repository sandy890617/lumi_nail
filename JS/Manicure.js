// --- 1. 把全域函數放在最上面，確保 HTML onclick 抓得到 ---
function openTab(evt, tabId) {
    const contents = document.querySelectorAll(".tab-content");
    contents.forEach(content => content.classList.remove("active"));
    
    const buttons = document.querySelectorAll(".tab-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    
    const activeContent = document.getElementById(tabId);
    if (activeContent) activeContent.classList.add("active");
    evt.currentTarget.classList.add("active");

    const normalGallery = document.querySelector(".color-gallery-container:not(#biting-knowledge-container)");
    const bitingKnowledge = document.getElementById("biting-knowledge-container");

    if (tabId === 'nail-biting') {
        if (normalGallery) normalGallery.style.display = "none";
        if (bitingKnowledge) bitingKnowledge.style.display = "block";
    } else {
        if (normalGallery) normalGallery.style.display = "block";
        if (bitingKnowledge) bitingKnowledge.style.display = "none";
    }
}

function switchGallery(evt, tabId) {
    const contents = document.querySelectorAll(".gallery-content");
    contents.forEach(content => {
        content.classList.remove("active");
        content.style.display = "none"; 
    });
    const buttons = document.querySelectorAll(".gallery-tab-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    
    const targetContent = document.getElementById(tabId);
    if (targetContent) {
        targetContent.classList.add("active");
        targetContent.style.display = "block";
    }
    evt.currentTarget.classList.add("active");
}

// --- 2. DOMContentLoaded 處理 Modal 和事件委託 ---
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById('previewModal');
    const modalImg = document.getElementById('modalImg');
    const modalText = document.getElementById('modalText');
    const counter = document.getElementById('imageCounter');
    const thumbList = document.getElementById('thumbList');
    
    let currentImgArray = []; 
    let currentIndex = 0;      

    // 改用「事件委託」：直接監聽整個 body，判斷點擊的是不是作品卡
    document.body.addEventListener('click', function(e) {
        const item = e.target.closest('.color-item');
        if (!item) return; // 如果點的不是作品卡，就結束

        const imagesStr = item.getAttribute('data-images');
        if (imagesStr) {
            currentImgArray = imagesStr.split(',').map(s => s.trim());
        } else {
            currentImgArray = [item.querySelector('img').src];
        }
        
        currentIndex = 0; 
        modalText.innerText = item.querySelector('p').innerText;
        
        renderThumbnails(); 
        updateModal();      
        
        modal.style.display = "flex";
        document.body.style.overflow = "hidden"; 
    });

    function renderThumbnails() {
        thumbList.innerHTML = ''; 
        currentImgArray.forEach((src, index) => {
            let mediaElement;
            const isVideo = src.toLowerCase().endsWith('.mp4');
            if (isVideo) {
                mediaElement = document.createElement('video');
                mediaElement.src = src + "#t=0.1"; 
                mediaElement.classList.add('thumb-item', 'thumb-video');
            } else {
                mediaElement = document.createElement('img');
                mediaElement.src = src;
                mediaElement.classList.add('thumb-item');
            }
            mediaElement.onclick = (e) => {
                e.stopPropagation(); 
                currentIndex = index;
                updateModal();
            };
            thumbList.appendChild(mediaElement);
        });
    }

    function updateModal() {
        const src = currentImgArray[currentIndex];
        const isVideo = src.toLowerCase().endsWith('.mp4');
        let videoPlayer = modal.querySelector('.modal-video');
        
        if (!videoPlayer) {
            videoPlayer = document.createElement('video');
            videoPlayer.className = 'modal-video';
            videoPlayer.controls = true;
            videoPlayer.style.width = '100%';
            videoPlayer.style.maxHeight = '70vh';
            modalImg.parentNode.insertBefore(videoPlayer, modalImg);
        }

        if (isVideo) {
            modalImg.style.display = 'none';
            videoPlayer.style.display = 'block';
            videoPlayer.src = src;
            videoPlayer.play();
        } else {
            modalImg.style.display = 'block';
            modalImg.src = src;
            videoPlayer.style.display = 'none';
            videoPlayer.pause();
        }
        
        counter.innerText = `${currentIndex + 1} / ${currentImgArray.length}`;
        const thumbs = thumbList.querySelectorAll('.thumb-item');
        thumbs.forEach((t, idx) => {
            idx === currentIndex ? t.classList.add('active') : t.classList.remove('active');
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('close-btn')) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
            const videoPlayer = modal.querySelector('.modal-video');
            if (videoPlayer) videoPlayer.pause();
        }
    });
});