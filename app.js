var USERS = { head: { n: "Nurse Reyes", r: "Clinic Head", pin: "1111" }, principal: { n: "Principal Santos", r: "Principal", pin: "2222" }, teacher: { n: "Teacher Cruz", r: "Teacher", pin: "3333" }, admin: { n: "Admin Lopez", r: "Administrator", pin: "4444" }, guardian: { n: "Guardian", r: "Guardian", pin: "5555" } };
var PROG = ["STEM", "ABM", "HUMSS", "GAS", "ICT", "BSIT", "BSCS"];
var KEY = "clinicDB_v1";
function today() { return new Date().toISOString().slice(0, 10) }
function daysFrom(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
function seed() {
    return {
        pins: { head: "1111", principal: "2222", teacher: "3333", admin: "4444", guardian: "5555" }, pending: 0, lastSync: null, offline: false, seq: 4,
        visits: [
            { id: 1, date: daysFrom(-3), time: "09:15", student: "Maria Dela Cruz", sy: "2026-2027", prog: "STEM", grade: "12", sec: "A", temp: "37.8", bp: "110/70", pulse: "88", cc: "Headache", iv: "Rest, paracetamol given", ht: "Hydration and sleep", item: "Paracetamol 500mg", q: 1, hist: "Allergic to penicillin" },
            { id: 2, date: daysFrom(-1), time: "10:40", student: "Juan Reyes", sy: "2026-2027", prog: "ICT", grade: "11", sec: "B", temp: "36.6", bp: "120/80", pulse: "76", cc: "Minor wound", iv: "Cleaned, bandaged", ht: "Wound care", item: "Bandage roll", q: 1, hist: "None" },
            { id: 3, date: today(), time: "08:30", student: "Ana Villanueva", sy: "2026-2027", prog: "BSIT", grade: "2nd Year", sec: "C", temp: "38.2", bp: "100/65", pulse: "92", cc: "Headache", iv: "Rest, referred to guardian", ht: "Seek doctor if fever persists", item: "", q: 0, hist: "Asthma" }],
        inv: [
            { id: 1, name: "Paracetamol 500mg", cat: "Medicine", qty: 48, unit: "tablets", min: 20, exp: daysFrom(200) },
            { id: 2, name: "Bandage roll", cat: "Supply", qty: 9, unit: "rolls", min: 10, exp: daysFrom(400) },
            { id: 3, name: "Antiseptic solution", cat: "Supply", qty: 6, unit: "bottles", min: 3, exp: daysFrom(20) },
            { id: 4, name: "Oral rehydration salts", cat: "Medicine", qty: 15, unit: "sachets", min: 10, exp: daysFrom(-5) }],
        codes: []
    }
}
var db; try { db = JSON.parse(localStorage.getItem(KEY)) } catch (e) { db = null }
if (!db || !db.visits) db = seed();
if (!db.pins) db.pins = seed().pins;
if (!db.scodes) db.scodes = [];
function defaultPins() { var d = seed().pins; return Object.keys(d).every(function (k) { return db.pins[k] === d[k] }) }
function save() { if (db.offline) db.pending++; try { localStorage.setItem(KEY, JSON.stringify(db)) } catch (e) { } }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch (e) { } }
var S = { u: null, view: "", q: "", fsy: "", fpr: "", fgr: "", fsc: "", sort: "date", edit: null, msg: "" };
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] }) }
function $(id) { return document.getElementById(id) }
function v(id) { var e = $(id); return e ? e.value.trim() : "" }
function online() { return !db.offline && navigator.onLine !== false }

function nav() {
    var r = S.u.r, t = [];
    if (r === "Clinic Head") t = [["dash", "Dashboard"], ["visits", "Clinic visits"], ["inv", "Inventory"], ["access", "Access and codes"], ["set", "Settings"]];
    else if (r === "Guardian") t = [["gd", "Guardian access"]]; else t = [["ver", "Visit verification"]];
    if (!S.view) S.view = t[0][0];
    return "<nav>" + t.map(function (x) { return '<button class="' + (S.view === x[0] ? "on" : "") + '" onclick="go(\'' + x[0] + '\')">' + x[1] + "</button>" }).join("") + "</nav>"
}
function go(x) { S.view = x; S.edit = null; S.msg = ""; render() }

