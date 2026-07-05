// OmniTV Store - Static Administrative Web Panel Controller Script
// Deployed Apps Script Web App URL:
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbztKTju3EHjJCI-7163fH2DuW801Vi_a0KKrGMWti_11vZAl9lD6S2M92JJQNEUPMGg5g/exec"; 

// Fallback Mock database for instant offline evaluation / preview
let mockActivations = [
  { macAddress: "D3:3C:C3:1B:1D:84", isApproved: true, status: "Active", expiryDate: "Permanent", deviceName: "Chromecast Google TV", androidVersion: "Android 12" },
  { macAddress: "AA:BB:CC:11:22:33", isApproved: false, status: "Pending", expiryDate: "Permanent", deviceName: "Xiaomi TV Box S", androidVersion: "Android 11" },
  { macAddress: "E1:D2:C3:B4:A5:96", isApproved: false, status: "Rejected", expiryDate: "2026-06-30", deviceName: "Sony BRAVIA 4K", androidVersion: "Android 10" }
];

let mockFiles = [
  { id: "1001", libraryCode: "108435E6", name: "DashReels", url: "https://omni-ott.dub.link/dashreels", logoUrl: "", sizeBytes: 15400000, description: "🔥 DashReels: ছোট ভিডিওর নতুন ট্রেন্ড! লাইভ ড্রামা, রিয়েলস এবং চমৎকার ওটিটি সিনেমা সরাসরি আপনার টিভিতে।" },
  { id: "1002", libraryCode: "108435E6", name: "DramaBox", url: "https://omni-ott.dub.link/dramabox", logoUrl: "", sizeBytes: 18200000, description: "🎭 DramaBox: অসাধারণ সব শর্ট ড্রামা সিরিজ ও এক্সক্লুসিভ বাংলা কন্টেন্ট দেখুন ফুল এইচডি রেজুলেশনে।" }
];

// Check status on load
document.addEventListener("DOMContentLoaded", () => {
  updateConnectionStatus();
  fetchActivations();
  fetchFiles();
});

function updateConnectionStatus() {
  const badge = document.getElementById("connectionStatus");
  if (!GOOGLE_SCRIPT_URL) {
    badge.className = "badge badge-ghost gap-2 p-3 font-semibold text-slate-400";
    badge.innerHTML = `<i class="fa-solid fa-cloud-sun text-yellow-500"></i> Local Preview Mode`;
  } else {
    badge.className = "badge badge-success gap-2 p-3 font-semibold text-white";
    badge.innerHTML = `<span class="loading loading-ring loading-xs"></span> Connected to Sheets`;
  }
}

// Tab switcher logic
function switchTab(tab) {
  const tabAct = document.getElementById("tabActivations");
  const tabFiles = document.getElementById("tabFiles");
  const moduleAct = document.getElementById("activationsModule");
  const moduleFiles = document.getElementById("filesModule");

  if (tab === 'activations') {
    tabAct.classList.add("tab-active", "text-indigo-400");
    tabAct.classList.remove("text-slate-400");
    tabFiles.classList.remove("tab-active", "text-indigo-400");
    tabFiles.classList.add("text-slate-400");
    moduleAct.classList.remove("hidden");
    moduleFiles.classList.add("hidden");
  } else {
    tabFiles.classList.add("tab-active", "text-indigo-400");
    tabFiles.classList.remove("text-slate-400");
    tabAct.classList.remove("tab-active", "text-indigo-400");
    tabAct.classList.add("text-slate-400");
    moduleFiles.classList.remove("hidden");
    moduleAct.classList.add("hidden");
  }
}

function openDocs() {
  alert("Please refer to your Apps Script environment configuration to make sure API accesses are set to Anyone.");
}

// ---------------------- ACTIVATIONS OPERATIONS ----------------------

