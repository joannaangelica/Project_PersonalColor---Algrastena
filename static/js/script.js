/**
 * script.js
 * Single-page application flow: Form -> Camera -> Result -> History.
 * Handles camera access, non-mirrored capture, API communication, and UI rendering.
 */

// --- I. ELEMEN DOM & VARIABEL GLOBAL ---
const DOMElements = {
    // Sections
    formSection: document.getElementById('formSection'),
    cameraSection: document.getElementById('cameraSection'),
    resultSection: document.getElementById('resultSection'),
    historySection: document.getElementById('historySection'),

    // Inputs & Core
    userForm: document.getElementById('userForm'),
    video: document.getElementById('video'),
    canvas: document.getElementById('canvas'),
    
    // Buttons
    captureBtn: document.getElementById('captureBtn'),
    retakeBtn: document.getElementById('retakeBtn'),
    backToCamera: document.getElementById('backToCamera'),
    downloadPdf: document.getElementById('downloadPdf'),
    downloadDocx: document.getElementById('downloadDocx'),
    showHistoryBtn: document.getElementById('showHistory'),
    clearHistoryBtn: document.getElementById('clearHistory'),

    // Result Display
    resName: document.getElementById('resName'),
    resAge: document.getElementById('resAge'),
    timeText: document.getElementById('timeText'),
    undertoneText: document.getElementById('undertoneText'),
    seasonText: document.getElementById('seasonText'),
    foundationText: document.getElementById('foundationText'),
    lipList: document.getElementById('lipList'),
    paletteDiv: document.getElementById('palette'),
    historyList: document.getElementById('historyList'),

    // (Assuming these are on a previous page, but keeping them here for demonstration)
    btnPersonalColor: document.getElementById('btnPersonalColor'),
    btnUndertone: document.getElementById('btnUndertone'),
};

let userData = null;
let lastResult = null;
let currentStream = null; // Store camera stream for stopping later

// --- II. HELPER FUNCTIONS ---

/**
 * Tampilkan bagian (section) tertentu dengan efek transisi.
 * @param {HTMLElement} section - Bagian yang akan ditampilkan.
 */
function showSection(section) {
    const sections = [DOMElements.formSection, DOMElements.cameraSection, DOMElements.resultSection, DOMElements.historySection];
    sections.forEach(s => s?.classList.remove('active'));
    section?.classList.add('active');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Mengaktifkan kamera dan menampilkan preview.
 */
async function startCamera() {
    // Hentikan stream sebelumnya jika ada
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        DOMElements.video.srcObject = stream;
        currentStream = stream;
    } catch (err) {
        alert("Gagal akses kamera: " + err.message);
    }
}

/**
 * Menghentikan stream kamera.
 */
function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}



// --- III. LOGIKA ANALISIS & RENDERING HASIL ---

/**
 * Menggambar gambar dari video ke canvas (non-mirrored) dan mengirimkannya ke server.
 */
async function captureAndAnalyze() {
    if (!userData) return alert('Isi data dulu.');
    
    // 1. Setup Canvas
    DOMElements.canvas.width = DOMElements.video.videoWidth || 640;
    DOMElements.canvas.height = DOMElements.video.videoHeight || 480;
    const ctx = DOMElements.canvas.getContext('2d');

    // 2. Flip dan Draw (memastikan gambar yang disimpan tidak dicerminkan)
    ctx.save();
    ctx.translate(DOMElements.canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(DOMElements.video, 0, 0, DOMElements.canvas.width, DOMElements.canvas.height);
    ctx.restore();

    // 3. Konversi ke Blob dan Kirim Data
    DOMElements.canvas.toBlob(async (blob) => {
        const fd = new FormData();
        fd.append('image', blob, 'capture.jpg');
        fd.append('name', userData.name);
        fd.append('age', userData.age);
        fd.append('notes', userData.notes || '');

        try {
            const res = await fetch('/analyze', { method: 'POST', body: fd });
            const data = await res.json();
            
            if (data.error) return alert(data.error);
            
            lastResult = data;
            renderResult(data);
            stopCamera(); // Stop camera after successful capture
            showSection(DOMElements.resultSection);
        } catch (err) {
            alert('Gagal mengirim data atau memproses hasil: ' + err.message);
        }
    }, 'image/jpeg', 0.9);
}

/**
 * Menampilkan hasil analisis ke UI.
 * @param {object} data - Objek hasil analisis dari server.
 */
function renderResult(data) {
    const user = data.user || {};
    DOMElements.resName.textContent = user.name || '';
    DOMElements.resAge.textContent = user.age || '';
    DOMElements.timeText.textContent = data.time || '';
    DOMElements.undertoneText.textContent = data.undertone || '';
    DOMElements.seasonText.textContent = data.season || '';
    DOMElements.foundationText.textContent = data.foundation || '';

    // Lips
    DOMElements.lipList.innerHTML = '';
    const lips = data.lips || {};
    Object.keys(lips).forEach(brand => {
        const li = document.createElement('li');
        li.textContent = `${brand}: ${lips[brand]}`;
        DOMElements.lipList.appendChild(li);
    });

    // Color Palette
    DOMElements.paletteDiv.innerHTML = '';
    (data.colors || []).forEach((c, idx) => {
        const el = document.createElement('div');
        el.className = 'swatch';
        el.style.background = c.hex;
        
        // Text color contrast check
        const hex = (c.hex || '#000000').replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // Simple luminance calculation
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        el.style.color = lum > 180 ? '#111' : '#fff';

        const name = document.createElement('div'); name.className = 'name'; name.textContent = c.name;
        const hexEl = document.createElement('div'); hexEl.className = 'hex'; hexEl.textContent = c.hex;
        el.appendChild(name); el.appendChild(hexEl);

        // Staggered animation
        el.style.opacity = 0; el.style.transform = 'translateY(8px)';
        setTimeout(() => {
            el.style.transition = 'opacity .36s ease, transform .36s ease';
            el.style.opacity = 1; el.style.transform = 'translateY(0)';
        }, idx * 70);

        // Copy Hex functionality
        el.addEventListener('click', () => {
            navigator.clipboard?.writeText(c.hex);
            alert(`Hex copied: ${c.hex}`);
        });

        DOMElements.paletteDiv.appendChild(el);
    });
}

// --- IV. EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Form Submission: Form -> Camera
    DOMElements.userForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const age = document.getElementById('age').value.trim();
        const notes = document.getElementById('notes').value.trim();
        
        if (!name || !age) return alert('Isi nama & usia dulu.');
        
        userData = { name, age, notes };
        showSection(DOMElements.cameraSection);
        startCamera();
    })
});

let season = document.getElementById("resultSeason").textContent.trim();
let undertone = document.getElementById("resultUndertone").textContent.trim();

renderRecommendation(season, undertone);

// hasil analisis misalnya "Warm"
let detectedUndertone = "Warm";  

localStorage.setItem("undertoneResult", detectedUndertone);

// lalu redirect ke halaman hasil
window.location.href = "undertone-result.html";


