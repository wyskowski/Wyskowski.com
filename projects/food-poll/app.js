/* =======================
   SUPABASE-CONNECTED POLL
   ======================= */

const SUPABASE_URL  = "https://dxgcmggkthoziykzqhct.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Z2NtZ2drdGhveml5a3pxaGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NTA4NDUsImV4cCI6MjA3MzAyNjg0NX0.MmMDnKLxULZi4kbZuIvHqsQdtaMbOHYfa8SQQCutrys";
const POLL_SLUG = "favorite-food";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// UI
const optionButtons = document.getElementById("optionButtons");
const leaderBadge = document.getElementById("leaderBadge");
const leaderText  = document.getElementById("leaderText");
const voteStatus  = document.getElementById("voteStatus");
const totalVotes  = document.getElementById("totalVotes");
const clearBtn    = document.getElementById("clearVoteBtn");
const shareLink   = document.getElementById("shareLink");
const legendEl    = document.getElementById("legend");

// Palette that matches your dark theme
const PALETTE = ["#60A5FA","#F472B6","#F59E0B","#22C55E","#A78BFA","#38BDF8","#9CA3AF"];

/* ---------- Stable anonymous voter id ---------- */
function getClientId(){
  let id = localStorage.getItem("rw_client_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("rw_client_id", id); }
  return id;
}
async function sha256(s){
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function voterHashForPoll(slug){ return sha256(getClientId() + "::" + slug); }

/* ---------- Data access ---------- */
async function fetchPollAndOptions() {
  const { data: poll, error: e1 } = await sb.from("polls").select("*").eq("slug", POLL_SLUG).single();
  if (e1) throw e1;
  const { data: opts, error: e2 } = await sb.from("options").select("id,label").eq("poll_id", poll.id).order("label");
  if (e2) throw e2;
  return { poll, options: opts };
}
async function fetchResults(pollId) {
  const { data, error } = await sb.from("poll_results").select("*").eq("poll_id", pollId);
  if (error) throw error;
  return data; // [{poll_id, option_id, label, votes}, ...]
}
async function castVote(pollId, optionId) {
  const voter_hash = await voterHashForPoll(POLL_SLUG);
  const { error } = await sb.from("votes").insert([{ poll_id: pollId, option_id: optionId, voter_hash }]);
  if (error) throw error; // duplicate vote blocked by RLS/unique index
}

/* ---------- UI: buttons ---------- */
function iconFor(label){
  const map = {Pizza:"🍕", Burgers:"🍔", Sushi:"🍣", Tacos:"🌮", Salad:"🥗", Pasta:"🍝", Other:"✨"};
  return map[label] || "✨";
}
function renderButtons(options){
  optionButtons.innerHTML = "";
  options.forEach(o=>{
    const b = document.createElement("button");
    b.className = "btnOpt";
    b.type = "button";
    b.setAttribute("aria-label", `Vote for ${o.label}`);
    b.innerHTML = `<span class="emoji">${iconFor(o.label)}</span><span>${o.label}</span>`;
    b.addEventListener("click", ()=> handleVoteRemote(o));
    optionButtons.appendChild(b);
  });
  // a11y: keyboard
  Array.from(document.querySelectorAll(".btnOpt")).forEach(b=>{
    b.setAttribute("tabindex","0");
    b.addEventListener("keydown", e=>{
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); b.click(); }
    });
  });
}

/* ---------- Chart ---------- */
const ctx = document.getElementById("foodChart").getContext("2d");
let chart;

const centerTotals = {
  id:"centerTotals",
  afterDraw(c){
    const ds = c.data.datasets[0];
    const tot = ds.data.reduce((a,b)=>a+b,0);
    const meta = c.getDatasetMeta(0).data[0];
    const x = meta?.x ?? c.width/2;
    const y = meta?.y ?? c.height/2;

    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue('--accent').trim() || '#11c87e';

    const g = c.ctx;
    g.save();
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "700 22px Inter, system-ui";
    g.fillStyle = primary;
    g.fillText(tot.toString(), x, y - 4);
    g.font = "600 11px Inter, system-ui";
    g.fillStyle = "#8aa19a";
    g.fillText("total", x, y + 14);
    g.restore();
  }
};

