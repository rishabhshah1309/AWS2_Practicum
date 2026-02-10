const manifestUrl = "../synthetic_dataset/manifest.json";

const elements = {
  summaryGrid: document.getElementById("summaryGrid"),
  categorySelect: document.getElementById("categorySelect"),
  searchInput: document.getElementById("searchInput"),
  fileList: document.getElementById("fileList"),
  fileTitle: document.getElementById("fileTitle"),
  jsonViewer: document.getElementById("jsonViewer"),
  copyBtn: document.getElementById("copyBtn"),
  reloadBtn: document.getElementById("reloadBtn"),
};

let manifest = null;
let currentCategory = null;
let currentFiles = [];
let currentFile = null;

function sortCategories(categories) {
  return Object.keys(categories).sort((a, b) => a.localeCompare(b));
}

function filePath(category, fileName) {
  return `../synthetic_dataset/${category}/${fileName}`;
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function updateSummary() {
  if (!manifest) return;
  const categories = sortCategories(manifest.categories);
  elements.summaryGrid.innerHTML = "";

  const totalCard = document.createElement("div");
  totalCard.className = "summary-card";
  totalCard.innerHTML = `<strong>Total files</strong>${manifest.total_files}`;
  elements.summaryGrid.appendChild(totalCard);

  categories.forEach((name) => {
    const count = manifest.categories[name].length;
    const card = document.createElement("div");
    card.className = "summary-card";
    card.innerHTML = `<strong>${name}</strong>${count} files`;
    elements.summaryGrid.appendChild(card);
  });
}

function updateCategorySelect() {
  if (!manifest) return;
  const categories = sortCategories(manifest.categories);
  elements.categorySelect.innerHTML = "";
  categories.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    elements.categorySelect.appendChild(option);
  });
  if (categories.length > 0) {
    setCategory(categories[0]);
  }
}

function setCategory(name) {
  currentCategory = name;
  elements.categorySelect.value = name;
  currentFiles = manifest.categories[name] || [];
  elements.searchInput.value = "";
  renderFileList(currentFiles);
  if (currentFiles.length > 0) {
    loadFile(currentFiles[0]);
  } else {
    elements.fileTitle.textContent = "No files in this category";
    elements.jsonViewer.textContent = "";
  }
}

function renderFileList(files, filter = "") {
  const query = filter.trim().toLowerCase();
  elements.fileList.innerHTML = "";

  const filtered = files.filter((name) =>
    name.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "summary-card";
    empty.textContent = "No files match the filter.";
    elements.fileList.appendChild(empty);
    return;
  }

  filtered.forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "file-button";
    button.textContent = name;
    button.dataset.filename = name;
    if (name === currentFile) {
      button.classList.add("active");
    }
    button.addEventListener("click", () => loadFile(name));
    elements.fileList.appendChild(button);
  });
}

async function loadFile(name) {
  if (!currentCategory || !name) return;
  currentFile = name;
  const fileUrl = filePath(currentCategory, name);
  elements.fileTitle.textContent = `${currentCategory}/${name}`;
  elements.jsonViewer.textContent = "Loading...";

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to load ${fileUrl}`);
    }
    const data = await response.json();
    elements.jsonViewer.textContent = formatJson(data);
  } catch (error) {
    elements.jsonViewer.textContent = `Error: ${error.message}`;
  }

  renderFileList(currentFiles, elements.searchInput.value);
}

async function loadManifest() {
  elements.jsonViewer.textContent = "Loading manifest...";
  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error("Manifest not found. Run build_manifest.py.");
    }
    manifest = await response.json();
    updateSummary();
    updateCategorySelect();
  } catch (error) {
    elements.jsonViewer.textContent = `Error: ${error.message}`;
  }
}

elements.categorySelect.addEventListener("change", (event) => {
  setCategory(event.target.value);
});

elements.searchInput.addEventListener("input", (event) => {
  renderFileList(currentFiles, event.target.value);
});

elements.copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(elements.jsonViewer.textContent);
    elements.copyBtn.textContent = "Copied!";
    setTimeout(() => {
      elements.copyBtn.textContent = "Copy JSON";
    }, 1200);
  } catch (error) {
    elements.copyBtn.textContent = "Copy failed";
    setTimeout(() => {
      elements.copyBtn.textContent = "Copy JSON";
    }, 1200);
  }
});

elements.reloadBtn.addEventListener("click", () => {
  loadManifest();
});

loadManifest();