function render() {
    var a = $("app");
    if (!S.u) {
        a.innerHTML = '<div id="login" class="card"><h2>School Clinic System</h2><p class="note">Systems Plus Computer College. Select a role and enter the PIN.</p>' +
            '<label>Role<select id="lr" onchange="loginRole()">' + Object.keys(USERS).map(function (k) { return '<option value="' + k + '">' + USERS[k].r + "</option>" }).join("") + '</select></label><br>' +
            '<label><span id="ll">PIN</span><input id="lp" type="password" inputmode="numeric" onkeydown="if(event.key===\'Enter\')login()"></label><br>' +
            '<button class="p" onclick="login()">Sign in</button> <span class="note" id="le"></span>' +
            '<p class="note">' + "Clinic Head signs in with a fixed PIN" + (db.pins.head === "1111" ? " (demo PIN: 1111)" : "") + ". Principal, Teacher, Administrator and Guardian sign in with a one-time code from the Clinic Head." + '</p></div>'; return
    }
    var on = online();
    a.innerHTML = (on ? "" : '<div class="ban">Offline mode: changes are saved on this device and will sync when you reconnect.</div>') +
        '<header><h1>Clinic System · ' + esc(S.u.r) + '</h1><div class="bar"><span class="tag ' + (on ? "good" : "warn") + '">' + (on ? "Online" : "Offline") + '</span>' +
        (db.pending ? '<span class="tag warn">' + db.pending + " pending sync</span>" : '<span class="tag good">Synced' + (db.lastSync ? " " + esc(db.lastSync) : "") + "</span>") +
        '<button class="s" onclick="toggleOff()">' + (db.offline ? "Go online" : "Simulate offline") + '</button><button class="s" onclick="logout()">Sign out</button></div></header><main>' + nav() +
        '<div>' + (S.msg ? '<div class="card">' + S.msg + "</div>" : "") + view() + "</div></main>"
}

function loginRole() { var h = $("lr").value === "head"; $("ll").textContent = h ? "PIN" : "One-time code"; $("lp").type = h ? "password" : "text" }
function login() {
    var k = v("lr"), c = v("lp"), e = $("le");
    if (!c) { e.textContent = "Enter your " + (k === "head" ? "PIN" : "one-time code") + "."; return }
    if (k === "head") { if (c === db.pins.head) { S.u = USERS.head; S.view = ""; S.msg = ""; render() } else e.textContent = "Wrong PIN."; return }
    if (k === "guardian") { var r = redeem(c); if (!r.ok) { e.textContent = r.m; return } S.u = USERS.guardian; S.view = "gd"; S.msg = ""; S.gres = r.html; render(); return }
    var s = db.scodes.filter(function (x) { return x.code === c && x.role === k })[0];
    if (!s) { e.textContent = "Invalid code for this role."; return }
    if (s.used) { e.textContent = "This code has already been used."; return }
    s.used = true; save(); S.u = USERS[k]; S.view = ""; S.msg = ""; render()
}
function logout() { S.u = null; S.view = ""; render() }
function toggleOff() { db.offline = !db.offline; if (!db.offline) sync(); persist(); render() }
function sync() { if (db.pending > 0 || db.lastSync === null) { db.pending = 0; db.lastSync = new Date().toLocaleTimeString() } }
window.addEventListener("online", function () { if (!db.offline) { sync(); persist(); if (S.u) render() } });
window.addEventListener("offline", function () { if (S.u) render() });

function view() {
    var w = S.view;
    if (w === "dash") return dash(); if (w === "visits") return visits(); if (w === "inv") return inv();
    if (w === "access") return access(); if (w === "set") return settings(); if (w === "ver") return ver(); if (w === "gd") return gd(); return ""
}

function flags(i) {
    var t = today(), f = []; if (i.exp < t) f.push('<span class="tag bad">Expired</span>'); else if (i.exp <= daysFrom(30)) f.push('<span class="tag warn">Expires soon</span>');
    if (i.qty <= 0) f.push('<span class="tag bad">Out of stock</span>'); else if (i.qty <= i.min) f.push('<span class="tag warn">Low stock</span>'); return f.join(" ") || '<span class="tag good">OK</span>'
}

