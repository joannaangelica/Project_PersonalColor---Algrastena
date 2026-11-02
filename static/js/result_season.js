const undertone = localStorage.getItem("undertone_result") || "Warm";
const season = localStorage.getItem("season_result") || "Spring";

document.getElementById("utValue").innerText = undertone;
document.getElementById("snValue").innerText = season;

document.getElementById("foundation-text").innerText = "Maybelline Fit Me 220 / OMG W2 / G2G 205";
document.getElementById("lip-text").innerText = "BNB Rusty Glow, G2G Mapple Kiss, Maybelline Toasted Brown";
document.getElementById("dateText").innerText = new Date().toLocaleString();

const PALETTE = {
    "Spring":["#DE7B38","#E98A6E","#F6C48F"],
    "Summer":["#C9849C","#BFC8E6","#DBAFC1"],
    "Autumn":["#A85A32","#C97A3A","#D49B6A"],
    "Winter":["#1A3A75","#64002A","#891C50"]
};

const paletteBox = document.getElementById("seasonPalette");
PALETTE[season].forEach(color=>{
    const div = document.createElement("div");
    div.className="color-item";
    div.innerHTML=`<div class="circle" style="background:${color}"></div>${color}`;
    paletteBox.appendChild(div);
});

if (mode === "undertone") {
    window.location.href = "/result_undertone";
} else {
    window.location.href = "/result_season";
}
