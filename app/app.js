const DATASET_BASE = "../Synthetic%20Dataset%20Build/synthetic_dataset";
const OUTPUT_BASE = "../outputs";

const dataStatus = document.getElementById("dataStatus");
const patientSelect = document.getElementById("patientSelect");
const episodeSelect = document.getElementById("episodeSelect");
const patientSnapshot = document.getElementById("patientSnapshot");
const patientMetrics = document.getElementById("patientMetrics");
const patientMeds = document.getElementById("patientMeds");
const timelineList = document.getElementById("timelineList");
const episodeDive = document.getElementById("episodeDive");
const episodeRaw = document.getElementById("episodeRaw");
const nextStepsEl = document.getElementById("nextSteps");
const timelineHighlights = document.getElementById("timelineHighlights");

const locationOptions = document.getElementById("locationOptions");
const painOptions = document.getElementById("painOptions");
const symptomOptions = document.getElementById("symptomOptions");
const severityOptions = document.getElementById("severityOptions");
const durationOptions = document.getElementById("durationOptions");
const runSymptom = document.getElementById("runSymptom");
const symptomResults = document.getElementById("symptomResults");

const legalUpload = document.getElementById("legalUpload");
const legalUploadMeta = document.getElementById("legalUploadMeta");
const legalParse = document.getElementById("legalParse");

const medicalUpload = document.getElementById("medicalUpload");
const medicalUploadMeta = document.getElementById("medicalUploadMeta");
const medicalTranscript = document.getElementById("medicalTranscript");

const state = {
  patients: [],
  episodesMeta: [],
  outputs: [],
  outputById: {},
};

const rules = {
  chest: ["Cardiology", "Primary Care"],
  head: ["Neurology", "Primary Care"],
  stomach: ["Gastroenterology", "Primary Care"],
  back: ["Orthopedics", "Primary Care"],
  joints: ["Orthopedics", "Primary Care"],
  throat: ["ENT", "Primary Care"],
};

const renderList = (items) => {
  if (!items || items.length === 0) return "—";
  return items.map((item) => `• ${item}`).join("<br />");
};

