document.addEventListener("DOMContentLoaded", function () {
    const finalScoreElement = document.getElementById("finalScore");
    const scoreFill = document.getElementById("scoreFill");

    const storedConfidence = localStorage.getItem("finalConfidence");
    const score = Number.parseInt(storedConfidence, 10) || 0;

    if (finalScoreElement) finalScoreElement.textContent = score + "%";
    if (scoreFill) scoreFill.style.width = score + "%";

    const words = Number.parseInt(localStorage.getItem("totalWords"), 10) || 0;
    const fillers = Number.parseInt(localStorage.getItem("fillerWords"), 10) || 0;

    const speechStats = document.getElementById("speechStats");
    if (speechStats) {
        speechStats.textContent =
            (words > 0)
                ? `Total Words: ${words} | Filler Words: ${fillers}`
                : "Speech data not available.";
    }

    const voiceScore = Number.parseInt(localStorage.getItem("voiceScore"), 10) || 0;
    const emotionScore = Number.parseInt(localStorage.getItem("emotionScore"), 10) || 0;
    const technicalScore = Number.parseInt(localStorage.getItem("technicalScore"), 10) || 0;

    const emotionResult = document.getElementById("emotionResult");
    const voiceResult = document.getElementById("voiceResult");
    const techResult = document.getElementById("techResult");

    if (emotionResult) {
        emotionResult.textContent =
            (emotionScore >= 80) ? "Very Stable & Confident"
            : (emotionScore >= 60) ? "Mostly Neutral & Calm"
            : "Nervous Expressions Detected";
    }

    if (voiceResult) {
        voiceResult.textContent =
            (voiceScore >= 75) ? "Strong & Clear Voice"
            : (voiceScore >= 60) ? "Average Voice Confidence"
            : "Voice Needs More Confidence";
    }

    if (techResult) {
        techResult.textContent =
            (technicalScore >= 80) ? "Excellent Structured Answers"
            : (technicalScore >= 60) ? "Good Explanation Clarity"
            : "Work on Answer Structure & Clarity";
    }

    renderDetailedResults();
    generateAISummary();
});

function renderDetailedResults() {
    const results = JSON.parse(localStorage.getItem("interviewResults")) || [];
    const summary = document.getElementById("answerSummary");
    const container = document.getElementById("detailedResults");

    if (!results.length) {
        if (summary) summary.textContent = "No evaluated answers found.";
        if (container) container.innerHTML = "";
        return;
    }

    let totalScore = 0;
    let correct = 0;
    let partial = 0;
    let incorrect = 0;

    let html = "";

    results.forEach((item, index) => {
        totalScore += Number(item.score || 0);

        if (item.rating === "Correct") correct++;
        else if (item.rating === "Partially Correct") partial++;
        else incorrect++;

        html += `
            <div class="card" style="margin-top:20px; text-align:left;">
                <h3>Question ${index + 1}</h3>
                <p><b>Question:</b> ${escapeHtml(item.question || "")}</p>
                <p><b>Your Answer:</b> ${escapeHtml(item.answer || "")}</p>
                <p><b>Result:</b> ${escapeHtml(item.rating || "")}</p>
                <p><b>Score:</b> ${escapeHtml(String(item.score || 0))}/10</p>
                <p><b>Feedback:</b> ${escapeHtml(item.feedback || "")}</p>
                <p><b>Expected Answer:</b> ${escapeHtml(item.expected_answer || "")}</p>
            </div>
        `;
    });

    const avg = (totalScore / results.length).toFixed(1);

    if (summary) {
        summary.textContent =
            `Total Questions: ${results.length} | Average Answer Score: ${avg}/10 | Correct: ${correct} | Partially Correct: ${partial} | Incorrect: ${incorrect}`;
    }

    if (container) {
        container.innerHTML = html;
    }
}

function restartInterview() {
    localStorage.removeItem("interviewType");
    localStorage.removeItem("experienceLevel");
    localStorage.removeItem("industry");
    localStorage.removeItem("domain");
    localStorage.removeItem("level");
    localStorage.removeItem("modes");
    localStorage.removeItem("finalConfidence");
    localStorage.removeItem("totalWords");
    localStorage.removeItem("fillerWords");
    localStorage.removeItem("voiceScore");
    localStorage.removeItem("emotionScore");
    localStorage.removeItem("speechScore");
    localStorage.removeItem("technicalScore");
    localStorage.removeItem("aiFeedback");
    localStorage.removeItem("interviewResults");

    window.location.href = "../First_Page/index.html";
}

function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
function generateAISummary() {
    const aiSummary = document.getElementById("aiSummary");

    const finalScore = Number.parseInt(localStorage.getItem("finalConfidence"), 10) || 0;
    const voiceScore = Number.parseInt(localStorage.getItem("voiceScore"), 10) || 0;
    const emotionScore = Number.parseInt(localStorage.getItem("emotionScore"), 10) || 0;
    const technicalScore = Number.parseInt(localStorage.getItem("technicalScore"), 10) || 0;
    const speechScore = Number.parseInt(localStorage.getItem("speechScore"), 10) || 0;

    const results = JSON.parse(localStorage.getItem("interviewResults")) || [];

    let avgAnswerScore = 0;
    if (results.length > 0) {
        avgAnswerScore = results.reduce((sum, item) => sum + Number(item.score || 0), 0) / results.length;
    }

    let summary = "";

    if (finalScore >= 85) {
        summary += "You performed very well overall with strong confidence and good interview presence. ";
    } else if (finalScore >= 70) {
        summary += "You gave a good interview performance with decent confidence and communication. ";
    } else if (finalScore >= 50) {
        summary += "Your interview performance was average and needs more practice for better delivery. ";
    } else {
        summary += "Your interview performance needs improvement, especially in confidence and communication. ";
    }

    if (voiceScore >= 75) {
        summary += "Your voice was clear and strong. ";
    } else if (voiceScore >= 60) {
        summary += "Your voice was understandable, but could be more confident. ";
    } else {
        summary += "You should work on speaking louder and more confidently. ";
    }

    if (emotionScore >= 75) {
        summary += "Your facial expressions looked stable and confident. ";
    } else if (emotionScore >= 60) {
        summary += "Your expressions were mostly calm, but slight nervousness was visible. ";
    } else {
        summary += "You appeared nervous, so improving body language will help. ";
    }

    if (avgAnswerScore >= 8) {
        summary += "Your answers were mostly accurate and well structured. ";
    } else if (avgAnswerScore >= 6) {
        summary += "Your answers were partially correct, but need more depth and clarity. ";
    } else {
        summary += "Your answers need better structure, relevance, and technical accuracy. ";
    }

    if (speechScore >= 75) {
        summary += "You maintained good speaking flow with fewer filler words.";
    } else {
        summary += "Try reducing filler words and speak in a more structured way.";
    }

    aiSummary.textContent = summary;
}