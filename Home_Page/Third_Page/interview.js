// =============================
// SPEAKSURE AI - INTERVIEW.JS
// Updated with type/speak mode + answer evaluation
// =============================

// -------- GLOBAL VARIABLES --------
let voiceSamples = [];
let emotionSamples = [];
let answeredQuestions = 0;

let totalWords = 0;
let fillerCount = 0;

let recognition;
let speechRecognitionEnabled = false;
let audioContext;
let analyser;
let microphone;
let dataArray;
let webcamStream;

let totalTime = 300;
let timerInterval;

let currentQ = 0;
let questions = [];
let totalQuestions = 0;

let silenceSeconds = 0;
let lastSpeechTime = Date.now();
let silenceIntervalId = null;

let interviewResults = [];
let currentTranscript = "";

// ---------------------------------
// QUESTION BANK
// ---------------------------------
const QUESTION_BANK = {
  "Technical Interview": {
    IT: [
      { h: "Explain OOP.", p: "Give 4 pillars + one real example." },
      { h: "What is REST API?", p: "Explain methods + status codes." },
      { h: "What is normalization?", p: "Explain 1NF, 2NF, 3NF." },
      { h: "Stack vs Queue?", p: "Explain difference + use cases." },
      { h: "Binary search time complexity?", p: "Explain why O(log n)." }
    ],
    Engineering: [
      { h: "What is cache memory?", p: "Explain L1/L2/L3 and benefits." },
      { h: "Explain pipelining.", p: "How it increases CPU throughput." },
      { h: "What is an interrupt?", p: "Hardware vs software interrupt." },
      { h: "RAM vs ROM?", p: "Volatile vs non-volatile + use case." },
      { h: "What is paging?", p: "Explain virtual memory basics." }
    ]
  },
  "HR Interview": {
    IT: [
      { h: "Tell me about yourself.", p: "Keep it 60 seconds and role-focused." },
      { h: "Your strengths and weakness?", p: "Give examples + improvement plan." },
      { h: "Why should we hire you?", p: "Give 3 strong reasons." },
      { h: "Where do you see yourself in 3 years?", p: "Show learning + growth." },
      { h: "How do you handle stress?", p: "Explain with a real situation." }
    ],
    General: [
      { h: "Introduce yourself.", p: "Education + skills + goal." },
      { h: "Why this company?", p: "Give 2 points + research proof." },
      { h: "Teamwork experience?", p: "Explain role + result." },
      { h: "Biggest challenge you faced?", p: "Explain problem + solution." },
      { h: "Are you open to shifts/relocation?", p: "Answer confidently." }
    ]
  }
};

document.addEventListener("DOMContentLoaded", function () {
  localStorage.removeItem("interviewResults");

  setupAnswerModeUI();
  startWebcam();
  startMicrophone();
  startConfidenceChart();
  startTimer();
  startSilenceTracking();

  loadFaceAPI()
    .then(startEmotionDetection)
    .catch(err => console.log("Face API load skipped:", err));

  const type = localStorage.getItem("interviewType") || "Technical Interview";
  const industry = localStorage.getItem("industry") || "IT";

  questions = getFallbackQuestions(type, industry);
  totalQuestions = questions.length || 5;

  renderQuestion();
  generateAIQuestion().catch(() => {});

  const toggleCameraBtn = document.getElementById("toggleCamera");
  if (toggleCameraBtn) {
    toggleCameraBtn.addEventListener("click", function () {
      if (!webcamStream) return;
      const tracks = webcamStream.getTracks();
      tracks.forEach(track => (track.enabled = !track.enabled));
      this.textContent = tracks[0].enabled ? "Turn Camera Off" : "Turn Camera On";
    });
  }

  const toggleMicBtn = document.getElementById("toggleMic");
  if (toggleMicBtn) {
    toggleMicBtn.addEventListener("click", function () {
      if (!microphone) return;
      const audioTrack = microphone.mediaStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      this.textContent = audioTrack.enabled ? "Mute Mic" : "Unmute Mic";
    });
  }

  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) {
    nextBtn.addEventListener("click", async function () {
      await saveAndEvaluateCurrentAnswer();

      answeredQuestions = Math.min(answeredQuestions + 1, totalQuestions);

      if (currentQ < totalQuestions - 1) {
        currentQ++;
        clearAnswerUI();
        renderQuestion();
        await generateAIQuestion().catch(() => {});
      } else {
        finishInterview();
      }
    });
  }

  const stopBtn = document.querySelector(".stop-btn");
  if (stopBtn) {
    stopBtn.addEventListener("click", async function () {
      await saveAndEvaluateCurrentAnswer();
      finishInterview();
    });
  }
});