const formatDate = (dateStr) => {
  if (!dateStr) return "Unknown date";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const loadData = async () => {
  try {
    dataStatus.textContent = "Loading data...";

    const [patientsRes, episodesRes, indexRes] = await Promise.all([
      fetch(`${DATASET_BASE}/metadata/patients.json`),
      fetch(`${DATASET_BASE}/metadata/episodes.json`),
      fetch(`${OUTPUT_BASE}/episodes/index.json`),
    ]);

    state.patients = await patientsRes.json();
    state.episodesMeta = await episodesRes.json();
    const indexData = await indexRes.json();

    const outputs = await Promise.all(
      indexData.episodes.map((file) => fetch(`${OUTPUT_BASE}/episodes/${file}`).then((res) => res.json()))
    );

    state.outputs = outputs;
    state.outputById = Object.fromEntries(outputs.map((ep) => [ep.episode_id, ep]));

    dataStatus.textContent = "Data Ready";
    hydratePatientSelect();
  } catch (err) {
    dataStatus.textContent = "Data load failed";
    console.error(err);
  }
};

const hydratePatientSelect = () => {
  patientSelect.innerHTML = state.patients
    .map((patient) => `<option value="${patient.patient_id}">${patient.patient_id}</option>`)
    .join("");

  if (state.patients.length) {
    renderPatient(state.patients[0].patient_id);
  }
};

const renderPatient = (patientId) => {
  const patient = state.patients.find((p) => p.patient_id === patientId);
  const episodesMeta = state.episodesMeta.filter((ep) => ep.patient_id === patientId);
  const outputs = episodesMeta.map((meta) => ({
    meta,
    output: state.outputById[meta.episode_id],
  })).filter((item) => item.output);

  const sorted = outputs.sort((a, b) => (a.meta.visit_date || "").localeCompare(b.meta.visit_date || ""));

  patientSnapshot.innerHTML = renderList([
    `Age range: ${patient?.age_range || "—"}`,
    `Language: ${patient?.language || "—"}`,
    `Caregiver involved: ${patient?.caregiver ? "Yes" : "No"}`,
    `Insurance plan: ${patient?.insurance_id || "—"}`,
  ]);

  const meds = new Set();
  outputs.forEach(({ output }) => {
    (output?.structured_extraction?.medications || []).forEach((m) => meds.add(m));
  });

  patientMetrics.innerHTML = renderList([
    `Episodes: ${outputs.length}`,
    `Unique medications: ${meds.size}`,
    `Latest visit: ${sorted[sorted.length - 1]?.meta.visit_date || "—"}`,
  ]);

  patientMeds.innerHTML = renderList(meds.size ? Array.from(meds) : ["No medications found"]);

  timelineList.innerHTML = sorted
    .map(({ meta, output }) => {
      const symptoms = output?.structured_extraction?.symptoms?.filter(Boolean).join(", ") || "—";
      return `
      <div class="timeline-item">
        <div><span class="tag">${formatDate(meta.visit_date)}</span> ${meta.specialty}</div>
        <div><strong>Symptoms:</strong> ${symptoms}</div>
        <div><strong>Provider:</strong> ${meta.provider_id}</div>
      </div>
    `;
    })
    .join("");

  episodeSelect.innerHTML = sorted
    .map(({ meta }) => `<option value="${meta.episode_id}">${meta.episode_id}</option>`)
    .join("");

  if (sorted.length) {
    renderEpisode(sorted[0].meta.episode_id);
  }

  renderSummarySection(sorted.map((item) => item.output));
};

const renderEpisode = (episodeId) => {
  const output = state.outputById[episodeId];
  if (!output) return;

  episodeDive.innerHTML = renderList([
    `Triage: ${output.triage?.triage_summary || "—"}`,
    `Specialties: ${(output.triage?.suggested_specialties || []).join(", ") || "—"}`,
    `Provider shortlist: ${(output.provider_matching?.providers || []).length}`,
    `Summary: ${output.summary?.plain_language_summary || "—"}`,
    `Consent doc: ${output.consent_review?.document_type || "—"}`,
    `Billing total: ${output.billing_reconciliation?.total_billed ?? "—"}`,
  ]);

  episodeRaw.textContent = JSON.stringify(output, null, 2);
};

const renderSummarySection = (outputs) => {
  const nextSteps = [];
  const highlights = [];

  outputs.forEach((output) => {
    (output.action_plan?.checklist || []).forEach((item) => nextSteps.push(item));
    const watch = output.action_plan?.watch_outs || [];
    if (watch.length) highlights.push(`Watch-outs: ${watch.join(", ")}`);
    if (output.structured_extraction?.follow_up) {
      highlights.push(`Follow-up: ${output.structured_extraction.follow_up}`);
    }
  });

  nextStepsEl.innerHTML = renderList(nextSteps.slice(0, 10));
  timelineHighlights.innerHTML = renderList(highlights.slice(0, 8));
};

patientSelect.addEventListener("change", (event) => renderPatient(event.target.value));
episodeSelect.addEventListener("change", (event) => renderEpisode(event.target.value));

// Symptom checker
const optionData = {
  locations: [
    { key: "head", label: "Head", desc: "Headache, dizziness" },
    { key: "chest", label: "Chest", desc: "Chest pain, breathing" },
    { key: "stomach", label: "Stomach", desc: "Nausea, cramps" },
    { key: "back", label: "Back", desc: "Upper or lower back" },
    { key: "joints", label: "Joints", desc: "Knee, shoulder" },
    { key: "throat", label: "Throat & Ears", desc: "Sore throat" },
  ],
  pains: [
    { key: "sharp", label: "Sharp", desc: "Stabbing, intense" },
    { key: "dull", label: "Dull Ache", desc: "Throbbing, heavy" },
    { key: "burning", label: "Burning", desc: "Hot, stinging" },
    { key: "cramping", label: "Cramping", desc: "Tight, spasms" },
  ],
  symptoms: [
    "Chest pain",
    "Shortness of breath",
    "Headache",
    "Nausea",
    "Fever",
    "Fatigue",
    "Dizziness",
    "Skin rash",
    "Joint pain",
    "Cough",
    "Sore throat",
    "Abdominal pain",
  ],
  severity: [
    { key: "mild", label: "Mild (1-3)", desc: "Noticeable" },
    { key: "moderate", label: "Moderate (4-6)", desc: "Affects daily activities" },
    { key: "severe", label: "Severe (7-10)", desc: "Hard to function" },
  ],
  duration: ["Today", "A few days", "About a week", "2+ weeks", "Ongoing"],
};

const symptomState = {
  location: null,
  pain: null,
  symptoms: new Set(),
  severity: null,
  duration: null,
};

const renderOptions = () => {
  locationOptions.innerHTML = optionData.locations
    .map(
      (item) => `
      <div class="option-card" data-key="${item.key}" data-group="location">
        <strong>${item.label}</strong>
        <span>${item.desc}</span>
      </div>
    `
    )
    .join("");

  painOptions.innerHTML = optionData.pains
    .map(
      (item) => `
      <div class="option-card" data-key="${item.key}" data-group="pain">
        <strong>${item.label}</strong>
        <span>${item.desc}</span>
      </div>
    `
    )
    .join("");

  symptomOptions.innerHTML = optionData.symptoms
    .map((item) => `<button type="button" class="pill" data-symptom="${item}">${item}</button>`)
    .join("");

  severityOptions.innerHTML = optionData.severity
    .map(
      (item) => `
      <div class="severity" data-key="${item.key}">
        <strong>${item.label}</strong>
        <div class="muted">${item.desc}</div>
      </div>
    `
    )
    .join("");

  durationOptions.innerHTML = optionData.duration
    .map((item) => `<button type="button" class="pill" data-duration="${item}">${item}</button>`)
    .join("");
};

const clearActive = (nodes) => nodes.forEach((node) => node.classList.remove("active"));

locationOptions.addEventListener("click", (event) => {
  const card = event.target.closest(".option-card");
  if (!card) return;
  clearActive(locationOptions.querySelectorAll(".option-card"));
  card.classList.add("active");
  symptomState.location = card.dataset.key;
});

painOptions.addEventListener("click", (event) => {
  const card = event.target.closest(".option-card");
  if (!card) return;
  clearActive(painOptions.querySelectorAll(".option-card"));
  card.classList.add("active");
  symptomState.pain = card.dataset.key;
});

symptomOptions.addEventListener("click", (event) => {
  const pill = event.target.closest(".pill");
  if (!pill) return;
  const label = pill.dataset.symptom;
  if (symptomState.symptoms.has(label)) {
    symptomState.symptoms.delete(label);
    pill.classList.remove("active");
  } else {
    symptomState.symptoms.add(label);
    pill.classList.add("active");
  }
});

severityOptions.addEventListener("click", (event) => {
  const card = event.target.closest(".severity");
  if (!card) return;
  clearActive(severityOptions.querySelectorAll(".severity"));
  card.classList.add("active");
  symptomState.severity = card.dataset.key;
});

durationOptions.addEventListener("click", (event) => {
  const pill = event.target.closest(".pill");
  if (!pill) return;
  clearActive(durationOptions.querySelectorAll(".pill"));
  pill.classList.add("active");
  symptomState.duration = pill.dataset.duration;
});

runSymptom.addEventListener("click", () => {
  const symptoms = Array.from(symptomState.symptoms);
  const location = symptomState.location;
  const severity = symptomState.severity || "unspecified";
  const duration = symptomState.duration || "unspecified";

  const specialties = location ? rules[location] || ["Primary Care"] : ["Primary Care"];
  const emergency = symptoms.includes("Chest pain") && severity === "severe";

  symptomResults.innerHTML = `
    <div class="card">
      <h3>Guidance</h3>
      <div class="stack">
        <div><strong>Summary:</strong> ${symptoms.join(", ") || "No symptoms selected"}</div>
        <div><strong>Severity:</strong> ${severity}</div>
        <div><strong>Duration:</strong> ${duration}</div>
        <div><strong>Suggested specialties:</strong> ${specialties.join(", ")}</div>
        ${emergency ? "<div class=\"tag\">Potential emergency — seek immediate care</div>" : ""}
      </div>
    </div>
  `;
});

// Legal document upload
legalUpload.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  legalUploadMeta.innerHTML = renderList([
    `File: ${file.name}`,
    `Size: ${(file.size / 1024).toFixed(1)} KB`,
    `Type: ${file.type || "Unknown"}`,
  ]);

  if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
    const text = await file.text();
    const clauses = [];
    if (/consent/i.test(text)) clauses.push("Consent clauses detected");
    if (/authorization/i.test(text)) clauses.push("Authorization language detected");
    if (/financial/i.test(text)) clauses.push("Financial responsibility mentioned");
    if (/hipaa|privacy/i.test(text)) clauses.push("Privacy/HIPAA language detected");

    legalParse.innerHTML = renderList([
      `Summary: ${text.slice(0, 240)}...`,
      `Flags: ${clauses.join(", ") || "No key clauses detected"}`,
      "Missing fields: signature, date (verify manually)",
    ]);
  } else {
    legalParse.innerHTML = renderList([
      "PDF or scanned document detected.",
      "OCR + clause extraction queued (simulated).",
      "Review recommended before signing.",
    ]);
  }
});

// Medical transcription upload
medicalUpload.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  medicalUploadMeta.innerHTML = renderList([
    `File: ${file.name}`,
    `Size: ${(file.size / 1024).toFixed(1)} KB`,
    `Type: ${file.type || "Unknown"}`,
  ]);

  if (file.type.startsWith("audio/")) {
    medicalTranscript.textContent = "Audio received. Transcription queued (simulated).";
  } else {
    const text = await file.text();
    medicalTranscript.textContent = text.slice(0, 1000);
  }
});

renderOptions();
loadData();
