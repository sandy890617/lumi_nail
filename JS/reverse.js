document.addEventListener('DOMContentLoaded', function() {
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

    // --- 2. 大類顯示/隱藏監聽 ---
    const toggleMainService = () => {
        if(nailArea) nailArea.style.display = mainNail.checked ? 'block' : 'none';
        if(facialArea) facialArea.style.display = mainFacial.checked ? 'block' : 'none';
        if(otherArea) otherArea.style.display = mainOther.checked ? 'block' : 'none';
        calculateTotal();
    };

    [mainNail, mainFacial, mainOther].forEach(item => {
        if(item) item.addEventListener('change', toggleMainService);
    });

    // --- 3. 美甲部位切換 ---
    if(nailPart) {
        nailPart.addEventListener('change', function() {
            const val = this.value;
            if(handGroup) handGroup.style.display = (val === 'hand' || val === 'both') ? 'block' : 'none';
            if(footGroup) footGroup.style.display = (val === 'foot' || val === 'both') ? 'block' : 'none';
            calculateTotal();
        });
    }

    // --- 4. 美甲連動解鎖邏輯 ---
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
            
            if (!isSelected) {
                removeEl.value = "0";
                if(careEl) careEl.checked = false;
            }
            calculateTotal();
        });
    }
    setupNailLinkage('handStyle', 'handRemove', 'handCare', 'handCareLabel');
    setupNailLinkage('footStyle', 'footRemove', 'footCare', 'footCareLabel');

    // --- 5. 核心總金額計算 ---
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
            const facialChecks = document.querySelectorAll('input[name="facial"]:checked');
            facialChecks.forEach(item => { total += parseInt(item.value) || 0; });
        }
        if (mainOther && mainOther.checked) {
            total += parseInt(document.getElementById('otherType')?.value) || 0;
        }
        const priceEl = document.getElementById('totalPrice');
        if(priceEl) priceEl.innerText = total.toLocaleString();
        return total;
    }

    // --- 6. 預約日期與時段邏輯 ---
    const mockDatabase = {
        "2026-05-13": ["18:30"],
        "2026-05-20": ["18:30"],
        "2026-05-21": ["18:30"],
        "2026-05-22": ["18:30"],
        "2026-05-25": ["18:30"],
        "2026-05-27": ["18:30"],
        "2026-05-29": ["18:30"]
    };

    if (appointmentDateInput) {
        flatpickr(appointmentDateInput, {
            dateFormat: "Y-m-d",
            enable: [
                function(date) {
                    const d = date.getFullYear() + "-" + 
                              ("0" + (date.getMonth() + 1)).slice(-2) + "-" + 
                              ("0" + date.getDate()).slice(-2);
                    return mockDatabase[d] && mockDatabase[d].length > 0;
                }
            ],
            onChange: function(selectedDates, dateStr) {
                if(!container) return;
                container.innerHTML = '<p class="loading-text">讀取中...</p>';
                setTimeout(() => {
                    renderSlots(dateStr);
                }, 300);
            }
        });
    }

    function renderSlots(date) {
        if(!container) return;
        container.innerHTML = '';
        const availableSlots = mockDatabase[date] || [];
        if (availableSlots.length === 0) {
            container.innerHTML = '<p class="hint-text">該日期目前無可預約時段</p>';
            return;
        }
        availableSlots.forEach(time => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'time-btn';
            btn.innerText = time;
            if (time === "18:30") btn.classList.add('special-slot'); 
            btn.onclick = () => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if(hiddenInput) hiddenInput.value = time;
            };
            container.appendChild(btn);
        });
    }

    // --- 7. 表單送出 (改為 LINE 通知) ---
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // A. 抓取基本資訊
            const name = document.getElementById('custName').value;
            const phone = document.getElementById('custPhone').value;
            const date = appointmentDateInput.value;
            const time = hiddenInput.value;
            const totalPrice = calculateTotal();

            // B. 抓取詳細服務清單
            let selectedServices = [];
            
            // 美甲部分細化
            if(mainNail.checked) {
                const nailDetail = nailPart.value;
                const partText = nailDetail === 'hand' ? '手部' : (nailDetail === 'foot' ? '腳部' : '手腳同時');
                let nailMsg = `美甲(${partText})`;
                
                // 抓取手部款式
                if(nailDetail === 'hand' || nailDetail === 'both') {
                    const hStyle = document.getElementById('handStyle');
                    const hRemove = document.getElementById('handRemove');
                    const hCare = document.getElementById('handCare');
                    if(hStyle.value !== "0") {
                        nailMsg += `\n   - 手部款式：${hStyle.options[hStyle.selectedIndex].text}`;
                        if(hRemove.value !== "0") nailMsg += `\n   - 手部卸甲：${hRemove.options[hRemove.selectedIndex].text}`;
                        if(hCare.checked) nailMsg += `\n   - 手部加購：深層保養`;
                    }
                }
                // 抓取腳部款式
                if(nailDetail === 'foot' || nailDetail === 'both') {
                    const fStyle = document.getElementById('footStyle');
                    const fRemove = document.getElementById('footRemove');
                    const fCare = document.getElementById('footCare');
                    if(fStyle.value !== "0") {
                        nailMsg += `\n   - 腳部款式：${fStyle.options[fStyle.selectedIndex].text}`;
                        if(fRemove.value !== "0") nailMsg += `\n   - 腳部卸甲：${fRemove.options[fRemove.selectedIndex].text}`;
                        if(fCare.checked) nailMsg += `\n   - 腳部加購：深層保養`;
                    }
                }
                selectedServices.push(nailMsg);
            }
            
            // 臉部部分
            const facials = document.querySelectorAll('input[name="facial"]:checked');
            facials.forEach(item => {
                selectedServices.push(item.getAttribute('data-name'));
            });

            // 其他部分
            if(mainOther.checked) {
                const otherSelect = document.getElementById('otherType');
                if(otherSelect.value !== "0") {
                    selectedServices.push(otherSelect.options[otherSelect.selectedIndex].text);
                }
            }

            // 驗證
            if (selectedServices.length === 0) {
                alert("請至少選擇一項預約服務喔！");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            if(!name || !phone || !date || !time) {
                alert("請填寫姓名、電話並選擇預約日期與時間喔！");
                return;
            }

            // C. 組合 Line 訊息文字
            const serviceString = selectedServices.join('\n');
            const message = `✨ 嚕咪美學 線上預約申請 ✨
──────────────────
👤 姓名：${name}
📞 電話：${phone}
📅 時間：${date} ${time}
💰 預估金額：$${totalPrice}

📋 預約項目：
${serviceString}
──────────────────
(請發送此訊息，我們將手動為您登錄預約回覆！)`;

            // D. 執行跳轉 (請更換為你的官方帳號 ID)
            const lineID = "@629hpzgp"; // 👈 請修改成你的 LINE 官方帳號 ID
            const lineUrl = 'https://lin.ee/TAU26bs';

            // 跳轉
            window.location.href = lineUrl;
        });
    }

    // --- 8. 事件監聽初始化 ---
    document.querySelectorAll('.nail-calc-trigger, #otherType').forEach(item => {
        item.addEventListener('change', calculateTotal);
    });
    document.querySelectorAll('input[name="facial"]').forEach(item => {
        item.addEventListener('change', calculateTotal);
    });
});