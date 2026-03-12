// ===============================
// SpeakSure AI - Selection Page JS
// File: First_Page/script.js
// ===============================

let selectedInterviewType = null;
let selectedExperience = null;
let selectedIndustry = null;

document.addEventListener("DOMContentLoaded", function () {

    // ---------- ELEMENTS ----------
    const cards = document.querySelectorAll(".card");
    const continueBtn = document.getElementById("continueBtn");
    const errorMessage = document.getElementById("errorMessage");

    // These selectors assume your HTML layout exactly matches:
    // .filters -> two .filter-group blocks (1st = Experience, 2nd = Industry)
    const experienceButtons = document.querySelectorAll(".filters .filter-group:nth-child(1) .filter-btn");
    const industryButtons = document.querySelectorAll(".filters .filter-group:nth-child(2) .filter-btn");

    // ---------- INITIAL STATE ----------
    if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.classList.add("disabled");
    }
    if (errorMessage) errorMessage.textContent = "";


    // ---------- CARD SELECTION ----------
    cards.forEach(card => {
        card.addEventListener("click", function () {

            // UI highlight
            cards.forEach(c => c.classList.remove("selected", "active"));
            this.classList.add("selected");

            // Save selection
            selectedInterviewType = this.getAttribute("data-type");

            // Enable continue
            if (continueBtn) {
                continueBtn.disabled = false;
                continueBtn.classList.remove("disabled");
            }

            // Clear error
            if (errorMessage) errorMessage.textContent = "";
        });
    });


    // ---------- EXPERIENCE FILTER ----------
    experienceButtons.forEach(btn => {
        btn.addEventListener("click", function () {

            experienceButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");

            selectedExperience = this.textContent.trim();

            if (errorMessage) errorMessage.textContent = "";
        });
    });


    // ---------- INDUSTRY FILTER ----------
    industryButtons.forEach(btn => {
        btn.addEventListener("click", function () {

            industryButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");

            selectedIndustry = this.textContent.trim();

            if (errorMessage) errorMessage.textContent = "";
        });
    });


    // ---------- CONTINUE ----------
    if (continueBtn) {
        continueBtn.addEventListener("click", function () {

            if (!selectedInterviewType) {
                if (errorMessage) errorMessage.textContent =
                    "Please select an interview type before continuing.";
                return;
            }

            // Defaults if user doesn't choose filters
            const experience = selectedExperience || "Fresher";
            const industry = selectedIndustry || "IT";

            // Save for next pages
            localStorage.setItem("interviewType", selectedInterviewType);
            localStorage.setItem("experienceLevel", experience);
            localStorage.setItem("industry", industry);

            // Redirect logic:
            // If Technical, go to technical.html (your 2nd page)
            // Else, go directly to interview.html (3rd page)
            const isTechnical = selectedInterviewType === "Technical Interview";

            document.body.style.opacity = "0.6";

            setTimeout(() => {
                window.location.href = isTechnical
                    ? "../Second_page/technical.html"
                    : "../Third_Page/interview.html";
            }, 250);
        });
    }

});