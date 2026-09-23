import { SURFACE, BLUE } from './theme.js';

const vars = tokens => Object.entries(tokens).map(([k, v]) => `--${k}:${v}`).join(';');

export default `
:host{
  all:initial;position:fixed;z-index:2147483646;
  font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI Variable Display","Segoe UI",Helvetica,Arial,sans-serif;
  font-size:14px;line-height:1.4;-webkit-font-smoothing:antialiased;
}
*{box-sizing:border-box;margin:0}
[hidden]{display:none!important}
button,input,select{font:inherit;color:inherit}
button{cursor:pointer;background:none;border:0;padding:0;color:inherit}
button:disabled{cursor:default}
:focus:not(:focus-visible){outline:none}
:focus-visible{outline:2px solid ${BLUE};outline-offset:1px;border-radius:4px}

/* ── Panel ───────────────────────────────────────────────────────────── */
.panel{
  ${vars(SURFACE.light)};
  --radius:4px;
  background:var(--bg);color:var(--ink);
  display:flex;flex-direction:column;
  width:var(--picker-width,420px);height:var(--picker-height,460px);
  max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);
  border-radius:0 0 10px 10px;box-shadow:var(--shadow);
  overflow:hidden;color-scheme:light;
  animation:appear .13s cubic-bezier(.2,.8,.3,1);
}
.panel[data-theme=dark]{${vars(SURFACE.dark)};color-scheme:dark}
.panel[data-integrated=false]{border-radius:10px}
@keyframes appear{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}

/* ── Header ──────────────────────────────────────────────────────────── */
.top{display:flex;align-items:center;gap:8px;padding:10px 12px 2px;flex-shrink:0}
.brand{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--muted)}
.brand svg{width:13px;height:13px;display:block}
.close{margin-left:auto;width:24px;height:24px;border-radius:var(--radius);display:grid;place-items:center;color:var(--muted)}
.close:hover{background:var(--hover)}
.close svg{width:13px;height:13px}

.search-row{display:flex;align-items:center;gap:6px;padding:10px 12px 8px;flex-shrink:0}
.search-wrap{
  flex:1;min-width:0;display:flex;align-items:center;gap:7px;
  background:var(--field);border-radius:var(--radius);padding:0 8px;height:28px;
  box-shadow:var(--inset) 0 0 0 1px inset;transition:box-shadow .12s ease;
}
.search-wrap:focus-within{box-shadow:${BLUE} 0 0 0 1px inset,rgba(35,131,226,.2) 0 0 0 2px}
.search-wrap>svg{width:13px;height:13px;color:var(--faint);flex-shrink:0}
.search{flex:1;min-width:0;background:none;border:0;outline:none!important;padding:0;font-size:14px;color:var(--ink)}
.search::placeholder{color:var(--faint)}
.search::-webkit-search-cancel-button{display:none}
.clear{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;color:var(--faint);flex-shrink:0}
.clear:hover{background:var(--active);color:var(--ink)}
.clear svg{width:9px;height:9px}

/* ── Colour well ─────────────────────────────────────────────────────── */
.ink{position:relative;flex-shrink:0}
.ink-trigger{
  width:28px;height:28px;border-radius:var(--radius);display:grid;place-items:center;
  box-shadow:var(--inset) 0 0 0 1px inset;transition:background .12s ease;
}
.ink-trigger:hover{background:var(--hover)}
.ink-trigger[aria-expanded=true]{background:var(--active)}
.ink-dot{width:14px;height:14px;border-radius:50%;box-shadow:rgba(15,15,15,.16) 0 0 0 1px inset}
.ink-pop{
  position:absolute;top:calc(100% + 5px);right:0;z-index:3;width:212px;padding:6px;
  background:var(--bg);border-radius:6px;box-shadow:var(--shadow);
  animation:appear .1s ease;
}
.ink-pop-title{font-size:11px;font-weight:500;color:var(--faint);padding:4px 6px 6px}
.swatches{display:grid;grid-template-columns:repeat(5,1fr);gap:2px}
.swatch{height:30px;border-radius:var(--radius);display:grid;place-items:center;transition:background .1s ease}
.swatch:hover{background:var(--hover)}
.swatch i{width:16px;height:16px;border-radius:50%;box-shadow:rgba(15,15,15,.16) 0 0 0 1px inset;display:block;position:relative}
.swatch[aria-pressed=true] i::after{
  content:"";position:absolute;inset:-4px;border-radius:50%;
  box-shadow:${BLUE} 0 0 0 2px;
}
.custom-row{display:flex;align-items:center;gap:8px;margin-top:6px;padding:6px;border-top:1px solid var(--line)}
.custom-row label{font-size:12px;color:var(--muted);flex:1}
.hex{
  width:78px;height:24px;padding:0 6px;font-size:12px;font-variant-numeric:tabular-nums;
  background:var(--field);border:0;border-radius:var(--radius);color:var(--ink);
  box-shadow:var(--inset) 0 0 0 1px inset;outline:none;text-transform:uppercase;
}
.hex:focus{box-shadow:${BLUE} 0 0 0 1px inset}
.hex[aria-invalid=true]{box-shadow:var(--danger) 0 0 0 1px inset}
.well{width:24px;height:24px;padding:0;border:0;border-radius:var(--radius);background:none;cursor:pointer;overflow:hidden}
.well::-webkit-color-swatch-wrapper{padding:0}
.well::-webkit-color-swatch,.well::-moz-color-swatch{border:0;border-radius:var(--radius)}

/* ── Filters ─────────────────────────────────────────────────────────── */
.categories{display:flex;gap:1px;padding:0 10px 6px;flex-shrink:0;overflow-x:auto;scrollbar-width:none}
.categories::-webkit-scrollbar{display:none}
.category{
  display:flex;align-items:center;gap:4px;white-space:nowrap;flex-shrink:0;
  height:24px;padding:0 8px;border-radius:var(--radius);font-size:12px;color:var(--muted);
  transition:background .1s ease,color .1s ease;
}
.category:hover{background:var(--hover)}
.category[aria-pressed=true]{background:var(--active);color:var(--ink);font-weight:500}
.category svg{width:12px;height:12px}

.meta{display:flex;align-items:center;gap:8px;padding:0 12px 8px;flex-shrink:0;font-size:11px;color:var(--faint)}
.set-select{
  max-width:56%;min-width:0;height:22px;padding:0 2px;font-size:11px;color:var(--muted);
  background:none;border:0;border-radius:var(--radius);text-overflow:ellipsis;cursor:pointer;
}
.set-select:hover{background:var(--hover)}
.count{margin-left:auto;flex-shrink:0;font-variant-numeric:tabular-nums}

/* ── Results ─────────────────────────────────────────────────────────── */
.results{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:0 10px 10px;scrollbar-width:thin}
.results::-webkit-scrollbar{width:8px}
.results::-webkit-scrollbar-thumb{background:var(--active);border-radius:4px;border:2px solid transparent;background-clip:content-box}
.section{
  position:sticky;top:0;z-index:1;background:var(--bg);
  padding:2px 2px 6px;font-size:11px;font-weight:500;color:var(--faint);
}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(34px,1fr));gap:1px}
.tile{
  position:relative;aspect-ratio:1;border-radius:var(--radius);
  display:grid;place-items:center;transition:background .08s ease,transform .08s ease;
}
.tile:hover{background:var(--hover)}
.tile:active{transform:scale(.92)}
.tile[aria-pressed=true]{background:var(--active)}
.tile svg{width:24px;height:24px;display:block;pointer-events:none}
.tile[data-state=busy]{background:var(--hover)}
.tile[data-state=busy] svg{opacity:.35}
.tile[data-state=done]::after{
  content:"";position:absolute;inset:0;border-radius:var(--radius);
  background:${BLUE};opacity:.16;animation:flash .5s ease forwards;
}
@keyframes flash{from{opacity:.38;transform:scale(.86)}to{opacity:0;transform:scale(1)}}
.pin{
  position:absolute;top:1px;right:1px;width:13px;height:13px;border-radius:3px;
  display:grid;place-items:center;color:var(--faint);opacity:0;transition:opacity .1s ease;
}
.pin svg{width:9px;height:9px;pointer-events:none}
.tile:hover .pin,.tile:focus-visible .pin,.pin:focus-visible,.pin[data-on=true]{opacity:1}
.pin[data-on=true]{color:${BLUE}}
.pin:hover{background:var(--active);color:var(--ink)}

.skeleton{aspect-ratio:1;border-radius:var(--radius);background:var(--hover);animation:pulse 1.1s ease-in-out infinite}
.skeleton:nth-child(3n){animation-delay:.12s}
.skeleton:nth-child(3n+1){animation-delay:.24s}
@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}

.empty{grid-column:1/-1;text-align:center;color:var(--muted);padding:32px 18px;font-size:13px;line-height:1.6}
.empty strong{display:block;color:var(--ink);font-weight:500;margin-bottom:3px}
.empty button{color:${BLUE};margin-top:8px;font-size:12px}
.empty button:hover{text-decoration:underline}
.sentinel{height:1px}
.load-more{display:block;width:100%;margin-top:8px;padding:6px;border-radius:var(--radius);color:var(--muted);font-size:12px}
.load-more:hover{background:var(--hover)}

/* ── Detail ──────────────────────────────────────────────────────────── */
.detail{
  display:flex;align-items:center;gap:8px;padding:7px 10px;flex-shrink:0;
  border-top:1px solid var(--line);animation:appear .12s ease;
}
.preview{width:28px;height:28px;display:grid;place-items:center;flex-shrink:0;border-radius:var(--radius);background:var(--hover)}
.preview svg{width:20px;height:20px}
.info{flex:1;min-width:0}
.name{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.license{
  display:block;font-size:10px;color:var(--faint);text-decoration:none;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.license:hover{text-decoration:underline;color:var(--muted)}
.act{
  height:26px;min-width:26px;padding:0 7px;border-radius:var(--radius);
  display:grid;place-items:center;color:var(--muted);font-size:11px;
}
.act:hover:not(:disabled){background:var(--hover);color:var(--ink)}
.act:disabled{opacity:.4}
.act svg{width:13px;height:13px}
.act[aria-pressed=true]{color:${BLUE}}
.apply{background:${BLUE};color:#fff;height:26px;padding:0 10px;border-radius:var(--radius);font-size:12px;font-weight:500}
.apply:hover:not(:disabled){background:rgb(14,113,213)}

/* ── Status ──────────────────────────────────────────────────────────── */
.status{
  flex-shrink:0;display:flex;align-items:center;gap:6px;
  padding:6px 12px;font-size:11px;line-height:1.45;color:var(--muted);border-top:1px solid var(--line);
}
.status:empty,.status[data-empty=true]{display:none}
.status[data-error=true]{color:var(--danger)}
.status svg{width:12px;height:12px;flex-shrink:0}
.status button{margin-left:auto;color:${BLUE};font-size:11px;flex-shrink:0}
.status button:hover{text-decoration:underline}

/* Colour icons need a light plate on a dark panel or they vanish into it. */
.panel[data-theme=dark] .tile[data-plate=true] svg,
.panel[data-theme=dark] .preview[data-plate=true] svg{background:#EFEDE9;border-radius:3px;padding:2px}

@media (prefers-reduced-motion:reduce){
  *{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
}
@media(max-width:360px){
  .category{padding:0 6px}
  .set-select{max-width:46%}
  .grid{grid-template-columns:repeat(auto-fill,minmax(30px,1fr))}
}
`;