async function fetchActivations() {
  const tbody = document.getElementById("activationsTableBody");
  
  if (!GOOGLE_SCRIPT_URL) {
    renderActivations(mockActivations);
    return;
  }

  try {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getActivations`);
    const data = await res.json();
    renderActivations(data);
  } catch (err) {
    console.error("Failed to load activations", err);
    renderActivations(mockActivations); // fallback
  }
}

function renderActivations(list) {
  const tbody = document.getElementById("activationsTableBody");
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8 text-slate-500">No activations registered yet.</td></tr>`;
    return;
  }

  list.forEach(act => {
    let badgeClass = "badge-ghost";
    if (act.status === "Active") badgeClass = "badge-success text-white";
    else if (act.status === "Pending") badgeClass = "badge-warning text-slate-900";
    else if (act.status === "Rejected") badgeClass = "badge-error text-white";

    const tr = document.createElement("tr");
    tr.className = "border-slate-800 hover:bg-slate-900/50";
    tr.innerHTML = `
      <td>
        <div class="flex flex-col">
          <span class="font-mono font-bold text-indigo-400 text-sm">${act.macAddress}</span>
          <span class="text-xs text-slate-400 mt-0.5">${act.deviceName || 'Unknown device'} (${act.androidVersion || 'Android'})</span>
        </div>
      </td>
      <td>
        <span class="font-semibold text-slate-300 text-xs">${act.expiryDate || 'Permanent'}</span>
      </td>
      <td>
        <div class="badge ${badgeClass} badge-sm font-bold text-xs uppercase">${act.status}</div>
      </td>
      <td class="text-center">
        <div class="flex justify-center gap-2">
          ${act.status !== 'Active' ? `
            <button class="btn btn-xs btn-success text-white px-2" onclick="quickApprove('${act.macAddress}', true)" title="Approve">
              <i class="fa-solid fa-check"></i> Approve
            </button>
          ` : `
            <button class="btn btn-xs btn-outline btn-error px-2" onclick="quickApprove('${act.macAddress}', false)" title="Revoke">
              <i class="fa-solid fa-xmark"></i> Revoke
            </button>
          `}
          <button class="btn btn-xs btn-outline btn-square text-indigo-400" onclick="editActivation('${encodeURIComponent(JSON.stringify(act))}')">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-xs btn-outline btn-square text-red-500 hover:bg-red-600 hover:text-white" onclick="deleteActivation('${act.macAddress}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function saveActivation(e) {
  e.preventDefault();
  const mac = document.getElementById("actMac").value.trim().toUpperCase();
  const device = document.getElementById("actDevice").value.trim();
  const version = document.getElementById("actVersion").value.trim();
  const expiry = document.getElementById("actExpiry").value.trim();
  const status = document.getElementById("actStatus").value;

  if (!mac) return;

  const payload = {
    action: "saveActivation",
    macAddress: mac,
    deviceName: device,
    androidVersion: version,
    expiryDate: expiry,
    status: status,
    isApproved: status === "Active"
  };

  if (!GOOGLE_SCRIPT_URL) {
    const idx = mockActivations.findIndex(a => a.macAddress.toLowerCase() === mac.toLowerCase());
    if (idx !== -1) {
      mockActivations[idx] = payload;
    } else {
      mockActivations.push(payload);
    }
    renderActivations(mockActivations);
    clearActivationForm();
    alert("Saved (Local Preview Mode)");
    return;
  }

  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    alert("Activation request sent successfully to Google Sheet!");
    clearActivationForm();
    setTimeout(fetchActivations, 1000);
  } catch (err) {
    alert("Failed to connect: " + err.message);
  }
}

async function quickApprove(mac, approve) {
  const payload = {
    action: "saveActivation",
    macAddress: mac,
    status: approve ? "Active" : "Rejected",
    isApproved: approve
  };

  if (!GOOGLE_SCRIPT_URL) {
    const act = mockActivations.find(a => a.macAddress.toLowerCase() === mac.toLowerCase());
    if (act) {
      act.status = approve ? "Active" : "Rejected";
      act.isApproved = approve;
    }
    renderActivations(mockActivations);
    return;
  }

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setTimeout(fetchActivations, 800);
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function deleteActivation(mac) {
  if (!confirm(`Are you sure you want to remove device activation for MAC: ${mac}?`)) return;

  if (!GOOGLE_SCRIPT_URL) {
    mockActivations = mockActivations.filter(a => a.macAddress.toLowerCase() !== mac.toLowerCase());
    renderActivations(mockActivations);
    return;
  }

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteActivation", macAddress: mac })
    });
    setTimeout(fetchActivations, 800);
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function editActivation(actStr) {
  const act = JSON.parse(decodeURIComponent(actStr));
  document.getElementById("actMac").value = act.macAddress;
  document.getElementById("actDevice").value = act.deviceName || "";
  document.getElementById("actVersion").value = act.androidVersion || "";
  document.getElementById("actExpiry").value = act.expiryDate || "Permanent";
  document.getElementById("actStatus").value = act.status;
}

function clearActivationForm() {
  document.getElementById("activationForm").reset();
  document.getElementById("actExpiry").value = "Permanent";
  document.getElementById("actStatus").value = "Pending";
}

// ---------------------- FILE OPERATIONS ----------------------

async function fetchFiles() {
  if (!GOOGLE_SCRIPT_URL) {
    renderFiles(mockFiles);
    return;
  }

  try {
    const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getFiles`);
    const data = await res.json();
    renderFiles(data);
  } catch (err) {
    console.error("Failed to load files", err);
    renderFiles(mockFiles);
  }
}

