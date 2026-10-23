const BANK = [
  {q:"Which HTML tag creates the largest heading?", o:["<h1>","<h6>","<head>","<header>"], a:0},
  {q:"Which CSS property changes the colour of text?", o:["color","font-color","text-style","foreground"], a:0},
  {q:"Which method selects an element by its id in JavaScript?", o:["document.getElementById()","document.queryId()","document.selectId()","getElement()"], a:0},
  {q:"Which Bootstrap class makes a responsive fixed-width container?", o:[".container",".box",".wrapper",".fixed"], a:0},
  {q:"What does 'display: flex' create in CSS?", o:["A flexible box layout","A data table","A popup window","An image gallery"], a:0},
  {q:"Which keyword declares a block-scoped variable you can reassign?", o:["let","var","const","def"], a:0},
  {q:"Which meta tag helps a page fit mobile screens?", o:["viewport","charset","author","robots"], a:0},
  {q:"Which symbol selects a class in CSS?", o:[".","#","*","&"], a:0},
  {q:"Which JavaScript event fires when a button is clicked?", o:["click","press","tap","hit"], a:0},
  {q:"How many columns does the Bootstrap grid have per row?", o:["12","10","16","24"], a:0}
];
const N = 5, TIME = 20;
const $ = id => document.getElementById(id);
let qs, i, res, pick, left, tick, locked;

const shuffle = a => { for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
const show = v => ["start","quiz","result"].forEach(s => $(s).classList.toggle("d-none", s !== v));

/* ---------- Theme ---------- */
function setTheme(t) {
  document.documentElement.setAttribute("data-bs-theme", t);
  $("theme").textContent = t === "dark" ? "☀️ Light" : "🌙 Dark";
  try { localStorage.setItem("theme", t); } catch (e) {}
}
$("theme").onclick = () => setTheme(document.documentElement.dataset.bsTheme === "dark" ? "light" : "dark");
try { setTheme(localStorage.getItem("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")); } catch (e) {}

/* ---------- Quiz flow ---------- */
function start() {
  // Pick 5 random questions and shuffle the options of each
  qs = shuffle([...BANK]).slice(0, N).map(x => ({
    q: x.q, opts: shuffle(x.o.map((t, k) => ({ t, c: k === x.a })))
  }));
  i = 0; res = Array(N).fill(null); pick = Array(N).fill(-1);
  show("quiz"); load();
}

function drawBar(el) {
  el.innerHTML = qs.map((_, k) => `<span class="seg ${res[k] || (k === i && !$("result").offsetParent ? "now" : "")}"></span>`).join("");
}

function load() {
  locked = false;
  const q = qs[i];
  $("count").textContent = `Question ${i + 1} of ${N}`;
  $("qtext").textContent = q.q;
  $("fb").textContent = ""; $("next").classList.add("d-none");
  $("opts").innerHTML = q.opts.map((o, k) =>
    `<button class="opt" data-k="${k}"><span class="tag">${"ABCD"[k]}</span>${o.t.replace(/</g,"&lt;")}</button>`).join("");
  drawBar($("bar"));
  left = TIME; paintTimer();
  clearInterval(tick);
  tick = setInterval(() => { left--; paintTimer(); if (left <= 0) answer(-1); }, 1000);
}

function paintTimer() {
  $("time").textContent = `⏱ ${left}s`;
  $("tfill").style.width = (left / TIME * 100) + "%";
  $("tfill").classList.toggle("low", left <= 5);
}

function answer(k) {
  if (locked) return;
  locked = true; clearInterval(tick);
  const q = qs[i];
  pick[i] = k;
  res[i] = k < 0 ? "time" : q.opts[k].c ? "ok" : "bad";
  document.querySelectorAll(".opt").forEach((b, n) => {
    b.disabled = true;
    if (q.opts[n].c) b.classList.add("correct");
    else if (n === k) b.classList.add("wrong");
  });
  $("fb").textContent = res[i] === "ok" ? "✅ Correct!" : res[i] === "bad" ? "❌ Wrong. The right answer is highlighted." : "⏰ Time is up. The right answer is highlighted.";
  drawBar($("bar"));
  $("next").textContent = i === N - 1 ? "See results" : "Next question";
  $("next").classList.remove("d-none");
}

function finish() {
  show("result");
  const s = res.filter(r => r === "ok").length;
  $("score").textContent = `${s} / ${N}`;
  $("msg").textContent = s === N ? "Perfect score. Great work!" : s >= 3 ? "Good job. Keep practising." : "Keep learning. Try again!";
  drawBar($("bar2"));
  $("review").innerHTML = qs.map((q, k) => {
    const right = q.opts.find(o => o.c).t.replace(/</g, "&lt;");
    const icon = res[k] === "ok" ? "✅" : res[k] === "bad" ? "❌" : "⏰";
    return `<li class="list-group-item px-0">${icon} <strong>Q${k + 1}.</strong> ${q.q.replace(/</g,"&lt;")}<br>
      <small class="text-secondary">Answer: ${right}</small></li>`;
  }).join("");
}

/* ---------- PDF download ---------- */
function downloadPDF() {
  const { jsPDF } = window.jspdf, d = new jsPDF();
  const s = res.filter(r => r === "ok").length;
  let y = 20;
  d.setFontSize(18); d.text("Web Tech Quiz - Results", 15, y); y += 10;
  d.setFontSize(12); d.text(`Score: ${s} / ${N}   Date: ${new Date().toLocaleString()}`, 15, y); y += 12;
  qs.forEach((q, k) => {
    const status = res[k] === "ok" ? "Correct" : res[k] === "bad" ? "Wrong" : "Time out";
    const your = pick[k] >= 0 ? q.opts[pick[k]].t : "No answer";
    const lines = d.splitTextToSize(`Q${k + 1}. ${q.q}`, 175);
    if (y + lines.length * 6 + 24 > 280) { d.addPage(); y = 20; }
    d.setFont(undefined, "bold"); d.text(lines, 15, y); y += lines.length * 6;
    d.setFont(undefined, "normal");
    d.text(`Your answer: ${your}`, 15, y); y += 6;
    d.text(`Correct answer: ${q.opts.find(o => o.c).t}`, 15, y); y += 6;
    d.text(`Result: ${status}`, 15, y); y += 12;
  });
  d.save("quiz-results.pdf");
}

$("go").onclick = start;
$("again").onclick = start;
$("pdf").onclick = downloadPDF;
$("next").onclick = () => (++i < N ? load() : finish());
$("opts").onclick = e => { const b = e.target.closest(".opt"); if (b) answer(+b.dataset.k); };
