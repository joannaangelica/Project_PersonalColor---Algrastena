const undertone = localStorage.getItem("undertone_result") || "Warm";
const season = localStorage.getItem("season_result") || "Spring";

document.getElementById("undertone-text").innerText = undertone;
document.getElementById("season-text").innerText = season;

const FOUNDATION_MAP = { "Warm":"Maybelline Fit Me 220", "Cool":"Maybelline Fit Me 115", "Neutral":"Maybelline Fit Me 128" };
const LIP_SHADES = { "Spring":"Peach Buff", "Summer":"Pink Sand", "Autumn":"Toasted Brown", "Winter":"Crimson Bold", "Neutral":"Nude Rose" };
const PALETTES = { "Spring":["Peach","Coral"], "Summer":["Soft Lilac","Dusty Rose"], "Autumn":["Terracotta","Olive Green"], "Winter":["Emerald","Burgundy"], "Neutral":["Classic Beige","Taupe"] };

document.getElementById("foundation-text").innerText = FOUNDATION_MAP[undertone] || "-";
document.getElementById("lip-text").innerText = LIP_SHADES[season] || "-";
document.getElementById("palette-text").innerText = PALETTES[season]?.join(", ") || "-";

document.getElementById("savePdfBtn").addEventListener("click", function () {
    const data = {
        title: "Your Personal Result",
        undertone: document.getElementById("undertoneValue").innerText,
        season: document.getElementById("seasonValue").innerText,
        recommendation: document.getElementById("recommendationValue").innerText
    };

    fetch("/download/pdf", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "glowfinder_result.pdf";
        a.click();
        URL.revokeObjectURL(url);
    });
});

function downloadPDF(){ alert("Download PDF dummy"); }
function downloadDOCX(){ alert("Download DOCX dummy"); }

if (mode === "undertone") {
    window.location.href = "/result_undertone";
} else {
    window.location.href = "/result_season";
}