function setupAnswerModeUI() {
  const answerInput = document.getElementById("answerInput");
  const speechControls = document.getElementById("speechControls");
  const speechPreview = document.getElementById("speechPreview");
  const startSpeechBtn = document.getElementById("startSpeechBtn");
  const stopSpeechBtn = document.getElementById("stopSpeechBtn");
  const answerModes = document.querySelectorAll('input[name="answerMode"]');

  answerModes.forEach(mode => {
    mode.addEventListener("change", () => {
      const selectedMode = document.querySelector('input[name="answerMode"]:checked')?.value || "type";

      if (selectedMode === "type") {
        answerInput.style.display = "block";
        speechControls.style.display = "none";
        stopRecognition();
      } else {
        answerInput.style.display = "none";
        speechControls.style.display = "block";
        speechPreview.textContent = currentTranscript;
        initSpeechRecognition();
      }
    });
  });

  if (startSpeechBtn) {
    startSpeechBtn.addEventListener("click", () => {
      initSpeechRecognition();
      try {
        recognition.start();
      } catch {}
    });
  }

  if (stopSpeechBtn) {
    stopSpeechBtn.addEventListener("click", () => {
      stopRecognition();
    });
  }
}

function getFallbackQuestions(type, industry) {
  const byType = QUESTION_BANK[type] || QUESTION_BANK["Technical Interview"];
  const byIndustry = byType[industry] || byType["IT"] || byType["General"] || [];
  return byIndustry.slice(0, 5);
}

function renderQuestion() {
  if (!questions.length) return;

  const q = questions[currentQ];
  const headingEl = document.getElementById("questionHeading");
  const textEl = document.getElementById("questionText");
  const titleEl = document.getElementById("interviewTitle");

  if (titleEl) {
    titleEl.textContent = `Question ${currentQ + 1} of ${totalQuestions} - ${localStorage.getItem("interviewType") || "Interview"}`;
  }
  if (headingEl) headingEl.textContent = q.h || "";
  if (textEl) textEl.textContent = q.p || "";

  speakQuestion(q.h || "");
}

async function generateAIQuestion() {
  const type = localStorage.getItem("interviewType") || "Technical Interview";
  const experience = localStorage.getItem("experienceLevel") || "Fresher";
  const industry = localStorage.getItem("industry") || "IT";

  const response = await fetch("http://localhost:5000/generate-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, experience, industry })
  });

  const data = await response.json();
  if (!response.ok || !data?.question) throw new Error(data?.detail || "AI failed");

  setQuestionUI(data.question, "");
  questions[currentQ] = { h: data.question, p: "" };
  speakQuestion(data.question);
}

function setQuestionUI(heading, text) {
  const h = document.getElementById("questionHeading");
  const p = document.getElementById("questionText");
  if (h) h.textContent = heading || "";
  if (p) p.textContent = text || "";
}

function speakQuestion(text) {
  if (!text) return;
  const speech = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}

async function saveAndEvaluateCurrentAnswer() {
  const answerInput = document.getElementById("answerInput");
  const currentQuestion = questions[currentQ]?.h || "";
  const currentHint = questions[currentQ]?.p || "";
  const answer = (answerInput?.value || "").trim();

  if (!currentQuestion || !answer) return;

  const interviewType = localStorage.getItem("interviewType") || "Technical Interview";

  try {
    const response = await fetch("http://localhost:5000/evaluate-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: `${currentQuestion} ${currentHint}`.trim(),
        answer,
        interviewType
      })
    });

    const data = await response.json();
    console.log("Evaluate response:", data);

    if (!response.ok) {
      throw new Error(data?.detail || data?.error || "Evaluation request failed");
    }

    interviewResults.push({
      question: currentQuestion,
      hint: currentHint,
      answer,
      rating: data?.rating || "Partially Correct",
      score: Number(data?.score ?? 5),
      feedback: data?.feedback || "No feedback available.",
      expected_answer: data?.expected_answer || "N/A"
    });
  } catch (err) {
    console.error("Frontend evaluate-answer error:", err);

    interviewResults.push({
      question: currentQuestion,
      hint: currentHint,
      answer,
      rating: "Partially Correct",
      score: 5,
      feedback: err?.message || "Could not evaluate answer from server.",
      expected_answer: "N/A"
    });
  }

  localStorage.setItem("interviewResults", JSON.stringify(interviewResults));
}

