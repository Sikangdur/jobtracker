// ====== SUPABASE CONFIG (GANTI KALAU GANTI PROJECT) ======
const SUPABASE_URL = "https://qwtmbmjdginuccuncglp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dG1ibWpkZ2ludWNjdW5jZ2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY4MzMsImV4cCI6MjA4MDM5MjgzM30.EVrRYIs4CMRsVKyAZzqujNt0AJNAIBsugya4r2gPR5w";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====== STATE & DOM ======
let jobs = [];
const $ = (id) => document.getElementById(id);
const tbody = $("jobBody");
const modal = $("modal");
const emptyState = $("emptyState");

// ====== CORE FUNCTIONS ======
const loadJobs = async () => {
  const { data } = await db
    .from("jobs")
    .select("*")
    .order("date", { ascending: false });
  jobs = data || [];
  render();
};

const render = () => {
  tbody.innerHTML = "";
  if (jobs.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  jobs.forEach((job, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="No">${i + 1}</td>
      <td data-label="Perusahaan">${job.company}</td>
      <td data-label="Posisi">${job.position}</td>
      <td data-label="Tanggal">${job.date}</td>
      <td data-label="Status">
        <select onchange="updateStatus(${job.id}, this.value)">
          ${["Applied", "Interview", "Offer", "Rejected", "Ghosted"]
            .map(
              (s) =>
                `<option value="${s}" ${
                  job.status === s ? "selected" : ""
                }>${s}</option>`
            )
            .join("")}
        </select>
      </td>
      <td data-label="Catatan">${job.notes || "-"}</td>
      <td data-label="Aksi">
        <button onclick="editJob(${job.id})" class="btn-small">Edit</button>
        <button onclick="deleteJob(${job.id})" class="btn-danger">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  updateDashboard();
};

const updateDashboard = () => {
  const counts = {
    Applied: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
    Ghosted: 0,
  };
  jobs.forEach((j) => counts[j.status]++);
  const total = jobs.length;
  const offer = counts.Offer;
  const success = total > 0 ? Math.round((offer / total) * 100) : 0;

  $("totalCount").textContent = total;
  $("appliedCount").textContent = counts.Applied;
  $("interviewCount").textContent = counts.Interview;
  $("offerCount").textContent = offer;
  $("successRate").textContent = `${success}%`;
};

const updateStatus = async (id, status) => {
  await db.from("jobs").update({ status }).eq("id", id);
  loadJobs();
};

const deleteJob = async (id) => {
  if (!confirm("Yakin hapus?")) return;
  await db.from("jobs").delete().eq("id", id);
  loadJobs();
};

const editJob = async (id) => {
  const job = jobs.find((j) => j.id === id);
  $("date").value = job.date;
  $("company").value = job.company;
  $("position").value = job.position;
  $("status").value = job.status;
  $("notes").value = job.notes || "";
  window.currentEditId = id;
  $("modalTitle").textContent = "Edit Lamaran";
  $("saveBtn").textContent = "Update";
  modal.style.display = "flex";
};

// ====== FORM & MODAL ======
$("addBtn").onclick = () => {
  $("jobForm").reset();
  $("date").valueAsDate = new Date();
  window.currentEditId = null;
  $("modalTitle").textContent = "Tambah Lamaran Baru";
  $("saveBtn").textContent = "Simpan";
  modal.style.display = "flex";
};

$("cancelBtn").onclick = $("modal").onclick = (e) => {
  if (e.target === modal || e.target === $("cancelBtn"))
    modal.style.display = "none";
};

$("jobForm").onsubmit = async (e) => {
  e.preventDefault();
  const payload = {
    date: $("date").value,
    company: $("company").value.trim(),
    position: $("position").value.trim(),
    status: $("status").value,
    notes: $("notes").value.trim() || null,
  };

  if (window.currentEditId) {
    await db.from("jobs").update(payload).eq("id", window.currentEditId);
  } else {
    await db.from("jobs").insert([payload]);
  }
  modal.style.display = "none";
  loadJobs();
};

// ====== CSV IMPORT (1-CLICK 100 DATA) ======
$("csvImport").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const text = ev.target.result;
    const lines = text.trim().split("\n").slice(1); // skip header
    const records = lines.map((line) => {
      const [date, company, position, status = "Applied", notes = ""] =
        line.split(",");
      return {
        date: date.trim(),
        company: company.trim(),
        position: position.trim(),
        status: status.trim(),
        notes: notes.trim() || null,
      };
    });
    await db.from("jobs").insert(records);
    alert(`Sukses import ${records.length} lamaran!`);
    loadJobs();
  };
  reader.readAsText(file);
};

// ====== DARK MODE TOGGLE ======
$("themeToggle").onclick = () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "light" : "dark"
  );
  $("themeToggle").textContent = isDark ? "Dark Mode" : "Light Mode";
};

// ====== INIT ======
loadJobs();
