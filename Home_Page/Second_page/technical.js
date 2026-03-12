localStorage.setItem("interviewType", "Technical Interview");
// Select domain
document.querySelectorAll(".domain-card").forEach(card => {
    card.addEventListener("click", function () {
        document.querySelectorAll(".domain-card").forEach(c => c.classList.remove("selected"));
        this.classList.add("selected");
    });
});

// Toggle mode selection
document.querySelectorAll(".mode").forEach(mode => {
    mode.addEventListener("click", function () {
        this.classList.toggle("selected");
    });
});

// Start Button
document.querySelector(".start-btn").addEventListener("click", function () {

    const domainElement = document.querySelector(".domain-card.selected");
    const levelElement = document.querySelector("input[name='level']:checked");

    if (!domainElement || !levelElement) {
        alert("Please select domain and difficulty level before continuing.");
        return;
    }

    let selectedDomain = domainElement.innerText;
    let selectedLevel = levelElement.parentElement.innerText;

    let selectedModes = [];
    document.querySelectorAll(".mode.selected").forEach(mode => {
        selectedModes.push(mode.innerText);
    });

    localStorage.setItem("domain", selectedDomain);
    localStorage.setItem("level", selectedLevel);
    localStorage.setItem("modes", JSON.stringify(selectedModes));

    window.location.href = "../Third_Page/interview.html";
});