function clearAnswerUI() {
  const answerInput = document.getElementById("answerInput");
  const speechPreview = document.getElementById("speechPreview");

  if (answerInput) answerInput.value = "";
  if (speechPreview) speechPreview.textContent = "";

  currentTranscript = "";
  stopRecognition();
}

async function startWebcam() {
  const video = document.getElementById("webcam");
  if (!video) return;

  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = webcamStream;
  } catch (error) {
    console.log("Webcam Error:", error);
  }
}

async function startMicrophone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);

    analyser.fftSize = 256;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    detectVolume();
  } catch (err) {
    console.log("Microphone Error:", err);
  }
}

function detectVolume() {
  if (!analyser || !dataArray) return;

  analyser.getByteFrequencyData(dataArray);

  let values = 0;
  for (let i = 0; i < dataArray.length; i++) values += dataArray[i];

  const average = values / dataArray.length;
  const volumeLevel = average / 255;

  voiceSamples.push(volumeLevel);

  const volumeFill = document.getElementById("volumeFill");
  if (volumeFill) volumeFill.style.width = (volumeLevel * 100) + "%";

  requestAnimationFrame(detectVolume);
}

function initSpeechRecognition() {
  if (speechRecognitionEnabled) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.log("Speech Recognition not supported");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = function (event) {
    lastSpeechTime = Date.now();

    let finalTranscript = "";
    let interimTranscript = "";

    for (let i = 0; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalTranscript += transcript + " ";
      else interimTranscript += transcript;
    }

    currentTranscript = (finalTranscript + interimTranscript).trim();

    const speechPreview = document.getElementById("speechPreview");
    const answerInput = document.getElementById("answerInput");

    if (speechPreview) speechPreview.textContent = currentTranscript;
    if (answerInput) answerInput.value = currentTranscript;

    const words = currentTranscript.trim() ? currentTranscript.trim().split(/\s+/) : [];
    totalWords = words.length;

    const fillers = ["um", "uh", "like", "you know"];
    fillerCount = 0;
    words.forEach(w => {
      if (fillers.includes(w.toLowerCase())) fillerCount++;
    });
  };

  recognition.onend = () => {};

  speechRecognitionEnabled = true;
}

function stopRecognition() {
  if (recognition) {
    try {
      recognition.stop();
    } catch {}
  }
}

function startSilenceTracking() {
  if (silenceIntervalId) clearInterval(silenceIntervalId);

  silenceIntervalId = setInterval(() => {
    const diff = Date.now() - lastSpeechTime;
    silenceSeconds = diff > 5000 ? Math.floor((diff - 5000) / 1000) : 0;
  }, 1000);
}

async function loadFaceAPI() {
  if (!window.faceapi) return;
  await faceapi.nets.tinyFaceDetector.loadFromUri("./models/tiny_face_detector");
  await faceapi.nets.faceExpressionNet.loadFromUri("./models/face_expression");
}

function calculateEmotionConfidence(expressions) {
  let score = 0;
  score += expressions.happy * 100;
  score += expressions.neutral * 80;
  score += expressions.surprised * 75;
  score -= expressions.sad * 20;
  score -= expressions.angry * 40;
  score -= expressions.fearful * 30;
  score -= expressions.disgusted * 50;
  return Math.max(0, Math.min(100, score));
}