function dash() {
    var t = today(), tv = db.visits.filter(function (x) { return x.date === t }).length, low = db.inv.filter(function (i) { return i.qty <= i.min }).length, ex = db.inv.filter(function (i) { return i.exp <= daysFrom(30) }).length;
    var c = {}; db.visits.forEach(function (x) { var k = x.cc || "Unspecified"; c[k] = (c[k] || 0) + 1 });
    var rows = Object.keys(c).sort(function (a, b) { return c[b] - c[a] }).map(function (k) { return "<tr><td>" + esc(k) + "</td><td>" + c[k] + "</td></tr>" }).join("");
    return '<h2>Dashboard</h2><div class="grid"><div class="card stat"><b>' + tv + '</b><span>Visits today</span></div><div class="card stat"><b>' + db.visits.length + '</b><span>Total visits</span></div><div class="card stat"><b>' + low + '</b><span>Low or empty stock</span></div><div class="card stat"><b>' + ex + '</b><span>Expired or expiring in 30 days</span></div></div>' +
        '<div class="card"><h3>Morbidity report (by chief complaint)</h3><div class="tw"><table><tr><th>Complaint</th><th>Cases</th></tr>' + (rows || '<tr><td colspan="2" class="mu">No data</td></tr>') + "</table></div></div>"
}

