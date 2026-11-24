/**
 * The look of Word Drop (start, play and end pages). One cobalt accent on a deep ink board, red only for danger,
 * pale word tiles. The page is laid out for a laptop first and folds to a phone by the width of its own stage
 * (a container query, not the window), so a narrow window and a phone get the same layout.
 */
export const WORD_DROP_CSS = `
.wd-root{background:linear-gradient(var(--wd-bg),var(--wd-bg) 40%,var(--wd-bg2));--wd-ease:cubic-bezier(.2,.7,.2,1)}
.wd-stage{container-name:wd;container-type:inline-size;position:relative;height:100%;max-width:1160px;margin:0 auto;display:flex;flex-direction:column;min-height:0}
.wd-stage svg{display:block}
.wd-eyebrow{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--wd-mute)}
.wd-xbtn{display:grid;place-items:center;width:34px;height:34px;border-radius:999px;border:1px solid var(--wd-line);color:var(--wd-mute);transition:color .15s,border-color .15s;background:none}
.wd-xbtn:hover{color:#fff;border-color:var(--wd-mute)}
.wd-xbtn[aria-pressed="false"]{opacity:.6}
.wd-btn{display:grid;place-items:center;min-height:54px;border-radius:16px;border:1px solid var(--wd-line);background:var(--wd-bg);font-size:15px;font-weight:700;padding:0 14px;transition:border-color .15s,background .15s,color .15s}
.wd-btn:hover{border-color:var(--wd-mute)}
.wd-btn.main{border-color:var(--wd-acc);background:var(--wd-acc);color:oklch(.16 .02 265);font-size:17px;font-weight:800;box-shadow:0 0 28px var(--wd-acc-a),inset 0 1px 0 rgb(255 255 255/.4)}
.wd-btn.main:hover{box-shadow:0 0 38px oklch(.72 .15 262/.45),inset 0 1px 0 rgb(255 255 255/.4)}
.wd-btn.main:active{transform:translateY(1px)}
.wd-btn:disabled{opacity:.45}

/* ---------- play ---------- */
.wd-play{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 300px;grid-template-rows:auto minmax(0,1fr) auto}
.wd-hud{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;padding:16px 22px 12px}
.wd-score{display:flex;align-items:baseline;gap:10px}
.wd-score b{font-size:40px;line-height:1;font-weight:800;font-variant-numeric:tabular-nums}
.wd-score small{font-size:12px;color:var(--wd-mute)}
.wd-combo{font-weight:800;color:var(--wd-acc);font-size:17px;animation:wd-bump .3s var(--wd-ease)}
@keyframes wd-bump{40%{transform:scale(1.4)}}
.wd-hr{display:flex;align-items:center;gap:14px}
.wd-lives{display:flex;gap:6px}
.wd-lives i{display:block;width:9px;height:9px;border-radius:999px;background:var(--wd-acc);transition:background .3s,box-shadow .3s,transform .3s}
.wd-lives i.off{background:transparent;box-shadow:inset 0 0 0 1.5px var(--wd-line);transform:scale(.8)}
.wd-frz{display:flex;align-items:center;gap:8px;border:1px solid var(--wd-line);border-radius:999px;padding:5px 12px 5px 10px;font-size:12.5px;font-weight:700;color:var(--wd-mute);background:none;transition:border-color .2s,color .2s,background .2s}
.wd-frz .pips{display:flex;gap:4px}
.wd-frz .pips i{display:block;width:7px;height:7px;border-radius:2px;box-shadow:inset 0 0 0 1.5px var(--wd-line);transition:background .25s,box-shadow .25s}
.wd-frz .pips i.on{background:var(--wd-acc);box-shadow:none}
.wd-frz kbd{font:600 10.5px inherit;border:1px solid var(--wd-line);border-radius:5px;padding:0 5px;color:var(--wd-mute)}
.wd-frz.ready{border-color:var(--wd-acc);color:#fff}
.wd-frz.active{background:var(--wd-acc);color:#000;border-color:var(--wd-acc)}
.wd-frz.active .pips i{background:#000;box-shadow:none}

.wd-field{--wd-danger:0;--wd-heat:0;grid-column:1;grid-row:2;position:relative;margin:0 0 0 22px;border:1px solid var(--wd-line);border-radius:20px;background-color:var(--wd-board);background-image:radial-gradient(oklch(1 0 0/.075) 1px,transparent 1.3px);background-size:26px 26px;overflow:hidden;touch-action:manipulation;transition:border-color .3s,box-shadow .3s}
.wd-field::before{content:"";position:absolute;inset:auto 0 0 0;height:70%;background:radial-gradient(70% 100% at 50% 100%,var(--wd-acc-a),transparent);opacity:var(--wd-heat);transition:opacity .7s;pointer-events:none}
.wd-field.frozen{border-color:var(--wd-acc);box-shadow:inset 0 0 0 1px var(--wd-acc),inset 0 0 60px var(--wd-acc-a)}
.wd-field.shake{animation:wd-fshake .28s linear}
@keyframes wd-fshake{20%{transform:translateY(3px)}60%{transform:translateY(-2px)}}
.wd-timeline{position:absolute;inset:0 0 auto 0;height:3px;z-index:2;background:oklch(1 0 0/.05)}
.wd-timeline i{display:block;height:100%;background:var(--wd-mute);opacity:.55;transform-origin:left;transition:transform 1s linear}
.wd-floor{position:absolute;inset:auto 0 0 0;height:90px;pointer-events:none;background:linear-gradient(to top,oklch(.65 .21 25/.26),transparent);opacity:var(--wd-danger);transition:opacity .25s}
.wd-floor::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:oklch(.65 .21 25/.55)}
.wd-flash{position:absolute;inset:auto 0 0 0;height:150px;pointer-events:none;background:linear-gradient(to top,oklch(.65 .21 25/.45),transparent);animation:wd-fl .7s ease-out forwards}
@keyframes wd-fl{0%{opacity:1}100%{opacity:0}}
.wd-banner{position:absolute;left:50%;top:14%;z-index:4;pointer-events:none;font-size:15px;font-weight:800;letter-spacing:.04em;background:oklch(0 0 0/.55);border:1px solid var(--wd-acc);border-radius:999px;padding:5px 16px;white-space:nowrap;animation:wd-ban 1.5s var(--wd-ease) forwards}
@keyframes wd-ban{0%{opacity:0;transform:translate(-50%,10px)}15%{opacity:1;transform:translate(-50%,0)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-8px)}}
.wd-pt{position:absolute;z-index:3;width:7px;height:7px;border-radius:2px;pointer-events:none;transition:transform .65s var(--wd-ease),opacity .65s ease-out}
.wd-rip{position:absolute;z-index:1;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:999px;border:1.5px solid var(--wd-acc);pointer-events:none;opacity:.7;transition:transform .8s var(--wd-ease),opacity .8s ease-out}
.wd-pop{position:absolute;z-index:3;font-size:14px;font-weight:800;pointer-events:none;white-space:nowrap;animation:wd-rise .95s ease-out forwards}
@keyframes wd-rise{0%{opacity:0;transform:translateY(0)}15%{opacity:1}100%{opacity:0;transform:translateY(-36px)}}

.wd-tile{position:absolute;left:0;top:0;will-change:transform}
.wd-card{position:relative;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.15em;border-radius:.8em;background:var(--wd-tile);color:var(--wd-tile-ink);padding:.5em .9em .45em;text-align:center;overflow:visible;
  background-image:linear-gradient(#fff,transparent 85%);
  box-shadow:0 12px 24px -12px oklch(0 0 0/.75),0 0 22px oklch(.72 .15 262/.22),0 0 0 2px oklch(.65 .21 25/calc(var(--wd-d,0)*.9));
  animation:wd-tin .4s var(--wd-ease) backwards;transition:transform .16s var(--wd-ease),opacity .22s,box-shadow .2s}
@keyframes wd-tin{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}
.wd-field.has-lock .wd-tile:not(.lock) .wd-card{opacity:.5}
.wd-tile.lock .wd-card{transform:scale(1.05)}
.wd-tile.boss .wd-card{box-shadow:0 12px 24px -12px oklch(0 0 0/.75),0 0 0 2px var(--wd-acc),0 0 28px oklch(.72 .15 262/.5)}
.wd-x3{position:absolute;top:-9px;right:-6px;background:var(--wd-acc);color:#000;border-radius:999px;font-size:11px;font-weight:800;padding:1px 8px}
.wd-w{display:flex;font-size:1em;font-weight:800;line-height:1.15;letter-spacing:.01em;direction:ltr}
.wd-w i,.wd-mask i{font-style:normal;position:relative;transition:color .12s}
.wd-w i.ok{color:var(--wd-acc-ink);animation:wd-pop .16s var(--wd-ease)}
@keyframes wd-pop{from{transform:translateY(3px)}to{transform:none}}
.wd-w i.on::after,.wd-mask i.on::after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:2px;border-radius:2px;background:var(--wd-acc-ink);animation:wd-blink 1s ease-in-out infinite}
@keyframes wd-blink{50%{opacity:.25}}
.wd-tile.bad .wd-w i.on::after,.wd-tile.bad .wd-mask i.on::after{background:var(--wd-red);animation:none}
.wd-m{font-size:.66em;color:var(--wd-tile-mute);line-height:1.2}
.wd-m1{font-size:1em;font-weight:800;color:var(--wd-tile-ink);line-height:1.3}
.wd-sentence{font-size:.9em;font-weight:800;line-height:1.3;overflow-wrap:anywhere;direction:ltr}
.wd-sentence span.ok{color:var(--wd-acc-ink)}
.wd-mask{display:flex;gap:.3em;direction:ltr;font-size:.85em;font-weight:800;color:var(--wd-acc-ink);margin-top:.1em}
.wd-mask i{min-width:.72em;text-align:center;border-bottom:1.5px solid oklch(.5 .015 265/.35);line-height:1.25}
.wd-mask i.e{color:transparent}
.wd-mask i.f{border-color:var(--wd-acc-ink);animation:wd-pop .16s var(--wd-ease)}
.wd-spk{display:grid;place-items:center;width:1.7em;height:1.7em;border-radius:999px;background:var(--wd-tile-ink);color:var(--wd-tile);margin:.05em 0}
.wd-nudge{animation:wd-nudge .17s linear}
@keyframes wd-nudge{25%{translate:-3px 0}75%{translate:3px 0}}
.wd-hint{min-height:1.1em;font-size:.65em;font-weight:600;color:var(--wd-tile-mute)}

.wd-typer{grid-column:1;grid-row:3;position:relative;padding:12px 22px 20px;text-align:center}
.wd-typed{position:relative;height:60px;width:min(100%,460px);margin:0 auto;display:flex;justify-content:center;align-items:center;font-size:34px;font-weight:800;letter-spacing:.04em;direction:ltr;border:2px solid var(--wd-acc);border-radius:18px;background:oklch(.12 .005 265/.72);box-shadow:0 0 30px var(--wd-acc-a)}
.wd-typed .c{display:inline-block}
.wd-typed .c.n{animation:wd-pop .14s var(--wd-ease)}
.wd-typed .ph{font-size:20px;font-weight:700;color:oklch(.42 .015 265);letter-spacing:0;margin-inline-start:6px}
.wd-caretwrap{position:relative;display:inline-block;width:2px;height:36px}
.wd-caret{display:block;width:2px;height:36px;border-radius:2px;background:var(--wd-acc);animation:wd-blink 1.05s ease-in-out infinite}
.wd-ghost{position:absolute;left:-7px;bottom:100%;color:var(--wd-red);font-weight:800;animation:wd-ghost .3s ease-out forwards;pointer-events:none}
@keyframes wd-ghost{from{opacity:1;transform:translateY(8px)}to{opacity:0;transform:translateY(-6px)}}
.wd-caption{height:26px;margin-top:8px;display:flex;justify-content:center;align-items:center}
.wd-caption button{display:flex;align-items:center;gap:9px;font-size:14.5px;color:var(--wd-mute);animation:wd-capin .3s var(--wd-ease)}
.wd-caption b{color:#fff;font-weight:700;direction:ltr}
.wd-caption em{font-style:normal;color:var(--wd-red);font-weight:700}
.wd-caption.miss b{color:var(--wd-red)}
.wd-caption svg{color:var(--wd-acc)}
.wd-caption.miss svg{color:var(--wd-red)}
@keyframes wd-capin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.wd-warn{margin:0 0 4px;font-size:12px;color:var(--wd-red)}
.wd-inp{position:absolute;inset:0;width:100%;height:100%;opacity:0;font-size:16px;border:0;background:transparent;color:transparent;caret-color:transparent;pointer-events:none}

.wd-side{grid-column:2;grid-row:2/4;display:flex;flex-direction:column;min-height:0;padding:0 22px 20px 20px}
.wd-sd-h{display:flex;justify-content:space-between;align-items:baseline;font-size:12.5px;color:var(--wd-mute);margin-bottom:8px}
.wd-sd-h b{color:#fff;font-size:14px}
.wd-lvbar{height:3px;border-radius:3px;background:oklch(1 0 0/.07);margin-bottom:14px;overflow:hidden}
.wd-lvbar i{display:block;height:100%;background:var(--wd-acc);transition:width .5s var(--wd-ease)}
.wd-log{list-style:none;margin:0;padding:0;flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;gap:8px}
.wd-log li{animation:wd-login .35s var(--wd-ease)}
@keyframes wd-login{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
.wd-log button{width:100%;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;background:oklch(1 0 0/.045);text-align:left;transition:background .15s}
.wd-log button:hover{background:oklch(1 0 0/.09)}
.wd-log .en{font-weight:800;font-size:16px;direction:ltr}
.wd-log .ar{font-size:13.5px;color:var(--wd-mute);text-align:right}
.wd-log svg{color:var(--wd-acc)}
.wd-log li.miss .en,.wd-log li.miss svg{color:var(--wd-red)}
.wd-log li.miss button{box-shadow:inset 2px 0 0 var(--wd-red)}
.wd-sd-empty{margin:0;font-size:13px;color:var(--wd-mute);line-height:1.6;text-align:right}

/* ---------- start ---------- */
.wd-top{display:flex;justify-content:space-between;align-items:center;padding:20px 22px 0}
.wd-pill{border:1px solid var(--wd-line);background:oklch(1 0 0/.06);border-radius:999px;padding:7px 18px;font-size:14px;font-weight:700;color:#fff;transition:border-color .15s}
.wd-pill:hover{border-color:var(--wd-mute)}
.wd-st{position:relative;flex:1;min-height:0;overflow:auto;padding:20px 52px 30px;display:flex;flex-direction:column;justify-content:center}
.wd-hero{position:relative;z-index:1;display:flex;flex-direction:column;align-items:flex-start;gap:14px;max-width:min(60%,660px)}
.wd-logo{margin:0;font-size:88px;line-height:1;font-weight:800;letter-spacing:-.015em;color:#fff;text-shadow:0 0 44px oklch(.72 .15 262/.38)}
.wd-logo span{color:var(--wd-acc)}
.wd-hero h1{margin:0;font-size:34px;line-height:1.25;font-weight:700;text-align:right;color:oklch(.85 .025 265)}
.wd-modes{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.wd-mode{color:#fff;border:1px solid oklch(1 0 0/.28);border-radius:999px;padding:7px 24px;font-size:16px;font-weight:700;background:transparent;transition:background .15s,color .15s,border-color .15s}
.wd-mode:hover{background:oklch(1 0 0/.07)}
.wd-mode[aria-checked="true"]{background:var(--wd-acc);border-color:var(--wd-acc);color:oklch(.16 .02 265)}
.wd-mode:disabled{opacity:.45}
.wd-hint{margin:0;min-height:22px;font-size:14.5px;color:var(--wd-mute);text-align:right}
.wd-mine{color:#fff;background:none;display:flex;align-items:center;gap:14px;border:1px solid var(--wd-line);border-radius:999px;padding:6px 8px 6px 18px;text-align:right;font-size:14px}
.wd-mine b{margin-inline-end:8px}
.wd-mine .l{color:var(--wd-mute);font-size:12.5px}
.wd-cta{display:flex;align-items:center;gap:18px;margin-top:6px;flex-wrap:wrap}
.wd-cta .wd-btn.main{padding:0 46px}
.wd-cta small{font-size:14px;color:var(--wd-mute)}
.wd-floaters{position:absolute;inset:0;pointer-events:none}
.wd-ft{position:absolute;background-image:linear-gradient(#fff,var(--wd-tile));color:var(--wd-tile-ink);font-weight:800;font-size:26px;line-height:1;border-radius:12px;padding:11px 21px 12px;box-shadow:0 14px 26px -14px oklch(0 0 0/.8);animation:wd-bob 4.5s ease-in-out infinite}
.wd-ft.f0{right:20%;top:6%;rotate:5deg}
.wd-ft.f1{right:5%;top:34%;rotate:-4deg;animation-delay:-1.4s;box-shadow:0 14px 26px -14px oklch(0 0 0/.8),0 0 0 2px var(--wd-acc)}
.wd-ft.f2{right:26%;top:44%;rotate:-3deg;animation-delay:-2.6s}
.wd-ft em{position:absolute;right:-10px;top:-12px;background:var(--wd-acc);color:oklch(.16 .02 265);border-radius:999px;font-size:11px;font-style:normal;font-weight:800;padding:4px 9px}
@keyframes wd-bob{50%{translate:0 -7px}}
.wd-board3{position:absolute;right:52px;bottom:28px;z-index:1;width:300px;border:1px solid var(--wd-line);border-radius:16px;padding:12px 16px;background:oklch(1 0 0/.04)}
.wd-board3>b{display:block;font-size:13px;color:var(--wd-mute);margin-bottom:2px;text-align:right}
.wd-sw{width:44px;height:24px;border-radius:999px;border:1px solid var(--wd-line);padding:2px;display:flex;transition:border-color .15s}
.wd-sw i{display:block;width:18px;height:18px;border-radius:999px;background:var(--wd-mute);transition:transform .2s var(--wd-ease),background .2s}
[aria-checked="true"]>.wd-sw{border-color:var(--wd-acc)}
[aria-checked="true"]>.wd-sw i{background:var(--wd-acc);transform:translateX(20px)}
.wd-seedcard{border:1px solid var(--wd-acc);border-radius:18px;padding:14px 16px;text-align:right}
.wd-row3{display:grid;grid-template-columns:28px 1fr auto;align-items:baseline;gap:12px;border-top:1px solid var(--wd-line);padding:8px 0;font-size:14px}

/* ---------- end ---------- */
.wd-en{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:56px;padding:36px 52px 30px;overflow:auto}
.wd-en-left{display:flex;flex-direction:column;gap:18px;text-align:right}
.wd-en-left .big{font-size:104px;line-height:1;font-weight:800;font-variant-numeric:tabular-nums;color:var(--wd-acc);margin-top:6px}
.wd-en-left .unit{font-size:15px;color:var(--wd-mute)}
.wd-en-left p{margin:0}
.wd-stats{display:grid;grid-template-columns:repeat(4,1fr);text-align:right;margin:8px 0}
.wd-stats div+div{border-inline-start:1px solid var(--wd-line);padding-inline-start:14px}
.wd-stats b{display:block;font-size:26px;font-weight:800;font-variant-numeric:tabular-nums}
.wd-stats span{font-size:12px;color:var(--wd-mute)}
.wd-en-act{position:relative;display:flex;flex-direction:column;gap:9px;max-width:380px;width:100%;margin-top:auto}
.wd-en-right{display:flex;flex-direction:column;gap:26px;justify-content:flex-start;min-height:0;padding-top:20px}
.wd-rh .hd{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:var(--wd-mute);margin-bottom:8px}
.wd-bars{height:150px;display:flex;align-items:flex-end;gap:4px;border-bottom:1px solid var(--wd-line)}
.wd-bars i{flex:1;border-radius:3px 3px 0 0;background:var(--wd-acc);transform-origin:bottom;animation:wd-grow .5s var(--wd-ease) backwards}
.wd-bars i.slow{background:oklch(.45 .01 265)}
.wd-bars b{flex:1;align-self:flex-end;height:6px;margin-bottom:-3px;border-radius:999px;background:var(--wd-red);max-width:6px;animation:wd-grow .5s var(--wd-ease) backwards}
@keyframes wd-grow{from{transform:scaleY(0)}}
.wd-mg{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding-bottom:8px}
.wd-mc{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;border-radius:15px;border:2px solid transparent;background:var(--wd-tile);color:var(--wd-tile-ink);padding:13px 4px 17px;box-shadow:inset 0 1px 0 rgb(255 255 255/.75)}
.wd-mc.saved{border-color:var(--wd-acc)}
.wd-mc b{font-size:18px;font-weight:800}
.wd-mc span.m{font-size:13px;color:var(--wd-tile-mute)}
.wd-mc .tag{position:absolute;left:50%;bottom:-10px;transform:translateX(-50%);display:flex;align-items:center;gap:4px;border-radius:999px;padding:2px 11px;font-size:11px;font-weight:700;white-space:nowrap;background:var(--wd-acc);color:#000}
.wd-notice{position:absolute;left:0;right:0;top:-46px;border-radius:12px;background:#fff;color:#000;padding:8px 12px;text-align:center;font-size:13px;font-weight:600}

/* ---------- the calm look: flat, no glow ---------- */
.wd-btn.main{box-shadow:none}
.wd-btn.main:hover{box-shadow:none;filter:brightness(1.08)}
.wd-field{border:0;border-radius:0;background-color:transparent;transition:background-color .3s}
.wd-field::before{display:none}
.wd-field::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(90deg,transparent,oklch(.72 .15 262/.55),transparent);pointer-events:none}
.wd-field.frozen{box-shadow:none;background-color:oklch(.72 .15 262/.07)}
.wd-typed{box-shadow:none;width:min(100%,440px);height:56px}
.wd-card{box-shadow:0 12px 24px -12px oklch(0 0 0/.75),0 0 0 2px oklch(.65 .21 25/calc(var(--wd-d,0)*.9))}
.wd-tile.boss .wd-card{box-shadow:0 12px 24px -12px oklch(0 0 0/.75),0 0 0 2px var(--wd-acc)}
.wd-score{align-items:center}
.wd-lvl{border:1px solid var(--wd-line);background:oklch(1 0 0/.06);border-radius:999px;padding:4px 14px;font-size:13px;font-weight:700;margin-inline-start:6px}
.wd-frz{background:oklch(1 0 0/.06)}
.wd-frz.active{background:var(--wd-acc)}
.wd-lives{padding:9px 13px;border:1px solid var(--wd-line);border-radius:999px;background:oklch(1 0 0/.06)}
.wd-log button{border:1px solid var(--wd-line);background:oklch(1 0 0/.05);border-radius:999px;padding:8px 18px}
.wd-log button:hover{background:oklch(1 0 0/.09)}
.wd-log li.miss button{box-shadow:none;border-color:var(--wd-red)}

/* ---------- a phone-width stage ---------- */
@container wd (max-width:700px){
  .wd-play{grid-template-columns:minmax(0,1fr)}
  .wd-lvl{display:none}
  .wd-st{padding:12px 20px 24px;justify-content:flex-start}
  .wd-hero{max-width:none;gap:12px}
  .wd-logo{font-size:54px}
  .wd-hero h1{font-size:24px}
  .wd-floaters{display:none}
  .wd-board3{position:static;width:auto;margin-top:18px}
  .wd-cta{width:100%}
  .wd-cta .wd-btn.main{flex:1}
  .wd-side{display:none}
  .wd-field{margin:0 12px}
  .wd-typer{padding:10px 20px 20px}
  .wd-typed{font-size:31px;height:44px}
  .wd-hud{padding:16px 16px 10px}
  .wd-score b{font-size:36px}
  .wd-hr{gap:8px}
  .wd-frz kbd,.wd-frz .lbl{display:none}
  .wd-frz{padding:6px 9px}
  .wd-xbtn{width:30px;height:30px}
  .wd-en{grid-template-columns:minmax(0,1fr);gap:20px;padding:18px 20px 16px}
  .wd-en-left .big{font-size:76px}
  .wd-en-left{gap:14px}
  .wd-en-act{max-width:none}
  .wd-stats b{font-size:22px}
  .wd-stats div+div{padding-inline-start:8px}
  .wd-en-right{padding-top:0}
}
@media (prefers-reduced-motion:reduce){.wd-root *{animation-duration:.01s !important;transition-duration:.01s !important}}
`;