async function startEmotionDetection() {
  const video = document.getElementById("webcam");
  const emotionText = document.getElementById("emotionText");
  if (!video || !window.faceapi) return;

  setInterval(async () => {
    try {
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections && detections.expressions) {
        const emotionScore = calculateEmotionConfidence(detections.expressions);
        emotionSamples.push(emotionScore / 100);

        if (emotionText) {
          const expressions = detections.expressions;
          const maxEmotion = Object.keys(expressions).reduce((a, b) =>
            expressions[a] > expressions[b] ? a : b
          );
          emotionText.textContent = maxEmotion;
        }
      }
    } catch {}
  }, 2000);
}

function startConfidenceChart() {
  const canvas = document.getElementById("confidenceChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Confidence Level",
        data: [],
        fill: false,
        tension: 0.3
      }]
    },
    options: { responsive: true, animation: false }
  });

  setInterval(() => {
    const latestVoice = voiceSamples.length > 0
      ? voiceSamples[voiceSamples.length - 1] * 100
      : 50;

    if (chart.data.labels.length > 20) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }

    chart.data.labels.push("");
    chart.data.datasets[0].data.push(latestVoice);
    chart.update();
  }, 2000);
}

function startTimer() {
  const timerDisplay = document.getElementById("timer");
  if (!timerDisplay) return;

  timerInterval = setInterval(() => {
    const minutes = Math.floor(totalTime / 60);
    let seconds = totalTime % 60;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    timerDisplay.textContent = "Time Left: " + minutes + ":" + seconds;
    totalTime--;

    if (totalTime < 0) {
      clearInterval(timerInterval);
      finishInterview();
    }
  }, 1000);
}

function finishInterview() {
  calculateFinalAIScore();

  localStorage.setItem("totalWords", String(totalWords));
  localStorage.setItem("fillerWords", String(fillerCount));
  localStorage.setItem("interviewResults", JSON.stringify(interviewResults));

  window.location.href = "../Final_page/report.html";
}

function calculateFinalAIScore() {
  let avgVoice = 0;
  if (voiceSamples.length > 0) {
    avgVoice = voiceSamples.reduce((a, b) => a + b, 0) / voiceSamples.length;
  }
  const voiceScore = Math.min(avgVoice * 100, 100);

  let speechScore = 70;
  if (totalWords > 0) {
    const fillerRatio = fillerCount / totalWords;
    speechScore = Math.max(100 - (fillerRatio * 100), 50);
  }

  let emotionScore = 60;
  if (emotionSamples.length > 0) {
    emotionScore = (emotionSamples.reduce((a, b) => a + b, 0) / emotionSamples.length) * 100;
  }

  const tq = totalQuestions || 5;
  const aq = Math.max(answeredQuestions, currentQ + 1);
  const technicalScore = Math.min(100, (aq / tq) * 100);

  const durationMinutes = (300 - totalTime) / 60;
  const wpm = totalWords / (durationMinutes || 1);
  const wpmScore = Math.min(100, (wpm / 150) * 100);

  const silencePenalty = Math.min(30, silenceSeconds * 2);

  let finalScore =
    (voiceScore * 0.20) +
    (speechScore * 0.20) +
    (emotionScore * 0.15) +
    (technicalScore * 0.15) +
    (wpmScore * 0.10);

  if (interviewResults.length > 0) {
    const avgAnswerScore =
      interviewResults.reduce((sum, item) => sum + Number(item.score || 0), 0) / interviewResults.length;
    finalScore += avgAnswerScore * 4;
  }

  finalScore -= silencePenalty;
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

  localStorage.setItem("finalConfidence", String(finalScore));
  localStorage.setItem("voiceScore", String(Math.round(voiceScore)));
  localStorage.setItem("speechScore", String(Math.round(speechScore)));
  localStorage.setItem("emotionScore", String(Math.round(emotionScore)));
  localStorage.setItem("technicalScore", String(Math.round(technicalScore)));

  let feedbackMessage = "";
  if (finalScore >= 85) feedbackMessage = "Excellent Confidence & Communication!";
  else if (finalScore >= 70) feedbackMessage = "Good performance. Minor improvements needed.";
  else if (finalScore >= 50) feedbackMessage = "Average confidence. Practice more mock interviews.";
  else feedbackMessage = "Low confidence detected. Focus on speaking clarity and body language.";

  localStorage.setItem("aiFeedback", feedbackMessage);
}