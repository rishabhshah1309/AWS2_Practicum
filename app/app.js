const summaryPath = "../outputs/summary.json";
const indexPath = "../outputs/episodes/index.json";

const totalEpisodesEl = document.getElementById("totalEpisodes");
const pipelineStatusEl = document.getElementById("pipelineStatus");
const refreshButton = document.getElementById("refresh");
const episodeSelect = document.getElementById("episodeSelect");
const searchInput = document.getElementById("search");
const episodeMeta = document.getElementById("episodeMeta");

const triageEl = document.getElementById("triage");
const providersEl = document.getElementById("providers");
const summaryEl = document.getElementById("summary");
const extractionEl = document.getElementById("extraction");
const consentEl = document.getElementById("consent");
const billingEl = document.getElementById("billing");
const actionPlanEl = document.getElementById("actionPlan");
const rawJsonEl = document.getElementById("rawJson");

let episodes = [];
let currentEpisode = null;

const formatList = (items) => {
  if (!items || items.length === 0) return "—";
  return items.map((item) => `• ${item}`).join("\n");
};

const buildTags = (items) => {
  if (!items || items.length === 0) return "—";
  return items.map((item) => `<span class="tag">${item}</span>`).join(" ");
};

const renderMeta = (episode) => {
  const entries = [
    { label: "Episode", value: episode.episode_id },
    { label: "Patient", value: episode.patient_id },
    { label: "Specialties", value: (episode.triage?.suggested_specialties || []).join(", ") },
    { label: "In Network Only", value: episode.provider_matching?.in_network_only ? "Yes" : "No" },
  ];

  episodeMeta.innerHTML = entries
    .map(
      (entry) => `
      <div class="meta-pill">
        <strong>${entry.label}:</strong> ${entry.value || "—"}
      </div>
    `
    )
    .join("");
};

const renderEpisode = (episode) => {
  if (!episode) return;

  triageEl.innerHTML = `
    <div><strong>Summary:</strong> ${episode.triage?.triage_summary || "—"}</div>
    <div><strong>Suggested specialties:</strong> ${buildTags(episode.triage?.suggested_specialties)}</div>
  `;

  const providerRows = (episode.provider_matching?.providers || [])
    .map(
      (provider) => `
      <div>
        <strong>${provider.provider_id}</strong> • ${provider.specialty} • ${provider.location}
      </div>
    `
    )
    .join("");
  providersEl.innerHTML = providerRows || "—";

  summaryEl.innerHTML = `
    <div>${episode.summary?.plain_language_summary || "—"}</div>
  `;

  const extraction = episode.structured_extraction || {};
  extractionEl.innerHTML = `
    <div><strong>Symptoms:</strong> ${(extraction.symptoms || []).join(", ") || "—"}</div>
    <div><strong>Severity:</strong> ${extraction.severity || "—"}</div>
    <div><strong>Duration (days):</strong> ${extraction.duration_days ?? "—"}</div>
    <div><strong>Medications:</strong> ${(extraction.medications || []).join(", ") || "—"}</div>
    <div><strong>Tests ordered:</strong> ${(extraction.tests_ordered || []).join(", ") || "—"}</div>
    <div><strong>Follow-up:</strong> ${extraction.follow_up || "—"}</div>
  `;

  const consent = episode.consent_review || {};
  consentEl.innerHTML = `
    <div><strong>Document:</strong> ${consent.document_type || "—"}</div>
    <div><strong>Summary:</strong> ${consent.summary || "—"}</div>
    <div><strong>Before you sign:</strong></div>
    <pre class="code">${JSON.stringify(consent.before_you_sign || {}, null, 2)}</pre>
  `;

  const billing = episode.billing_reconciliation || {};
  billingEl.innerHTML = `
    <div><strong>Total billed:</strong> ${billing.total_billed ?? "—"}</div>
    <div><strong>Patient responsibility:</strong> ${billing.patient_responsibility ?? "—"}</div>
    <div><strong>Checklist:</strong></div>
    <pre class="code">${formatList(billing.verification_checklist || [])}</pre>
  `;

  const actionPlan = episode.action_plan || {};
  actionPlanEl.innerHTML = `
    <div><strong>Preferred language:</strong> ${actionPlan.preferred_language || "—"}</div>
    <div><strong>Reminder time:</strong> ${actionPlan.reminder_time || "—"}</div>
    <div><strong>Checklist:</strong></div>
    <pre class="code">${formatList(actionPlan.checklist || [])}</pre>
    <div><strong>Watch-outs:</strong> ${(actionPlan.watch_outs || []).join(", ") || "—"}</div>
  `;

  rawJsonEl.textContent = JSON.stringify(episode, null, 2);
  renderMeta(episode);
};

const loadEpisode = async (filename) => {
  if (!filename) return;
  const res = await fetch(`../outputs/episodes/${filename}`);
  if (!res.ok) {
    pipelineStatusEl.textContent = "Episode output not found";
    return;
  }
  const data = await res.json();
  currentEpisode = data;
  renderEpisode(data);
};

const filterEpisodes = () => {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = episodes.filter((episode) => episode.toLowerCase().includes(query));
  episodeSelect.innerHTML = filtered
    .map((episode) => `<option value="${episode}">${episode}</option>`)
    .join("");

  if (filtered.length > 0) {
    loadEpisode(filtered[0]);
  }
};

const loadData = async () => {
  pipelineStatusEl.textContent = "Loading data...";
  try {
    const summaryRes = await fetch(summaryPath);
    const summary = await summaryRes.json();
    totalEpisodesEl.textContent = summary.total_episodes ?? "—";

    const indexRes = await fetch(indexPath);
    const index = await indexRes.json();
    episodes = index.episodes || [];

    pipelineStatusEl.textContent = episodes.length ? "Ready" : "No episodes found";

    episodeSelect.innerHTML = episodes
      .map((episode) => `<option value="${episode}">${episode}</option>`)
      .join("");

    if (episodes.length > 0) {
      await loadEpisode(episodes[0]);
    }
  } catch (err) {
    pipelineStatusEl.textContent = "Unable to load outputs";
    totalEpisodesEl.textContent = "—";
    console.error(err);
  }
};

refreshButton.addEventListener("click", () => loadData());
searchInput.addEventListener("input", filterEpisodes);
episodeSelect.addEventListener("change", (event) => loadEpisode(event.target.value));

loadData();
