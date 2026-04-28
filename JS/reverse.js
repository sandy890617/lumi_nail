document.addEventListener('DOMContentLoaded', function() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxOWkXCDQFjubt83mbdqF8LdIXWBXsWbXaoGybY6GUPqW0aXFImCty4WNZS3N2zebRy/exec';
    
    let sheetData = []; 
    let fp; 
    let availableDatesMap = {}; 

    // --- 1. 元素抓取 ---
    const bookingForm = document.getElementById('bookingForm');
    const mainNail = document.getElementById('mainNail');
    const mainFacial = document.getElementById('mainFacial');
    const mainOther = document.getElementById('mainOther');
    const nailArea = document.getElementById('nailDetailArea');
    const facialArea = document.getElementById('facialDetailArea');
    const otherArea = document.getElementById('otherDetailArea');
    const nailPart = document.getElementById('nailPart');
    const handGroup = document.getElementById('handDetailGroup');
    const footGroup = document.getElementById('footDetailGroup');
    const container = document.getElementById('timeSlotsContainer');
    const hiddenInput = document.getElementById('selectedTime');
    const appointmentDateInput = document.getElementById('appointmentDate');

    // --- 2. 核心啟動邏輯 (感知提速版) ---
    async function startBookingSystem() {
        // A. 立即初始化日曆（此時全部日期不可選，防止鍵盤跳出）
        if (!fp) {
            initCalendar();
        } else {
            // 如果是重新整理（送單後），先鎖住
            fp.set('enable', [() => false]);
        }

        if (appointmentDateInput) {
            appointmentDateInput.placeholder = "⌛ 時段載入中...";
            appointmentDateInput.readOnly = true; 
        }

        try {
            // B. 非同步抓取資料
            const response = await fetch(scriptURL);
            sheetData = await response.json();
            
            // C. 快速建立索引地圖
            availableDatesMap = {}; 
            sheetData.forEach(row => {
                // 根據你最新的 Excel 欄位：C 欄是姓名 (index 2)
                if (!row.name || row.name.toString().trim() === "") {
                    let d = new Date(row.date);
                    let dStr = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
                    availableDatesMap[dStr] = true; 
                }
            });

            // D. 資料到齊，解鎖日曆
            if (appointmentDateInput) {
                appointmentDateInput.placeholder = "請選擇日期";
                fp.set('enable', [
                    function(date) {
                        let dStr = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
                        return availableDatesMap[dStr] === true;
                    }
                ]);
            }
            console.log("資料同步完成，日曆已解鎖");
        } catch (e) {
            console.error("預載失敗", e);
            if (appointmentDateInput) appointmentDateInput.placeholder = "載入失敗，請重整";
        }
    }

    // --- 3. 日曆初始化 ---
    function initCalendar() {
        if (!appointmentDateInput) return;
        fp = flatpickr(appointmentDateInput, {
            dateFormat: "Y-m-d",
            minDate: "today",
            disableMobile: "true",
            enable: [() => false], // 初始時全部禁止，等待資料
            onChange: function(selectedDates, dateStr) {
                renderSlots(dateStr);
            }
        });
    }

    // --- 4. 時段渲染 ---
    function renderSlots(selectedDate) {
        if (!container) return;
        container.innerHTML = ''; 
        if (hiddenInput) hiddenInput.value = '';

        const availableSlots = sheetData.filter(row => {
            let d = new Date(row.date);
            let excelDate = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
            const isAvailable = (!row.name || row.name.toString().trim() === "");
            return excelDate === selectedDate && isAvailable;
        });

        if (availableSlots.length === 0) {
            container.innerHTML = '<p class="hint-text">該日期目前無開放或已約滿</p>';
            return;
        }

        // 使用 DocumentFragment 提升渲染效能
        const fragment = document.createDocumentFragment();
        availableSlots.forEach(slot => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'time-btn';
            
            let displayTime = slot.time;
            if (slot.time instanceof Date || !isNaN(Date.parse(slot.time))) {
                let t = new Date(slot.time);
                if (!isNaN(t.getTime())) {
                    displayTime = ("0" + t.getHours()).slice(-2) + ":" + ("0" + t.getMinutes()).slice(-2);
                }
            }
            btn.innerText = displayTime;
            btn.onclick = () => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (hiddenInput) hiddenInput.value = displayTime;
            };
            fragment.appendChild(btn);
        });
        container.appendChild(fragment);
    }

    // --- 5. 服務顯示/隱藏監聽 ---
    const toggleMainService = () => {
        if(nailArea) nailArea.style.display = mainNail.checked ? 'block' : 'none';
        if(facialArea) facialArea.style.display = mainFacial.checked ? 'block' : 'none';
        if(otherArea) otherArea.style.display = mainOther.checked ? 'block' : 'none';
        calculateTotal();
    };

    [mainNail, mainFacial, mainOther].forEach(item => {
        if(item) item.addEventListener('change', toggleMainService);
    });

    // --- 6. 美甲部位切換 ---
    if(nailPart) {
        nailPart.addEventListener('change', function() {
            const val = this.value;
            if(handGroup) handGroup.style.display = (val === 'hand' || val === 'both') ? 'block' : 'none';
            if(footGroup) footGroup.style.display = (val === 'foot' || val === 'both') ? 'block' : 'none';
            calculateTotal();
        });
    }

    // --- 7. 美甲連動邏輯 ---
    function setupNailLinkage(styleId, removeId, careId, labelId) {
        const styleEl = document.getElementById(styleId);
        const removeEl = document.getElementById(removeId);
        const careEl = document.getElementById(careId);
        const labelEl = document.getElementById(labelId);
        if(!styleEl || !removeEl) return;
        styleEl.addEventListener('change', function() {
            const isSelected = this.value !== "0";
            removeEl.disabled = !isSelected;
            removeEl.style.opacity = isSelected ? "1" : "0.6";
            if(careEl) careEl.disabled = !isSelected;
            if(labelEl) labelEl.style.opacity = isSelected ? "1" : "0.5";
            if (!isSelected) { removeEl.value = "0"; if(careEl) careEl.checked = false; }
            calculateTotal();
        });
    }
    setupNailLinkage('handStyle', 'handRemove', 'handCare', 'handCareLabel');
    setupNailLinkage('footStyle', 'footRemove', 'footCare', 'footCareLabel');

    // --- 8. 核心總金額計算 ---
    function calculateTotal() {
        let total = 0;
        if (mainNail && mainNail.checked) {
            const val = nailPart.value;
            if (val === 'hand' || val === 'both') {
                total += parseInt(document.getElementById('handStyle')?.value) || 0;
                total += parseInt(document.getElementById('handRemove')?.value) || 0;
                if (document.getElementById('handCare')?.checked) total += 500;
            }
            if (val === 'foot' || val === 'both') {
                total += parseInt(document.getElementById('footStyle')?.value) || 0;
                total += parseInt(document.getElementById('footRemove')?.value) || 0;
                if (document.getElementById('footCare')?.checked) total += 500;
            }
        }
        if (mainFacial && mainFacial.checked) {
            document.querySelectorAll('input[name="facial"]:checked').forEach(item => {
                total += parseInt(item.value) || 0;
            });
        }
        if (mainOther && mainOther.checked) {
            total += parseInt(document.getElementById('otherType')?.value) || 0;
        }
        const priceEl = document.getElementById('totalPrice');
        if(priceEl) priceEl.innerText = total.toLocaleString();
        return total;
    }

    // --- 9. 表單送出 ---
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('custName').value;
            const linename = document.getElementById('custLineName').value;
            const phone = document.getElementById('custPhone').value;
            const date = appointmentDateInput.value;
            const time = hiddenInput.value;
            
            let selectedServices = [];
            if(mainNail.checked) {
                const partText = nailPart.value === 'hand' ? '手' : (nailPart.value === 'foot' ? '腳' : '手腳');
                selectedServices.push(`美甲(${partText})`);
            }
            document.querySelectorAll('input[name="facial"]:checked').forEach(item => {
                selectedServices.push("臉部:" + item.getAttribute('data-name'));
            });
            if(mainOther.checked) {
                const oSelect = document.getElementById('otherType');
                if(oSelect && oSelect.value !== "0") selectedServices.push("加購:" + oSelect.options[oSelect.selectedIndex].text);
            }

            if (selectedServices.length === 0 || !name || !linename || !phone || !date || !time) {
                alert("請填寫姓名、Line名稱、電話、預約日期並選擇項目！");
                return;
            }

            const bookingData = { 
                name: name, 
                line: linename, 
                phone: phone, 
                date: date, 
                time: time, 
                totalPrice: calculateTotal(), 
                services: selectedServices.join(' | ') 
            };

            const submitBtn = bookingForm.querySelector('.submit-btn');
            
            try {
                submitBtn.innerText = "預約傳送中...";
                submitBtn.disabled = true;

                const response = await fetch(scriptURL, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(bookingData)
                });
                const result = await response.json();

                if (result.result === "success") {
                    alert('✨ 預約成功！');
                    bookingForm.reset();
                    [nailArea, facialArea, otherArea].forEach(a => a.style.display = 'none');
                    if (container) container.innerHTML = '';
                    startBookingSystem(); // 異步刷新
                } else if (result.result === "not_found") {
                    alert('❌ 該時段剛才已被搶先預約，請選擇其他時段');
                } else {
                    alert('發生錯誤：' + result.error);
                }
            } catch (error) {
                console.error(error);
                alert('連線失敗，但若您收到信件即代表預約成功，否則請稍後再試');
            } finally {
                submitBtn.innerText = "送出預約";
                submitBtn.disabled = false;
            }
        });
    }

    // 事件監聽
    document.querySelectorAll('.nail-calc-trigger, #otherType, input[name="facial"]').forEach(item => {
        item.addEventListener('change', calculateTotal);
    });

    // 啟動系統
    startBookingSystem();
});
