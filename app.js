/* AutoConnect Karnataka - SPCK friendly version
   IMPORTANT:
   1) Replace YOUR_API_KEY and YOUR_APP_ID below with the values from Firebase Console.
   2) Enable Authentication > Sign-in method > Email/Password.
   3) Firestore can stay in Production mode; the app works in Demo Mode even before rules are configured.
*/

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "autoconnect-karnataka.firebaseapp.com",
  projectId: "autoconnect-karnataka",
  storageBucket: "autoconnect-karnataka.firebasestorage.app",
  messagingSenderId: "191157984638",
  appId: "YOUR_APP_ID",
  measurementId: "G-W7W8F4G3F2"
};

let firebaseReady = false;
let auth = null;
let db = null;

try {
  if (window.firebase && firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.appId !== "YOUR_APP_ID") {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    firebaseReady = true;
    document.getElementById("firebaseStatus").textContent = "Firebase connected ✓";
  } else {
    document.getElementById("firebaseStatus").textContent =
      "Firebase config not added yet — Demo Mode is available.";
  }
} catch (e) {
  console.error(e);
  document.getElementById("firebaseStatus").textContent =
    "Firebase could not load. You can still use Demo Mode.";
}

const $ = id => document.getElementById(id);
const toast = msg => {
  $("toast").textContent = msg;
  $("toast").style.display = "block";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => $("toast").style.display = "none", 2500);
};

let signup = false;
let demoMode = false;

const demoVehicles = [
  {id:"KA-47-A-1001",name:"KSRTC Express 01",location:"Honnavar",online:true,temp:31},
  {id:"KA-31-B-2045",name:"AutoConnect Bus 02",location:"Kumta",online:true,temp:30},
  {id:"KA-15-C-7788",name:"City Shuttle 03",location:"Uttara Kannada",online:false,temp:34}
];

const demoAlerts = [
  {icon:"🌡️",title:"Temperature warning",text:"Bus KA-47-A-1001 reached 82°C",time:"2 min ago",type:"warn"},
  {icon:"🟢",title:"System normal",text:"GPS connection restored",time:"12 min ago",type:"ok"},
  {icon:"🔋",title:"Battery status",text:"Battery level is 84%",time:"25 min ago",type:"ok"}
];

function renderVehicles() {
  const html = demoVehicles.map(v => `
    <div class="vehicle-row">
      <div class="vehicle-icon">🚍</div>
      <div class="row-main"><b>${escapeHtml(v.name)}</b><small>${escapeHtml(v.id)} • ${escapeHtml(v.location)}</small></div>
      <span class="status ${v.online ? "" : "off"}">${v.online ? "Online" : "Offline"}</span>
    </div>`).join("");

  $("vehicleList").innerHTML = html;
  $("allVehicles").innerHTML = html;
  $("vehicleCount").textContent = demoVehicles.length;
  $("onlineCount").textContent = demoVehicles.filter(v => v.online).length;

  const avg = Math.round(demoVehicles.reduce((s,v) => s + v.temp, 0) / demoVehicles.length);
  $("tempValue").textContent = avg + "°C";
}

function renderAlerts() {
  const html = demoAlerts.map(a => `
    <div class="alert-row">
      <div class="vehicle-icon">${a.icon}</div>
      <div class="row-main">
        <b class="${a.type === "warn" ? "alert-warn" : "alert-ok"}">${escapeHtml(a.title)}</b>
        <small>${escapeHtml(a.text)} • ${escapeHtml(a.time)}</small>
      </div>
    </div>`).join("");

  $("alertList").innerHTML = html;
  $("allAlerts").innerHTML = html;
  $("alertCount").textContent = demoAlerts.filter(a => a.type === "warn").length;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  const target = $(page + "Page");
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.page === page)
  );
  $("pageTitle").textContent = page.charAt(0).toUpperCase() + page.slice(1);
  window.scrollTo({top: 0, behavior: "smooth"});
}

