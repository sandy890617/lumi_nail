document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 功能一：手機版漢堡選單控制 (點擊三條線)
    // ==========================================
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenu.classList.toggle('is-active'); // 觸發三條線變 X 的動畫
        });

        // 點擊選單內的連結後，自動收起選單
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenu.classList.remove('is-active');
            });
        });
    }

    // ==========================================
    // 功能二：大張 Hero 跑馬燈 (紅框處)
    // ==========================================
    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroDots = document.querySelectorAll('.dot');
    const heroNext = document.querySelector('.hero-next');
    const heroPrev = document.querySelector('.hero-prev');
    
    if (heroSlides.length > 0) {
        let currentHeroIndex = 0;
        const heroIntervalTime = 3000; // 大圖每 5 秒換一張

        const showHeroSlide = (index) => {
            heroSlides.forEach(s => s.classList.remove('active'));
            heroDots.forEach(d => d.classList.remove('active'));
            
            currentHeroIndex = (index + heroSlides.length) % heroSlides.length;
            heroSlides[currentHeroIndex].classList.add('active');
            if (heroDots[currentHeroIndex]) {
                heroDots[currentHeroIndex].classList.add('active');
            }
        };

        // 自動播放大圖
        let heroAutoTimer = setInterval(() => showHeroSlide(currentHeroIndex + 1), heroIntervalTime);

        // 重設自動播放 (當手動點擊後重新計時)
        const resetHeroTimer = () => {
            clearInterval(heroAutoTimer);
            heroAutoTimer = setInterval(() => showHeroSlide(currentHeroIndex + 1), heroIntervalTime);
        };

        if (heroNext) {
            heroNext.addEventListener('click', () => {
                showHeroSlide(currentHeroIndex + 1);
                resetHeroTimer();
            });
        }

        if (heroPrev) {
            heroPrev.addEventListener('click', () => {
                showHeroSlide(currentHeroIndex - 1);
                resetHeroTimer();
            });
        }

        // 圓點點擊
        heroDots.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                showHeroSlide(idx);
                resetHeroTimer();
            });
        });
    }

    // ==========================================
    // 功能三：下方作品集小輪播 (原本的功能)
    // ==========================================
    const carousel = document.querySelector('.carousel');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');

    if (carousel && prevBtn && nextBtn) {
        const carouselIntervalTime = 3000; 

        const getScrollAmount = () => {
            const firstImg = carousel.querySelector('img');
            return firstImg ? firstImg.clientWidth + 20 : 270; 
        };

        prevBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
            resetCarouselAuto();
        });

        nextBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            resetCarouselAuto();
        });

        const startCarouselAuto = () => {
            return setInterval(() => {
                const amount = getScrollAmount();
                if (carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth - 5) {
                    carousel.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    carousel.scrollBy({ left: amount, behavior: 'smooth' });
                }
            }, carouselIntervalTime);
        };

        let carouselTimer = startCarouselAuto();

        function resetCarouselAuto() {
            clearInterval(carouselTimer);
            carouselTimer = startCarouselAuto();
        }
    }
});