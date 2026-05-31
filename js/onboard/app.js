/* ---------- ROUTER / RENDER ---------- */
var VIEWS=[viewImport,viewBuild,viewGenerate,viewReview,viewPhotos,viewCatering,viewLocations,viewTemplates,viewPublish,viewAllergy];
function render(){
  var prevMain=document.querySelector("main");var sc=prevMain?prevMain.scrollTop:0;
  var view=(VIEWS[state.screen]||viewImport)();
  document.getElementById("app").innerHTML=`<div style="display:flex;flex-direction:column;height:100vh">${topBar()}${view}</div>`;
  var nowMain=document.querySelector("main");if(nowMain)nowMain.scrollTop=sc;
  var af=document.querySelector("[data-autofocus]");if(af){af.focus();try{af.setSelectionRange(af.value.length,af.value.length);}catch(e){}}
}
function go(n){n=Math.max(0,Math.min(9,n));state.screen=n;localStorage.setItem("benu_screen",String(n));if(n===2)startGen();render();var m=document.querySelector("main");if(m)m.scrollTop=0;}
function next(){go(state.screen+1);}
function back(){go(state.screen-1);}

function startGen(){state.gen={active:0,done:false};scheduleGenTick();}
function scheduleGenTick(){if(state.screen!==2)return;var delay=state.gen.active===0?900:1500;setTimeout(function(){if(state.screen!==2)return;state.gen.active++;if(state.gen.active>=GEN_STEPS.length){state.gen.done=true;render();return;}render();scheduleGenTick();},delay);}

/* ---------- EVENTS ---------- */
var app=document.getElementById("app");
app.addEventListener("click",function(e){
  var t=e.target.closest("[data-act]");if(!t)return;
  var act=t.dataset.act,id=t.dataset.id,k=t.dataset.k;
  if(act==="next"){next();return;}
  if(act==="back"){back();return;}
  if(act==="jump"){go(parseInt(t.dataset.i,10));return;}
  if(act==="later"){go(9);return;}
  if(act==="toPublish"){go(8);return;}
  if(act==="rmfile"){state.import.files.splice(parseInt(t.dataset.i,10),1);render();return;}
  if(act==="rmlogo"){if(state.import.logo&&state.import.logo.url)URL.revokeObjectURL(state.import.logo.url);state.import.logo=null;render();return;}
  if(act==="mod"){state.build.sel[id]=!state.build.sel[id];render();return;}
  if(act==="selall"){var all=Object.values(state.build.sel).filter(Boolean).length===MODULES.length;var v=!all;MODULES.forEach(function(m){state.build.sel[m.id]=v;});render();return;}
  if(act==="bump"){var area=t.dataset.area,d=parseInt(t.dataset.d,10);state.build.areas[area]=Math.max(0,Math.min(60,state.build.areas[area]+d));render();return;}
  if(act==="photoUpload"){state.photos.uploaded=true;render();return;}
  if(act==="photoMissing"){state.photos.showMissing=!state.photos.showMissing;render();return;}
  if(act==="approveSafe"){FINDING_GROUPS.filter(function(g){return g.tone==="safe";}).forEach(function(g){g.items.forEach(function(_,i){state.review.states[g.id+i]="approved";});});render();return;}
  if(act==="rset"){state.review.states[k]=t.dataset.v||null;render();return;}
  if(act==="redit"){state.review.editing=k;state.review.editVal=state.review.vals[k];render();return;}
  if(act==="rsave"){state.review.vals[k]=state.review.editVal;state.review.states[k]="approved";state.review.editing=null;render();return;}
  if(act==="rcancel"){state.review.editing=null;render();return;}
  if(act==="cconfirm"){state.catering.confirmed[id]=!state.catering.confirmed[id];render();return;}
  if(act==="lsame"){state.loc.sameAs[id]=!state.loc.sameAs[id];render();return;}
  if(act==="tchoose"){state.tpl.chosen=id;render();return;}
  if(act==="tfocus"){state.tpl.focus=id;render();return;}
  if(act==="tclose"){state.tpl.focus=null;render();return;}
  if(act==="tuse"){state.tpl.chosen=id;state.tpl.focus=null;render();return;}
  if(act==="pcheck"){state.publish.checks[id]=!state.publish.checks[id];render();return;}
  if(act==="publish"){state.publish.published=true;render();return;}
  if(act==="averify"){state.allergy.items[parseInt(t.dataset.i,10)].state="verified";render();return;}
  if(act==="aunverify"){state.allergy.items[parseInt(t.dataset.i,10)].state="review";render();return;}
});
app.addEventListener("input",function(e){
  var t=e.target.closest("[data-model]");if(t){setModel(t.dataset.model,t.value);}
});
app.addEventListener("keydown",function(e){
  if(e.key==="Enter"){var t=e.target.closest("[data-enter]");if(t){e.preventDefault();var k=t.dataset.k;state.review.vals[k]=state.review.editVal;state.review.states[k]="approved";state.review.editing=null;render();}}
});
app.addEventListener("change",function(e){var t=e.target;if(t.id==="pdf-input"){handlePdfFiles(t.files);}else if(t.id==="logo-input"){handleLogoFile(t.files&&t.files[0]);}});
app.addEventListener("dragover",function(e){if(e.target.closest&&e.target.closest("#dropzone")){e.preventDefault();}});
app.addEventListener("drop",function(e){var dz=e.target.closest&&e.target.closest("#dropzone");if(dz){e.preventDefault();handlePdfFiles(e.dataTransfer.files);}});

function formatSize(bytes){if(bytes>=1048576)return (bytes/1048576).toFixed(1)+" MB";if(bytes>=1024)return Math.round(bytes/1024)+" KB";return bytes+" B";}
function handlePdfFiles(fileList){if(!fileList||!fileList.length)return;Array.prototype.forEach.call(fileList,function(file){state.import.files.push({name:file.name,size:formatSize(file.size),type:file.type,url:URL.createObjectURL(file)});});render();}
function handleLogoFile(file){if(!file)return;if(state.import.logo&&state.import.logo.url)URL.revokeObjectURL(state.import.logo.url);state.import.logo={name:file.name,url:URL.createObjectURL(file)};render();}

/* ---------- BOOT ---------- */
initState();
render();
if(state.screen===2)startGen();
