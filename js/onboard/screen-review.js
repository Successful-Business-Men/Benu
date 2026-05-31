/* ---------- SCREEN 4: REVIEW ---------- */
function findingRow(g,i){
  var k=g.id+i,it=g.items[i],st=state.review.states[k],val=state.review.vals[k],editing=state.review.editing===k;
  var left=editing
    ?`<div class="row gap-2 wrap" style="font-size:14.5px"><span style="color:var(--soft);text-decoration:line-through">${it.from}</span>${icon("arrowR",{size:14,color:"var(--soft)"})}<input data-model="review.editVal" data-enter="rsave" data-k="${k}" data-autofocus value="${val}" style="border:1px solid var(--mint-500);border-radius:8px;padding:6px 10px;font-size:14.5px;font-weight:600;font-family:var(--sans);color:var(--mint-900);outline:none;min-width:180px"/></div>`
    :`<div class="row gap-2 wrap" style="font-size:14.5px">${st==="approved"?icon("check",{size:16,color:"var(--ok)",stroke:2.6,style:"flex-shrink:0"}):""}<span style="color:var(--soft);text-decoration:line-through">${it.from}</span>${icon("arrowR",{size:14,color:"var(--soft)"})}<span style="font-weight:600;color:${st==="rejected"?"var(--muted)":"var(--mint-900)"}">${val}</span></div>`;
  var right;
  if(editing){right=`<div class="row gap-2"><button class="btn btn-secondary btn-sm" data-act="rcancel" data-k="${k}">Cancel</button><button class="btn btn-primary btn-sm" data-act="rsave" data-k="${k}">${icon("check",{size:14,color:"#fff",stroke:2.4})} Save</button></div>`;}
  else if(st==="approved"){right=`<button class="iconbtn iconbtn-mini row-edit" data-act="redit" data-k="${k}" title="Edit" style="background:transparent;border:none">${icon("edit",{size:15,color:"var(--soft)"})}</button>`;}
  else if(st==="rejected"){right=`<button class="btn btn-ghost btn-sm" data-act="rset" data-k="${k}" data-v="">${icon("refresh",{size:14})} Undo</button>`;}
  else{right=`<div class="row gap-2" style="align-items:center"><button class="iconbtn iconbtn-mini" data-act="rset" data-k="${k}" data-v="rejected" title="Not this one" style="background:transparent">${icon("x",{size:15,color:"var(--muted)"})}</button><button class="iconbtn iconbtn-mini" data-act="redit" data-k="${k}" title="Edit" style="background:transparent">${icon("edit",{size:14,color:"var(--muted)"})}</button><button class="btn btn-soft btn-sm" data-act="rset" data-k="${k}" data-v="approved">${icon("check",{size:14,color:"var(--mint-900)",stroke:2.4})} Approve</button></div>`;}
  var bg=st==="approved"?"var(--mint-50)":st==="rejected"?"var(--bg)":"var(--surface)";
  return `<div class="frow row gap-4" style="padding:12px 14px;border-radius:12px;align-items:center;background:${bg};border:${editing?"1px solid var(--mint-500)":"1px solid var(--border)"};opacity:${st==="rejected"?0.6:1};transition:all .15s"><div class="grow" style="min-width:0"><div class="metalabel" style="margin-bottom:4px">${it.ctx}${it.conf?" · "+it.conf:""}</div>${left}</div><div style="flex-shrink:0">${right}</div></div>`;
}
function viewReview(){
  var total=Object.keys(state.review.states).length;
  var resolved=Object.values(state.review.states).filter(function(v){return v;}).length;
  var tiers=TONE_TIERS.map(function(tier){
    var groups=FINDING_GROUPS.filter(function(g){return g.tone===tier.tone;});
    if(!groups.length)return "";
    var keys=[];groups.forEach(function(g){g.items.forEach(function(_,i){keys.push(g.id+i);});});
    var tierTotal=keys.length;
    var tierDone=keys.filter(function(k){return state.review.states[k];}).length;
    var allApproved=keys.every(function(k){return state.review.states[k]==="approved";});
    var multi=groups.length>1;
    var body=groups.map(function(g){
      var rows=g.items.map(function(_,i){return findingRow(g,i);}).join("");
      var sub=multi?`<div class="row gap-2 wrap" style="align-items:baseline;margin:0 2px 10px"><span class="metalabel" style="color:var(--muted)">${g.title}</span><span style="font-size:12.5px;color:var(--soft)">${g.blurb}</span></div>`:"";
      return `<div>${sub}<div class="col gap-2">${rows}</div></div>`;
    }).join(`<div style="height:18px"></div>`);
    var control=tier.tone==="safe"
      ?(allApproved
        ?`<span class="st st-ok" style="font-size:11px;padding:7px 12px">${icon("check",{size:12,stroke:2.6})} ${tierDone}/${tierTotal} Done</span>`
        :`<button class="btn btn-soft btn-sm" data-act="approveSafe">${icon("sparkle",{size:15,color:"var(--mint-900)"})} Approve All ${tierTotal}</button>`)
      :`<span class="metalabel" style="color:var(--muted)">${tierDone}/${tierTotal} reviewed</span>`;
    return `<div class="card" style="padding:0;overflow:hidden;position:relative"><div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${tier.accent}"></div><div class="row spread" style="padding:18px 22px 18px 26px;border-bottom:1px solid var(--border);background:var(--raised);gap:16px;flex-wrap:wrap"><div class="row gap-3" style="min-width:0"><div style="width:52px;height:52px;border-radius:14px;flex-shrink:0;background:${tier.iconBg};display:grid;place-items:center">${icon(tier.icon,{size:28,color:tier.accent})}</div><div style="min-width:0"><div style="font-size:19px;font-weight:600">${tier.title}</div><div style="font-size:13.5px;color:var(--muted);margin-top:2px">${tier.lead}</div></div></div><div style="flex-shrink:0">${control}</div></div><div style="padding:18px 22px 20px">${body}</div></div>`;
  }).join("");
  var inner=`${pageHead({title:"A Few Things To <em>Check</em>",sub:"Benu read all 64 of your items beautifully. We’ve sorted what’s left into three groups, so you can see at a glance what Benu can handle and what needs your eyes."})}<div class="col gap-5">${tiers}</div>`;
  var foot=`<button class="btn btn-secondary" data-act="back">${icon("arrowL",{size:18})} Back</button><div class="row gap-4"><div class="row gap-2"><div style="width:120px;height:6px;border-radius:9px;background:var(--outer);overflow:hidden"><div style="height:100%;width:${total?(resolved/total*100):0}%;background:var(--mint-600);transition:width .3s"></div></div><span class="metalabel" style="color:var(--muted)">${resolved}/${total} reviewed</span></div><button class="btn btn-primary btn-lg" data-act="next">${resolved===total?"All clear, continue":"Continue"} ${icon("arrowR",{size:18,color:"#fff"})}</button></div>`;
  return screenWrap(inner)+footerBar(foot);
}