function uniq(k) { var s = {}; db.visits.forEach(function (x) { if (x[k]) s[x[k]] = 1 }); return Object.keys(s).sort() }
function opts(arr, cur, all) { return '<option value="">' + all + "</option>" + arr.map(function (x) { return "<option" + (x === cur ? " selected" : "") + ">" + esc(x) + "</option>" }).join("") }
function visits() {
    var list = db.visits.filter(function (x) {
        var q = S.q.toLowerCase();
        return (!q || (x.student + " " + x.cc).toLowerCase().indexOf(q) > -1) && (!S.fsy || x.sy === S.fsy) && (!S.fpr || x.prog === S.fpr) && (!S.fgr || x.grade === S.fgr) && (!S.fsc || x.sec === S.fsc)
    });
    list.sort(function (a, b) { return S.sort === "name" ? a.student.localeCompare(b.student) : (b.date + b.time).localeCompare(a.date + a.time) });
    var f = S.edit;
    var form = f ? visitForm() : '<button class="p" onclick="S.edit=\'new\';render()">+ New clinic visit</button>';
    return '<h2>Clinic visits</h2><div class="card">' + form + '</div><div class="card"><div class="fg">' +
        '<label>Search<input id="fq" value="' + esc(S.q) + '" placeholder="Name or complaint" oninput="S.q=this.value;keep(\'fq\')"></label>' +
        '<label>School year<select onchange="S.fsy=this.value;render()">' + opts(uniq("sy"), S.fsy, "All") + "</select></label>" +
        '<label>Strand or program<select onchange="S.fpr=this.value;render()">' + opts(uniq("prog"), S.fpr, "All") + "</select></label>" +
        '<label>Grade or year<select onchange="S.fgr=this.value;render()">' + opts(uniq("grade"), S.fgr, "All") + "</select></label>" +
        '<label>Section<select onchange="S.fsc=this.value;render()">' + opts(uniq("sec"), S.fsc, "All") + "</select></label>" +
        '<label>Sort by<select onchange="S.sort=this.value;render()"><option value="date"' + (S.sort === "date" ? " selected" : "") + '>Newest first</option><option value="name"' + (S.sort === "name" ? " selected" : "") + ">Student name</option></select></label></div>" +
        '<div class="tw"><table><tr><th>Date</th><th>Student</th><th>Class</th><th>Vitals</th><th>Complaint and care</th><th></th></tr>' +
        (list.map(function (x) { return "<tr><td>" + esc(x.date) + "<br><span class=mu>" + esc(x.time) + "</span></td><td>" + esc(x.student) + "<br><span class=mu>" + esc(x.hist || "") + "</span></td><td>" + esc(x.prog) + " · " + esc(x.grade) + "-" + esc(x.sec) + "<br><span class=mu>SY " + esc(x.sy) + "</span></td><td>" + esc(x.temp) + " °C<br>" + esc(x.bp) + "<br>" + esc(x.pulse) + " bpm</td><td><b>" + esc(x.cc) + "</b><br>" + esc(x.iv) + "<br><span class=mu>Teaching: " + esc(x.ht) + (x.item ? "<br>Used: " + esc(x.item) + " × " + x.q : "") + '</span></td><td><button class="s" onclick="mkCode(' + x.id + ')">One-time code</button> <button class="s d" onclick="delVisit(' + x.id + ')">Delete</button></td></tr>' }).join("") || '<tr><td colspan="6" class="mu">No matching records.</td></tr>') + "</table></div></div>"
}
function keep(id) { render(); var e = $(id); if (e) { e.focus(); var n = e.value.length; e.setSelectionRange(n, n) } }
function visitForm() {
    var items = db.inv.map(function (i) { return "<option value='" + i.id + "'>" + esc(i.name) + " (" + i.qty + " left)</option>" }).join("");
    return '<h3>New clinic visit</h3><div class="fg"><label>Student name<input id="f_s"></label><label>School year<input id="f_sy" value="2026-2027"></label>' +
        '<label>Strand or program<select id="f_p">' + PROG.map(function (p) { return "<option>" + p + "</option>" }).join("") + '</select></label><label>Grade or year level<input id="f_g" placeholder="e.g. 11 or 2nd Year"></label><label>Section<input id="f_c"></label>' +
        '<label>Temperature (°C)<input id="f_t" type="number" step="0.1"></label><label>Blood pressure<input id="f_b" placeholder="120/80"></label><label>Pulse (bpm)<input id="f_pu" type="number"></label>' +
        '<label>Known conditions or allergies<input id="f_h"></label><label>Chief complaint<input id="f_cc"></label><label>Intervention<input id="f_iv"></label><label>Health teaching<input id="f_ht"></label>' +
        '<label>Supply used (optional)<select id="f_i"><option value="">None</option>' + items + '</select></label><label>Quantity used<input id="f_q" type="number" min="1" value="1"></label></div>' +
        '<div class="bar"><button class="p" onclick="addVisit()">Save visit</button><button onclick="S.edit=null;render()">Cancel</button></div>'
}
function addVisit() {
    var s = v("f_s"), cc = v("f_cc"), g = v("f_g"), c = v("f_c");
    if (!s || !cc || !g || !c) { alert("Please fill in the student name, grade or year, section, and chief complaint."); return }
    var iid = +v("f_i"), q = Math.max(1, +v("f_q") || 1), nm = "", it = db.inv.filter(function (i) { return i.id === iid })[0];
    if (it) { if (it.qty < q) { alert("Not enough stock: only " + it.qty + " " + it.unit + " of " + it.name + " left."); return } it.qty -= q; nm = it.name }
    var d = new Date();
    db.visits.push({ id: db.seq++, date: today(), time: ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2), student: s, sy: v("f_sy"), prog: v("f_p"), grade: g, sec: c, temp: v("f_t"), bp: v("f_b"), pulse: v("f_pu"), cc: cc, iv: v("f_iv"), ht: v("f_ht"), item: nm, q: nm ? q : 0, hist: v("f_h") });
    save(); S.edit = null; S.msg = "Visit saved."; render()
}
function delVisit(id) { if (confirm("Delete this visit record?")) { db.visits = db.visits.filter(function (x) { return x.id !== id }); db.codes = db.codes.filter(function (c) { return c.vid !== id }); save(); render() } }
function mkCode(id) {
    var c = String(Math.floor(100000 + Math.random() * 900000)); db.codes.push({ code: c, vid: id, used: false, made: today() }); save();
    var x = db.visits.filter(function (y) { return y.id === id })[0]; S.msg = "One-time guardian code for <b>" + esc(x.student) + "</b>: <b>" + c + "</b>. It works once, then expires."; render()
}

