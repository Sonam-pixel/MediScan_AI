// Save token locally
function saveToken() {
  const token = document.getElementById("hfToken").value;
  if (token) {
    localStorage.setItem("hfToken", token);
    alert("Token saved locally!");
  }
}

// Retrieve token when needed
function getToken() {
  return localStorage.getItem("hfToken");
}

const fileInput = document.getElementById("fileInput");
const ocrBtn = document.getElementById("ocrBtn");
const sampleBtn = document.getElementById("sampleBtn");
const extractedText = document.getElementById("extractedText");
const summarizeBtn = document.getElementById("summarizeBtn");
const askBtn = document.getElementById("askBtn");
const hfToken = document.getElementById("hfToken");
const userQuestion = document.getElementById("userQuestion");
const results = document.getElementById("results");

let extracted = "";

// OCR Extraction
ocrBtn.addEventListener("click", () => {
  if (!fileInput.files[0]) {
    alert("Please select an image file first!");
    return;
  }

  Tesseract.recognize(fileInput.files[0], "eng")
    .then(({ data: { text } }) => {
      extracted = text;
      extractedText.value = text;
    })
    .catch(err => {
      console.error(err);
      alert("Error reading image!");
    });
});

// Paste Sample Text
sampleBtn.addEventListener("click", () => {
  extracted = `Blood Sugar (Fasting): 145 mg/dL
Hemoglobin: 11.2 g/dL
Cholesterol: 230 mg/dL`;
  extractedText.value = extracted;
});

// Summarize Report
summarizeBtn.addEventListener("click", async () => {
  const text = extractedText.value.trim();
  if (!text) return alert("No text to summarize!");

  const token = hfToken.value.trim();
  if (!token) return alert("Enter Hugging Face token!");

  results.innerHTML = "<p>⏳ Summarizing...</p>";

  try {
    const res = await fetch("https://api-inference.huggingface.co/models/facebook/bart-large-cnn", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: text })
    });
    const data = await res.json();
    const summary = data[0]?.summary_text || "Could not summarize";

    results.innerHTML = `<h3>Summary:</h3><p>${summary}</p>`;
    highlightRisks(text);
  } catch (e) {
    console.error(e);
    results.innerHTML = "<p>⚠️ Failed to summarize.</p>";
  }
});

// Ask Question
askBtn.addEventListener("click", async () => {
  const context = extractedText.value.trim();
  const question = userQuestion.value.trim();
  if (!context || !question) return alert("Need text + question!");

  const token = hfToken.value.trim();
  if (!token) return alert("Enter Hugging Face token!");

  results.innerHTML = "<p>⏳ Thinking...</p>";

  try {
    const res = await fetch("https://api-inference.huggingface.co/models/deepset/roberta-base-squad2", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: { question, context } })
    });
    const data = await res.json();
    results.innerHTML = `<h3>Answer:</h3><p>${data.answer || "Not sure"}</p>`;
  } catch (e) {
    console.error(e);
    results.innerHTML = "<p>⚠️ Failed to answer.</p>";
  }
});

// Highlight Risks
function highlightRisks(text) {
  let risks = [];
  if (/blood sugar.*\d+/i.test(text) && parseInt(text.match(/blood sugar.*?(\d+)/i)[1]) > 125)
    risks.push("High Blood Sugar – risk of diabetes");
  if (/cholesterol.*\d+/i.test(text) && parseInt(text.match(/cholesterol.*?(\d+)/i)[1]) > 200)
    risks.push("High Cholesterol – heart risk");
  if (/hemoglobin.*\d+(\.\d+)?/i.test(text) && parseFloat(text.match(/hemoglobin.*?(\d+(\.\d+)?)/i)[1]) < 12)
    risks.push("Low Hemoglobin – possible anemia");

  if (risks.length) {
    results.innerHTML += `<h3>⚠️ Risks Detected:</h3><ul>${risks.map(r => `<li>${r}</li>`).join("")}</ul>`;
    results.innerHTML += `<h3>💡 Suggestions:</h3><p>Maintain healthy diet, exercise regularly, and consult a doctor if needed.</p>`;
  }
}

// --- Save Token Locally ---
const saveTokenBtn = document.getElementById("saveTokenBtn");

saveTokenBtn.addEventListener("click", () => {
  const token = hfToken.value.trim();
  if (!token) return alert("Enter a token first!");
  localStorage.setItem("hfToken", token);
  alert("✅ Token saved locally!");
});

// --- Load token when page loads ---
window.addEventListener("load", () => {
  const saved = localStorage.getItem("hfToken");
  if (saved) hfToken.value = saved;
});

