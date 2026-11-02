
    // 2. Capture Button: Camera -> Result
    DOMElements.captureBtn?.addEventListener('click', captureAndAnalyze);

    // 3. Navigation Buttons
    DOMElements.retakeBtn?.addEventListener('click', () => {
        showSection(DOMElements.cameraSection);
        DOMElements.retakeBtn.classList.add('hidden');
        startCamera();
    });
    DOMElements.backToCamera?.addEventListener('click', () => {
        showSection(DOMElements.cameraSection);
    });
    
    // 4. Download Handlers
    DOMElements.downloadPdf?.addEventListener('click', () => handleDownload('/download/pdf', 'hasil_analisis.pdf'));
    DOMElements.downloadDocx?.addEventListener('click', () => handleDownload('/download/docx', 'hasil_analisis.docx'));
    
    // 5. History Handlers
    DOMElements.showHistoryBtn?.addEventListener('click', fetchHistory);
    DOMElements.clearHistoryBtn?.addEventListener('click', clearHistory);
    
    // --- INTEGRASI BLOK 2 (Pilihan Awal) ---
    // Logika pengalihan dari halaman choose.html (hanya berjalan jika elemennya ada)
    DOMElements.btnPersonalColor?.addEventListener('click', () => {
        window.location.href = 'camera_template.html?type=color';
    });
    DOMElements.btnUndertone?.addEventListener('click', () => {
        window.location.href = 'camera_template.html?type=undertone';

    });
    
    // (Optional) Jika Anda ingin mengaktifkan kamera saat halaman dimuat (jika tidak ada form)
    // if (!DOMElements.userForm) { startCamera(); }

// --- V. ASYNCHRONOUS API/DOWNLOAD FUNCTIONS ---

/**
 * Menangani logika pengunduhan file dari server.
 * @param {string} endpoint - URL endpoint untuk pengunduhan.
 * @param {string} filename - Nama file untuk disimpan.
 */
async function handleDownload(endpoint, filename) {
    if (!lastResult) return alert('Belum ada hasil.');
    
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lastResult)
        });
        
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url); // Clean up the object URL
    } catch (error) {
        alert(`Gagal mengunduh ${filename}: ${error.message}`);
    }
}

/**
 * Mengambil dan menampilkan riwayat analisis.
 */
async function fetchHistory() {
    try {
        const res = await fetch('/history');
        const arr = await res.json();
        
        DOMElements.historyList.innerHTML = '';
        showSection(DOMElements.historySection);
        
        if (!arr.length) {
            DOMElements.historyList.innerHTML = '<li>Tidak ada riwayat.</li>';
            return;
        }
        
        arr.forEach(item => {
            const li = document.createElement('li');
            const u = item.user || {};
            li.innerHTML = `<strong>${u.name || '-'} • ${item.season} (${item.undertone})</strong><br><small>${item.time}</small>`;
            DOMElements.historyList.appendChild(li);
        });
    } catch (err) {
        alert('Gagal memuat riwayat: ' + err.message);
    }
}

/**
 * Mengosongkan riwayat analisis di server.
 */
async function clearHistory() {
    try {
        await fetch('/clear_history', { method: 'POST' });
        DOMElements.historyList.innerHTML = '<li>Riwayat dikosongkan.</li>';
    } catch (error) {
        alert('Gagal menghapus riwayat.');
    }
}
let type = localStorage.getItem("selected_test");

let season = document.getElementById("resultSeason").textContent.trim();
let undertone = document.getElementById("resultUndertone").textContent.trim();

renderRecommendation(season, undertone);

 // Misal ini hasil dari analyze_image()
const undertoneResult = "Warm";    // atau Cool / Neutral
const seasonResult = "Spring";     // atau Summer / Autumn / Winter / Neutral

// Simpan di localStorage
localStorage.setItem("undertoneResult", undertoneResult);
localStorage.setItem("seasonResult", seasonResult);

// Simpan tipe analisis supaya kita tahu halaman mana yang dituju
localStorage.setItem("analysisType", "undertone"); // atau "season"