function inv() {
    var f = S.edit === "item" ?
        '<h3>Add item</h3><div class="fg"><label>Name<input id="i_n"></label><label>Category<select id="i_c"><option>Medicine</option><option>Supply</option></select></label><label>Quantity<input id="i_q" type="number" min="0"></label><label>Unit<input id="i_u" placeholder="tablets, boxes"></label><label>Minimum level<input id="i_m" type="number" min="0" value="10"></label><label>Expiry date<input id="i_e" type="date"></label></div><div class="bar"><button class="p" onclick="addItem()">Save item</button><button onclick="S.edit=null;render()">Cancel</button></div>' :
        '<button class="p" onclick="S.edit=\'item\';render()">+ Add item</button>';
    var rows = db.inv.slice().sort(function (a, b) { return a.exp.localeCompare(b.exp) }).map(function (i) { return "<tr><td>" + esc(i.name) + "<br><span class=mu>" + esc(i.cat) + "</span></td><td><b>" + i.qty + "</b> " + esc(i.unit) + "<br><span class=mu>min " + i.min + "</span></td><td>" + esc(i.exp) + "</td><td>" + flags(i) + '</td><td><button class="s" onclick="adj(' + i.id + ',-1)">Use</button> <button class="s" onclick="adj(' + i.id + ',1)">Restock</button> <button class="s d" onclick="delItem(' + i.id + ')">Remove</button></td></tr>' }).join("");
    return '<h2>Medical inventory</h2><div class="card">' + f + '</div><div class="card"><div class="tw"><table><tr><th>Item</th><th>Stock</th><th>Expiry</th><th>Status</th><th></th></tr>' + (rows || '<tr><td colspan="5" class="mu">No items.</td></tr>') + "</table></div><p class=note>Sorted by earliest expiry. Quantities are updated manually by clinic personnel.</p></div>"
}
function addItem() {
    var n = v("i_n"), e = v("i_e"); if (!n || !e || v("i_q") === "") { alert("Please enter the item name, quantity, and expiry date."); return }
    db.inv.push({ id: db.seq++, name: n, cat: v("i_c"), qty: Math.max(0, +v("i_q")), unit: v("i_u") || "pcs", min: Math.max(0, +v("i_m") || 0), exp: e }); save(); S.edit = null; render()
}
function adj(id, s) {
    var it = db.inv.filter(function (i) { return i.id === id })[0], n = prompt((s < 0 ? "Quantity used" : "Quantity added") + " for " + it.name + ":", "1"); n = Math.floor(+n);
    if (!n || n < 1) return; if (s < 0 && n > it.qty) { alert("Only " + it.qty + " in stock."); return } it.qty += s * n; save(); render()
}
function delItem(id) { if (confirm("Remove this item?")) { db.inv = db.inv.filter(function (i) { return i.id !== id }); save(); render() } }

function gen() { var c, t; do { c = String(Math.floor(100000 + Math.random() * 900000)); t = db.codes.concat(db.scodes).some(function (x) { return x.code === c }) } while (t); return c }
function settings() {
    var rows = db.scodes.slice().reverse().map(function (c) { return "<tr><td>" + c.code + "</td><td>" + esc(USERS[c.role].r) + "</td><td>" + esc(c.label || "") + "</td><td>" + esc(c.made) + '</td><td><span class="tag ' + (c.used ? "bad" : "good") + '">' + (c.used ? "Used" : "Active") + "</span></td></tr>" }).join("");
    return '<h2>Settings</h2><div class="card"><h3>One-time access codes for staff</h3><p class="note">Principal, Teacher and Administrator sign in with a one-time code. Each code works once, then expires.</p><div class="fg"><label>Role<select id="sc_r"><option value="principal">Principal</option><option value="teacher">Teacher</option><option value="admin">Administrator</option></select></label><label>Person (optional)<input id="sc_l" placeholder="Name"></label></div><button class="p" onclick="mkStaff()">Generate code</button><div class="tw" style="margin-top:12px"><table><tr><th>Code</th><th>Role</th><th>Person</th><th>Created</th><th>Status</th></tr>' + (rows || '<tr><td colspan="5" class="mu">No codes yet.</td></tr>') + '</table></div></div>' +
        '<div class="card"><h3>Change Clinic Head PIN</h3><p class="note">The Clinic Head is the only role with a fixed PIN. Use 4 to 8 digits.</p><div class="fg"><label>Current PIN<input id="np_cur" type="password" inputmode="numeric" autocomplete="off"></label><label>New PIN<input id="np_new" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></label><label>Confirm new PIN<input id="np_con" type="password" inputmode="numeric" maxlength="8" autocomplete="off"></label></div><button class="p" onclick="savePins()">Save PIN</button></div>'
}
function mkStaff() {
    var r = v("sc_r"), l = v("sc_l"), c = gen(); db.scodes.push({ code: c, role: r, label: l, used: false, made: today() }); save();
    S.msg = "One-time code for <b>" + esc(USERS[r].r) + (l ? " (" + esc(l) + ")" : "") + "</b>: <b>" + c + "</b>. It works once, then expires."; render()
}
function savePins() {
    var n = v("np_new");
    if (v("np_cur") !== db.pins.head) { alert("Your current PIN is incorrect."); return }
    if (!/^\d{4,8}$/.test(n)) { alert("The new PIN must be 4 to 8 digits."); return }
    if (n !== v("np_con")) { alert("The new PINs do not match."); return }
    db.pins.head = n; save(); S.msg = "Clinic Head PIN updated."; render()
}
function access() {
    var M = [["Clinic Head", "Fixed PIN", "Full", "Full", "Manage"], ["Principal", "One-time code", "Verification only", "None", "None"], ["Teacher", "One-time code", "Verification only", "None", "None"], ["Administrator", "One-time code", "Verification only", "None", "None"], ["Guardian", "One-time code", "One-time, limited", "None", "None"]];
    var rows = db.codes.slice().reverse().map(function (c) { var x = db.visits.filter(function (y) { return y.id === c.vid })[0]; return "<tr><td>" + c.code + "</td><td>" + esc(x ? x.student : "(deleted)") + "</td><td>" + esc(c.made) + '</td><td><span class="tag ' + (c.used ? "bad" : "good") + '">' + (c.used ? "Used" : "Active") + "</span></td></tr>" }).join("");
    return '<h2>Access control</h2><div class="card"><div class="tw"><table><tr><th>Role</th><th>Sign-in</th><th>Medical records</th><th>Inventory</th><th>Manage codes</th></tr>' + M.map(function (r) { return "<tr><td>" + r.join("</td><td>") + "</td></tr>" }).join("") + '</table></div></div><div class="card"><h3>Guardian one-time codes</h3><div class="tw"><table><tr><th>Code</th><th>Student</th><th>Created</th><th>Status</th></tr>' + (rows || '<tr><td colspan="4" class="mu">No codes yet. Create one from the Clinic visits page.</td></tr>') + "</table></div></div>"
}