function initChart(labels, data){
  chart = new Chart(ctx, {
    type:"doughnut",
    data:{
      labels,
      datasets:[{
        data,
        backgroundColor: PALETTE.slice(0, labels.length),
        borderColor: "rgba(0,0,0,.35)",
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options:{
      maintainAspectRatio: false,  // use CSS container height
      cutout:"64%",
      radius:"86%",
      animation:{ duration:700, easing:"easeOutQuart" },
      plugins:{
        legend:{ display:false },
        tooltip:{ callbacks:{
          label: c => {
            const sum = data.reduce((a,b)=>a+b,0) || 1;
            const val = c.parsed;
            return ` ${c.label}: ${val} (${Math.round(val/sum*100)}%)`;
          }
        }},
      }
    },
    plugins:[centerTotals]
  });
}
function updateChart(labels, data){
  if (!chart) return initChart(labels, data);
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();
}

/* ---------- Legend & meta ---------- */
function renderLegend(labels, data){
  const total = data.reduce((a,b)=>a+b,0) || 1;
  const colors = chart?.data?.datasets?.[0]?.backgroundColor || [];
  legendEl.innerHTML = "";
  labels.forEach((label,i)=>{
    const pct = Math.round((data[i]/total)*100);
    const row = document.createElement("div");
    row.className = "legendItem";
    row.innerHTML = `
      <span class="swatch" style="background:${colors[i]||'#888'}"></span>
      <span>${label}<span class="sep">&nbsp;•&nbsp;</span><span class="pct">${pct}%</span></span>
    `;
    legendEl.appendChild(row);
  });
}
function updateMeta(labels, data){
  const total = data.reduce((a,b)=>a+b,0);
  totalVotes.textContent = `Total votes: ${total}`;

  const entries = labels.map((label,i)=>[label, data[i]]).sort((a,b)=>b[1]-a[1]);
  if (!entries.length || total===0){ leaderBadge.hidden = true; return; }
  const [k,v] = entries[0];
  const isUnique = entries.filter(e=>e[1]===v).length===1 && v>0;
  leaderBadge.hidden = !isUnique;
  if (isUnique) leaderText.textContent = `Top choice: ${k}`;
}

/* ---------- Vote flow ---------- */
function markVoted(label){
  Array.from(document.querySelectorAll(".btnOpt")).forEach(b=>{
    const l = b.textContent.trim();
    if (l.endsWith(label)) b.classList.add("is-selected");
    else b.classList.add("is-dim");
  });
}

async function handleVoteRemote(option){
  try {
    const { poll } = window.__POLL_STATE__;
    await castVote(poll.id, option.id);
    markVoted(option.label);
    voteStatus.textContent = `You voted: ${option.label}`;
    await refreshResults(); // realtime will also kick in

    const r = ctx.canvas.getBoundingClientRect();
    burst(r.left+r.width/2, r.top+r.height/2);
  } catch (e){
    alert("Looks like you already voted in this browser.");
  }
}

/* ---------- Load, refresh, realtime ---------- */
async function refreshResults(){
  const { poll, options } = window.__POLL_STATE__;
  const results = await fetchResults(poll.id);
  const byLabel = new Map(results.map(r=>[r.label, r.votes]));
  const labels = options.map(o=>o.label);
  const data = labels.map(l => byLabel.get(l) || 0);

  updateChart(labels, data);
  renderLegend(labels, data);
  updateMeta(labels, data);
}

function subscribeToResults(pollId){
  sb.channel('votes-feed')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'votes', filter:`poll_id=eq.${pollId}` }, refreshResults)
    .subscribe();
}

/* ---------- Confetti (light) ---------- */
const cnf = document.getElementById("confetti");
const g   = cnf.getContext("2d");
let bits=[], active=false;
function size(){ cnf.width=innerWidth; cnf.height=innerHeight; }
addEventListener("resize", size); size();
function burst(x,y){
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors=["#22c55e","#20e3b2","#86efac","#34d399","#06b6d4","#60a5fa"];
  for(let i=0;i<120;i++){
    bits.push({x,y, vx:(Math.random()-0.5)*6, vy:(Math.random()-0.8)*6-2, g:.08,
               s:Math.random()*4+2, c:colors[Math|Math.random()*colors.length], l:60+Math.random()*40});
  }
  if(!active){ active=true; requestAnimationFrame(step); }
}
function step(){
  g.clearRect(0,0,cnf.width,cnf.height);
  bits.forEach(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.l--;
    g.fillStyle=p.c; g.fillRect(p.x,p.y,p.s,p.s);
  });
  bits=bits.filter(p=>p.l>0 && p.y<cnf.height+8);
  if(bits.length) requestAnimationFrame(step); else active=false;
}

/* ---------- Clear (resets local identity only) ---------- */
clearBtn.addEventListener("click", () => {
  // Do NOT remove client id. Just reset visuals & messaging.
  voteStatus.textContent = "Your vote is recorded on this device.";
  document.querySelectorAll(".btnOpt").forEach(b => b.classList.remove("is-selected", "is-dim"));
});
/* ---------- Share ---------- */
shareLink.addEventListener("click", (e)=>{
  e.preventDefault();
  const data={ title:"Favorite Food Poll", text:"Cast your vote!", url:location.href };
  if (navigator.share) navigator.share(data).catch(()=>{});
  else { navigator.clipboard?.writeText(location.href); e.target.textContent="Link copied!"; setTimeout(()=>e.target.textContent="Share",1200); }
});

/* ---------- Boot ---------- */
(async function init(){
  const { poll, options } = await fetchPollAndOptions();
  window.__POLL_STATE__ = { poll, options };
  renderButtons(options);
  await refreshResults();
  subscribeToResults(poll.id);
})();