function openApp(user) {
  $("authScreen").classList.add("hidden");
  $("appScreen").classList.remove("hidden");

  const name = user?.displayName || user?.email?.split("@")[0] || "Demo User";
  $("userName").textContent = name;
  $("profileName").textContent = name;
  $("profileEmail").textContent = user?.email || "Demo account";
  $("avatar").textContent = name.charAt(0).toUpperCase();
  $("accountStatus").textContent = demoMode ? "Demo mode" : "Firebase secured";
  showPage("dashboard");
}

function closeApp() {
  $("authScreen").classList.remove("hidden");
  $("appScreen").classList.add("hidden");
}

document.querySelectorAll(".nav-btn").forEach(b =>
  b.addEventListener("click", () => showPage(b.dataset.page))
);

document.querySelectorAll("[data-page-link]").forEach(b =>
  b.addEventListener("click", () => showPage(b.dataset.pageLink))
);

$("loginTab").addEventListener("click", () => {
  signup = false;
  $("loginTab").classList.add("active");
  $("signupTab").classList.remove("active");
  $("nameInput").classList.add("hidden");
  $("nameInput").required = false;
  $("authBtn").textContent = "Login";
});

$("signupTab").addEventListener("click", () => {
  signup = true;
  $("signupTab").classList.add("active");
  $("loginTab").classList.remove("active");
  $("nameInput").classList.remove("hidden");
  $("nameInput").required = true;
  $("authBtn").textContent = "Create account";
});

$("authForm").addEventListener("submit", async e => {
  e.preventDefault();

  const email = $("emailInput").value.trim();
  const password = $("passwordInput").value;

  if (!firebaseReady) {
    toast("Firebase config missing. Use Open Demo App, or add your Firebase config.");
    return;
  }

  $("authBtn").disabled = true;
  $("authBtn").textContent = signup ? "Creating…" : "Logging in…";

  try {
    if (signup) {
      const name = $("nameInput").value.trim() || "AutoConnect User";
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({displayName: name});

      try {
        await db.collection("users").doc(cred.user.uid).set({
          uid: cred.user.uid,
          name,
          email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (dbErr) {
        console.warn("Firestore profile save failed:", dbErr);
      }

      toast("Account created successfully!");
      openApp(cred.user);
    } else {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      toast("Login successful!");
      openApp(cred.user);
    }
  } catch (err) {
    console.error(err);
    let message = err.message || "Authentication failed.";
    message = message.replace("Firebase: ", "");
    toast(message);
  } finally {
    $("authBtn").disabled = false;
    $("authBtn").textContent = signup ? "Create account" : "Login";
  }
});

$("demoBtn").addEventListener("click", () => {
  demoMode = true;
  openApp({displayName:"Demo User", email:"demo@autoconnect.app"});
  toast("Demo app opened. All dashboard buttons are active.");
});

$("logoutBtn").addEventListener("click", async () => {
  if (firebaseReady && !demoMode) {
    try { await auth.signOut(); } catch (e) { console.error(e); }
  }
  demoMode = false;
  closeApp();
  toast("Logged out");
});

$("addVehicleBtn").addEventListener("click", () => {
  const id = prompt("Vehicle number (example: KA-47-A-9999):");
  if (!id || !id.trim()) return;

  const cleanId = id.trim().toUpperCase();
  demoVehicles.push({
    id: cleanId,
    name: "New Connected Vehicle",
    location: "Karnataka",
    online: true,
    temp: 30
  });

  renderVehicles();
  toast("Vehicle added successfully!");
});

$("refreshSensors").addEventListener("click", () => {
  const speed = 35 + Math.floor(Math.random() * 20);
  const temp = 78 + Math.floor(Math.random() * 9);
  $("speedValue").textContent = speed + " km/h";
  $("engineTemp").textContent = temp + "°C";
  $("tempValue").textContent = temp + "°C";
  toast("Sensor data refreshed!");
});

renderVehicles();
renderAlerts();

if (firebaseReady) {
  auth.onAuthStateChanged(user => {
    if (user) {
      demoMode = false;
      openApp(user);
    } else {
      closeApp();
    }
  });
}
