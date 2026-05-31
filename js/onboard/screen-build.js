/* ---------- SCREEN 2: BUILD ---------- */
function viewBuild(){
  var sel=state.build.sel,areas=state.build.areas;
  var count=Object.values(sel).filter(Boolean).length;
  var all=count===MODULES.length;
  var mods=MODULES.map(function(m){var on=sel[m.id];return `<button data-act="mod" data-id="${m.id}" style="text-align:left;cursor:pointer;border-radius:var(--r-lg);padding:20px;border:${on?"2px solid var(--mint-600)":"1px solid var(--border)"};background:${on?"var(--mint-50)":"var(--surface)"};box-shadow:${on?"var(--shadow-md)":"var(--shadow-sm)"};transition:all .16s;position:relative;display:flex;gap:16px;align-items:flex-start"><div style="width:56px;height:56px;border-radius:14px;flex-shrink:0;background:${on?"var(--mint-900)":"var(--raised)"};display:grid;place-items:center;transition:all .16s">${icon(m.icon,{size:30,color:on?"#CBE0A8":"var(--mint-700)"})}</div><div class="grow"><div class="row gap-2" style="margin-bottom:5px"><span style="font-size:19px;font-weight:600">${m.name}</span></div><p style="margin:0;font-size:14px;color:var(--muted);line-height:1.5">${m.desc}</p></div></button>`;}).join("");
  var tablePanel="";
  if(sel.qr){
    var totalCodes=Object.values(areas).reduce(function(s,n){return s+n;},0);
    var areaRows=AREA_DEFS.map(function(def){
      var n=areas[def.key];
      return `<div style="background:var(--raised);border-radius:14px;padding:14px 16px"><div class="row spread" style="flex-wrap:wrap;gap:12px"><div class="row gap-3"><div style="width:34px;height:34px;border-radius:9px;background:var(--surface);border:1px solid var(--border);display:grid;place-items:center">${icon(def.icon,{size:17,color:"var(--mint-700)"})}</div><div><div style="font-size:19px;font-weight:600">${def.label}</div><div class="metalabel" style="color:var(--soft)">${n} ${n===1?def.unit.slice(0,-1):def.unit}</div></div></div><div class="row gap-3" style="flex-shrink:0"><button class="iconbtn" data-act="bump" data-area="${def.key}" data-d="-1">${icon("minus",{size:18,color:"var(--mint-700)"})}</button><div style="min-width:36px;text-align:center;font-family:var(--serif);font-size:26px;font-weight:600;line-height:46px">${n}</div><button class="iconbtn" data-act="bump" data-area="${def.key}" data-d="1">${icon("plus",{size:18,color:"var(--mint-700)"})}</button></div></div></div>`;
    }).join("");
    tablePanel=`<div class="card" style="padding:0;overflow:hidden;margin-top:20px;border-color:var(--mint-400)"><div class="row spread" style="padding:18px 22px;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:16px"><div class="row gap-3"><div style="width:42px;height:42px;border-radius:11px;background:var(--mint-900);display:grid;place-items:center;flex-shrink:0">${icon("qr",{size:22,color:"#CBE0A8"})}</div><div><div style="font-size:19px;font-weight:600">Set Up Your Tables And Seats</div><div style="font-size:13.5px;color:var(--muted);margin-top:2px">Add as many as you have in each area and we’ll print a ready to scan code for every one.</div></div></div><span class="chip" style="align-self:center">${icon("sparkle",{size:12,color:"var(--pill-text)"})} ${totalCodes} Codes Ready</span></div><div class="col gap-4" style="padding:20px 22px">${areaRows}</div></div>`;
  }
  var hp=state.build.homepage||{};
  var homePanel="";
  if(sel.home){
    var HQ=[
      {k:"started",label:"Where You Started",ph:"A family recipe from Lanzhou, opened on Nipomo St in 2025"},
      {k:"known",label:"What You Are Known For",ph:"Hand-pulled noodles and big-bone beef soup"},
      {k:"story",label:"Your Story",ph:"The heart of your restaurant, in a few sentences"},
      {k:"awards",label:"Awards Or Press (Optional)",ph:"Best Noodles, SLO 2025"}
    ];
    var hqFields=HQ.map(function(q){return `<div><div class="metalabel" style="color:var(--muted);margin-bottom:6px">${q.label}</div><textarea data-model="build.homepage.${q.k}" rows="2" placeholder="${q.ph}" style="width:100%;border:1px solid var(--border-strong);border-radius:10px;padding:10px 12px;font-size:14px;font-family:var(--sans);background:var(--surface);color:var(--text);resize:vertical;outline:none">${hp[q.k]||""}</textarea></div>`;}).join("");
    homePanel=`<div class="card" style="padding:0;overflow:hidden;margin-top:20px;border-color:var(--mint-400)"><div class="row gap-3" style="padding:18px 22px;border-bottom:1px solid var(--border)"><div style="width:42px;height:42px;border-radius:11px;background:var(--mint-900);display:grid;place-items:center;flex-shrink:0">${icon("home",{size:22,color:"#CBE0A8"})}</div><div><div style="font-size:19px;font-weight:600">Tell Us About Your Restaurant</div><div style="font-size:13.5px;color:var(--muted);margin-top:2px">No website yet? No problem. Answer a few prompts and Benu drafts your homepage from them. You approve every word.</div></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:20px 22px" class="mod-grid">${hqFields}</div></div>`;
  }
  var inner=`${pageHead({title:"What Should Benu <em>Build</em> For You",sub:"Tell us what you need today and add the rest whenever you like. The first two are ticked because most restaurants start there."})}<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px" class="mod-grid">${mods}</div>${homePanel}${tablePanel}<div style="margin-top:20px">${aiNote("Every one of these is built straight from your menu. Nothing goes public until you give it the thumbs up.","info")}</div>`;
  var foot=`<button class="btn btn-secondary" data-act="back">Back</button><button class="btn btn-primary btn-lg" ${count===0?"disabled":""} data-act="next">Build with Benu</button>`;
  return screenWrap(inner)+footerBar(foot);
}