function renderFiles(list) {
  const tbody = document.getElementById("filesTableBody");
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center py-8 text-slate-500">No applications files added yet.</td></tr>`;
    return;
  }

  list.forEach(file => {
    const tr = document.createElement("tr");
    tr.className = "border-slate-800 hover:bg-slate-900/50";
    tr.innerHTML = `
      <td>
        <div class="flex items-center gap-3">
          <div class="bg-indigo-950/60 text-indigo-400 font-bold border border-indigo-900 rounded-lg p-3 w-12 h-12 flex items-center justify-center text-md uppercase">
            ${file.name.substring(0, 2)}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-slate-100">${file.name}</h4>
              <span class="px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300 border border-indigo-900 bg-indigo-950/40 rounded">${file.libraryCode || '108435E6'}</span>
            </div>
            <p class="text-xs text-slate-400 max-w-sm truncate mt-0.5">${file.description || 'No description'}</p>
          </div>
        </div>
      </td>
      <td>
        <span class="font-mono text-slate-300 text-xs">${formatBytes(file.sizeBytes || 15000000)}</span>
      </td>
      <td class="text-center">
        <div class="flex justify-center gap-2">
          <button class="btn btn-xs btn-outline btn-square text-indigo-400" onclick="editFile('${encodeURIComponent(JSON.stringify(file))}')">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-xs btn-outline btn-square text-red-500 hover:bg-red-600 hover:text-white" onclick="deleteFile('${file.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function saveFile(e) {
  e.preventDefault();
  let id = document.getElementById("fileId").value;
  if (!id) id = Date.now().toString(); // automatic id if empty

  const name = document.getElementById("fileName").value.trim();
  const libCode = document.getElementById("fileLibraryCode").value.trim() || "108435E6";
  const url = document.getElementById("fileUrl").value.trim();
  const logo = document.getElementById("fileLogo").value.trim();
  const size = parseInt(document.getElementById("fileSize").value, 10) || 15000000;
  const desc = document.getElementById("fileDescription").value.trim();
  const tutorial = document.getElementById("fileTutorial").value.trim();

  const payload = {
    action: "saveFile",
    id: id,
    libraryCode: libCode,
    name: name,
    url: url,
    logoUrl: logo,
    sizeBytes: size,
    description: desc,
    tutorialUrl: tutorial
  };

  if (!GOOGLE_SCRIPT_URL) {
    const idx = mockFiles.findIndex(f => f.id === id);
    if (idx !== -1) {
      mockFiles[idx] = payload;
    } else {
      mockFiles.push(payload);
    }
    renderFiles(mockFiles);
    clearFileForm();
    alert("Saved File (Local Preview Mode)");
    return;
  }

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    alert("App details sent successfully to Google Sheet!");
    clearFileForm();
    setTimeout(fetchFiles, 1000);
  } catch (err) {
    alert("Failed to connect: " + err.message);
  }
}

async function deleteFile(id) {
  if (!confirm("Are you sure you want to delete this app file from the catalog?")) return;

  if (!GOOGLE_SCRIPT_URL) {
    mockFiles = mockFiles.filter(f => f.id !== id);
    renderFiles(mockFiles);
    return;
  }

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteFile", id: id })
    });
    setTimeout(fetchFiles, 800);
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function editFile(fileStr) {
  const file = JSON.parse(decodeURIComponent(fileStr));
  document.getElementById("fileId").value = file.id;
  document.getElementById("fileName").value = file.name;
  document.getElementById("fileLibraryCode").value = file.libraryCode || "108435E6";
  document.getElementById("fileUrl").value = file.url;
  document.getElementById("fileLogo").value = file.logoUrl || "";
  document.getElementById("fileSize").value = file.sizeBytes || 15000000;
  document.getElementById("fileDescription").value = file.description;
  document.getElementById("fileTutorial").value = file.tutorialUrl || "";
}

function clearFileForm() {
  document.getElementById("fileForm").reset();
  document.getElementById("fileId").value = "";
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = 1;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}