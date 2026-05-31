/* ---------- SHARED CHROME ---------- */
function topBar(){
  var screen=state.screen,total=STEPS.length;
  var pct=screen>=total?100:(screen/(total-1))*100;
  return `<header class="site-header">
    <div class="hdr-container">
      <a href="./index.html#top" class="brand"><span class="mark">B</span> Benu</a>
      <nav class="pill-nav" aria-label="Primary">
        <a href="./index.html#top"><span class="pill-ico">${icon("home",{size:15})}</span> Home</a>
        <a href="./index.html#bundle"><span class="pill-ico">${icon("box",{size:15})}</span> Bundle</a>
        <a href="./index.html#templates"><span class="pill-ico">${icon("layout",{size:15})}</span> Templates</a>
        <a href="./index.html#pricing"><span class="pill-ico">${icon("price",{size:15})}</span> Pricing</a>
      </nav>
      <div class="nav-actions"><a href="./index.html#concierge" class="signin">Talk to us</a></div>
    </div>
    <div class="hdr-progress"><div style="width:${pct}%"></div></div>
  </header>`;
}
function screenWrap(inner,max){max=max||1080;return `<main class="scroll" style="flex:1;overflow-y:auto;overflow-x:hidden"><div style="max-width:${max}px;margin:0 auto;padding:44px 32px 140px">${inner}</div></main>`;}
function footerBar(inner){return `<div style="position:fixed;left:0;right:0;bottom:0;z-index:30;background:rgba(250,251,247,0.86);backdrop-filter:blur(14px);border-top:1px solid var(--border)"><div style="max-width:1080px;margin:0 auto;padding:16px 32px" class="row spread">${inner}</div></div>`;}
function pageHead(o){return `<div class="row spread" style="align-items:flex-end;margin-bottom:34px;gap:24px;flex-wrap:wrap"><div style="flex:1 1 460px;min-width:0"><h1 class="display" style="font-size:${o.titleSize||44}px;margin-bottom:${o.sub?16:0}px;display:block">${o.title}</h1>${o.sub?`<p style="font-size:17px;color:var(--muted);margin:0;line-height:1.5;max-width:560px;display:block">${o.sub}</p>`:""}</div>${o.aside?`<div style="flex-shrink:0">${o.aside}</div>`:""}</div>`;}
function aiNote(inner,ic){ic=ic||"sparkle";return `<div class="row gap-3" style="align-items:flex-start;background:var(--mint-50);border:1px solid var(--mint-200);border-radius:var(--r-md);padding:13px 16px;color:var(--mint-900)"><div style="flex-shrink:0;margin-top:1px">${icon(ic,{size:17,color:"var(--mint-600)"})}</div><div style="font-size:13.5px;line-height:1.5;color:var(--mint-900)">${inner}</div></div>`;}
function tick(on){return `<div style="width:24px;height:24px;border-radius:7px;flex-shrink:0;border:${on?"none":"2px solid var(--border-strong)"};background:${on?"var(--mint-900)":"transparent"};display:grid;place-items:center;transition:all .15s">${on?icon("check",{size:15,color:"#fff",stroke:2.4}):""}</div>`;}
