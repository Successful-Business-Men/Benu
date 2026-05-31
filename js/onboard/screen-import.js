/* ---------- SCREEN 1: IMPORT ---------- */
function viewImport(){
  var files=state.import.files.map(function(f,i){var isImg=(f.type||"").indexOf("image")===0||/\.(png|jpe?g|gif|webp|avif)$/i.test(f.name);var preview=f.url?(isImg?`<img src="${f.url}" alt="${f.name}" style="display:block;width:100%;height:220px;object-fit:contain;background:var(--surface);border:1px solid var(--border);border-radius:10px"/>`:`<embed src="${f.url}#toolbar=0&navpanes=0&view=FitH" type="application/pdf" style="display:block;width:100%;height:240px;background:var(--surface);border:1px solid var(--border);border-radius:10px"/>`):`<div style="display:flex;align-items:center;justify-content:center;height:120px;background:var(--surface);border:1px solid var(--border);border-radius:10px">${pdfTile(40)}</div>`;return `<div class="col gap-3" style="padding:12px;border-radius:12px;background:var(--raised)">${preview}<div class="row gap-3"><div class="grow" style="min-width:0"><div class="row spread"><span style="font-size:14px;font-weight:500;word-break:break-all">${f.name}</span><span style="font-size:12px;color:var(--soft);font-family:var(--mono);white-space:nowrap;margin-left:8px">${f.size}</span></div><div class="st st-ok" style="margin-top:6px">${icon("check",{size:11,stroke:2.6})} Uploaded</div></div><button class="iconbtn" data-act="rmfile" data-i="${i}" title="Remove" aria-label="Remove file">${icon("x",{size:16,color:"var(--muted)"})}</button></div></div>`;}).join("");
  var fileList=state.import.files.length?`<div class="col gap-2" style="margin-top:18px">${files}</div>`:"";
  var logoBlock=state.import.logo
    ?`<div class="col gap-3" style="background:var(--mint-50);border:1px solid var(--mint-200);border-radius:12px;padding:12px"><img src="${state.import.logo.url}" alt="Logo preview" style="display:block;width:100%;height:160px;object-fit:contain;border-radius:9px;background:var(--surface);border:1px solid var(--border)"/><div class="row spread" style="min-width:0"><div style="min-width:0"><div style="font-size:13.5px;font-weight:500;word-break:break-all">${state.import.logo.name}</div><div class="metalabel">Uploaded</div></div><button class="iconbtn" data-act="rmlogo" title="Remove logo" aria-label="Remove logo">${icon("x",{size:16,color:"var(--muted)"})}</button></div></div>`
    :`<label style="position:relative;width:100%;border:2px dashed var(--border-strong);background:var(--cream);border-radius:12px;padding:16px;cursor:pointer;color:var(--muted);font-size:13.5px;display:flex;gap:8px;justify-content:center;align-items:center">${icon("upload",{size:16})} Upload logo<input id="logo-input" type="file" accept="image/*" style="position:absolute;width:1px;height:1px;opacity:0"/></label>`;
  var n=state.import.files.length;
  var statusChips=n
    ?`<span class="st st-ok">${icon("check",{size:12,stroke:2.6})} ${n} ${n===1?"menu":"menus"} added</span><span class="metalabel" style="color:var(--muted)">${state.import.link?"Website linked":"No website yet"}${state.import.logo?" · Logo added":""}</span>`
    :`<span class="metalabel" style="color:var(--muted)">Add your menu to get started</span>`;
  var inner=`
    ${pageHead({title:"Drop In Your <em>Menu</em>",sub:"Upload your menu as a PDF or photo, or paste your website link. Benu turns it into a polished online menu in minutes. You approve everything before it goes live."})}
    <div style="display:grid;grid-template-columns:1.55fr 1fr;gap:22px" class="import-grid">
      <div class="card" style="padding:22px">
        <label class="dropzone" id="dropzone"><div style="margin-bottom:14px">${pdfTile(52)}</div><div style="font-size:17px;font-weight:500">Drop your menu here, or <span style="color:var(--mint-600);font-weight:600">Browse</span></div><div style="color:var(--soft);font-size:13px;margin-top:6px">PDF, JPG or PNG · up to 90 MB</div><input id="pdf-input" type="file" accept="application/pdf,image/png,image/jpeg" multiple style="position:absolute;width:1px;height:1px;opacity:0"/></label>
        ${fileList}
      </div>
      <div class="col gap-4">
        <div class="card" style="padding:18px">
          <div class="row gap-2" style="margin-bottom:12px">${icon("link",{size:18,color:"var(--mint-600)"})}<span style="font-weight:600;font-size:15px">Existing Website</span></div>
          <div class="row" style="border:1px solid var(--border-strong);border-radius:999px;overflow:hidden;background:var(--surface)"><span style="padding:10px 4px 10px 14px;color:var(--soft);font-size:14px">https://</span><input value="${state.import.link}" data-model="import.link" placeholder="yourrestaurant.com" style="flex:1;border:none;outline:none;padding:10px 8px;font-size:14px;font-family:var(--sans);background:transparent"/></div>
          <div class="metalabel" style="margin-top:9px">We’ll pull hours, photos and contact too</div>
        </div>
        <div class="card" style="padding:18px">
          <div class="row gap-2" style="margin-bottom:12px">${icon("image",{size:18,color:"var(--mint-600)"})}<span style="font-weight:600;font-size:15px">Logo</span></div>
          ${logoBlock}
        </div>
      </div>
    </div>`;
  var foot=`<button class="btn btn-primary btn-lg" data-act="next">Continue ${icon("arrowR",{size:18,color:"#fff"})}</button>`;
  return screenWrap(inner)+footerBar(foot);
}