function ver() {
    var q = S.q.toLowerCase(), list = db.visits.filter(function (x) { return !q || x.student.toLowerCase().indexOf(q) > -1 }).sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time) });
    return '<h2>Clinic visit verification</h2><p class="note">You can confirm that a student visited the clinic. Medical details are hidden for your role.</p><div class="card"><label>Search student<input id="fq" value="' + esc(S.q) + '" oninput="S.q=this.value;keep(\'fq\')"></label><br><div class="tw"><table><tr><th>Student</th><th>Class</th><th>Date</th><th>Time</th><th>Status</th></tr>' +
        (list.map(function (x) { return "<tr><td>" + esc(x.student) + "</td><td>" + esc(x.prog) + " · " + esc(x.grade) + "-" + esc(x.sec) + "</td><td>" + esc(x.date) + "</td><td>" + esc(x.time) + '</td><td><span class="tag good">Verified clinic visit</span></td></tr>' }).join("") || '<tr><td colspan="5" class="mu">No records.</td></tr>') + "</table></div></div>"
}

function gd() { var out = S.gres || ""; return '<h2>Guardian access</h2><div class="card"><p class="note">Enter the one-time code from the clinic. It can be used once.</p><div class="bar"><input id="gc" inputmode="numeric" placeholder="6-digit code"><button class="p" onclick="useCode()">View record</button></div></div>' + out }
function redeem(c) {
    var k = db.codes.filter(function (x) { return x.code === c })[0];
    if (!k) return { ok: false, m: "Invalid code.", html: '<div class="card bad">Invalid code.</div>' };
    if (k.used) return { ok: false, m: "This code has already been used.", html: '<div class="card bad">This code has already been used.</div>' };
    var x = db.visits.filter(function (y) { return y.id === k.vid })[0]; k.used = true; save();
    return { ok: true, html: x ? '<div class="card"><h3>Visit record (one-time view)</h3><p><b>' + esc(x.student) + "</b><br>" + esc(x.date) + " at " + esc(x.time) + "<br>Complaint: " + esc(x.cc) + "<br>Care given: " + esc(x.iv) + "<br>Health teaching: " + esc(x.ht) + '</p><p class="note">This code is now expired.</p></div>' : '<div class="card bad">Record no longer exists.</div>' }
}
function useCode() { S.gres = redeem(v("gc")).html; render() }

render();
