"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { z } from "zod";
import { SaveTemplateOverlay } from "./save-template-overlay";

// ─── Zod Schema (CopilotKit parameter contract) ─────────────────────
export const WidgetRendererProps = z.object({
  title: z
    .string()
    .describe("Short title for the visualization, e.g. 'Binary Search' or 'Load Balancer Architecture'"),
  description: z
    .string()
    .describe("One-sentence explanation of what this visualization demonstrates"),
  html: z
    .string()
    .describe(
      "Self-contained HTML fragment with inline <style> and <script>. " +
        "Use CSS variables (var(--color-text-primary), etc.) for theming. " +
        "No external dependencies unless from allowed CDNs (cdnjs, esm.sh, jsdelivr, unpkg). " +
        "Include interactive controls where appropriate."
    ),
});

type WidgetRendererProps = z.infer<typeof WidgetRendererProps>;

// ─── Injected CSS: Theme Variables (Layer 3) ─────────────────────────
export const THEME_CSS = `
:root {
  --color-background-primary: #ffffff;
  --color-background-secondary: #f7f6f3;
  --color-background-tertiary: #efeee9;
  --color-background-info: #E6F1FB;
  --color-background-danger: #FCEBEB;
  --color-background-success: #EAF3DE;
  --color-background-warning: #FAEEDA;

  --color-text-primary: #1a1a1a;
  --color-text-secondary: #73726c;
  --color-text-tertiary: #9c9a92;
  --color-text-info: #185FA5;
  --color-text-danger: #A32D2D;
  --color-text-success: #3B6D11;
  --color-text-warning: #854F0B;

  --color-border-primary: rgba(0, 0, 0, 0.4);
  --color-border-secondary: rgba(0, 0, 0, 0.3);
  --color-border-tertiary: rgba(0, 0, 0, 0.15);
  --color-border-info: #185FA5;
  --color-border-danger: #A32D2D;
  --color-border-success: #3B6D11;
  --color-border-warning: #854F0B;

  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-serif: Georgia, "Times New Roman", serif;
  --font-mono: "SF Mono", "Fira Code", "Fira Mono", monospace;

  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  --p: var(--color-text-primary);
  --s: var(--color-text-secondary);
  --t: var(--color-text-tertiary);
  --bg2: var(--color-background-secondary);
  --b: var(--color-border-tertiary);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background-primary: #1a1a18;
    --color-background-secondary: #2c2c2a;
    --color-background-tertiary: #222220;
    --color-background-info: #0C447C;
    --color-background-danger: #501313;
    --color-background-success: #173404;
    --color-background-warning: #412402;

    --color-text-primary: #e8e6de;
    --color-text-secondary: #9c9a92;
    --color-text-tertiary: #73726c;
    --color-text-info: #85B7EB;
    --color-text-danger: #F09595;
    --color-text-success: #97C459;
    --color-text-warning: #EF9F27;

    --color-border-primary: rgba(255, 255, 255, 0.4);
    --color-border-secondary: rgba(255, 255, 255, 0.3);
    --color-border-tertiary: rgba(255, 255, 255, 0.15);
    --color-border-info: #85B7EB;
    --color-border-danger: #F09595;
    --color-border-success: #97C459;
    --color-border-warning: #EF9F27;
  }
}
`;

// ─── Injected CSS: SVG Pre-Built Classes (Layer 4) ───────────────────
const SVG_CLASSES_CSS = `
svg text.t   { font: 400 14px var(--font-sans); fill: var(--p); }
svg text.ts  { font: 400 12px var(--font-sans); fill: var(--s); }
svg text.th  { font: 500 14px var(--font-sans); fill: var(--p); }

svg .box > rect, svg .box > circle, svg .box > ellipse { fill: var(--bg2); stroke: var(--b); }
svg .node { cursor: pointer; }
svg .node:hover { opacity: 0.8; }
svg .arr { stroke: var(--s); stroke-width: 1.5; fill: none; }
svg .leader { stroke: var(--t); stroke-width: 0.5; stroke-dasharray: 4 4; fill: none; }

/* Purple */
svg .c-purple > rect, svg .c-purple > circle, svg .c-purple > ellipse,
svg rect.c-purple, svg circle.c-purple, svg ellipse.c-purple { fill: #EEEDFE; stroke: #534AB7; }
svg .c-purple text.th, svg .c-purple text.t { fill: #3C3489; }
svg .c-purple text.ts { fill: #534AB7; }

/* Teal */
svg .c-teal > rect, svg .c-teal > circle, svg .c-teal > ellipse,
svg rect.c-teal, svg circle.c-teal, svg ellipse.c-teal { fill: #E1F5EE; stroke: #0F6E56; }
svg .c-teal text.th, svg .c-teal text.t { fill: #085041; }
svg .c-teal text.ts { fill: #0F6E56; }

/* Coral */
svg .c-coral > rect, svg .c-coral > circle, svg .c-coral > ellipse,
svg rect.c-coral, svg circle.c-coral, svg ellipse.c-coral { fill: #FAECE7; stroke: #993C1D; }
svg .c-coral text.th, svg .c-coral text.t { fill: #712B13; }
svg .c-coral text.ts { fill: #993C1D; }

/* Pink */
svg .c-pink > rect, svg .c-pink > circle, svg .c-pink > ellipse,
svg rect.c-pink, svg circle.c-pink, svg ellipse.c-pink { fill: #FBEAF0; stroke: #993556; }
svg .c-pink text.th, svg .c-pink text.t { fill: #72243E; }
svg .c-pink text.ts { fill: #993556; }

/* Gray */
svg .c-gray > rect, svg .c-gray > circle, svg .c-gray > ellipse,
svg rect.c-gray, svg circle.c-gray, svg ellipse.c-gray { fill: #F1EFE8; stroke: #5F5E5A; }
svg .c-gray text.th, svg .c-gray text.t { fill: #444441; }
svg .c-gray text.ts { fill: #5F5E5A; }

/* Blue */
svg .c-blue > rect, svg .c-blue > circle, svg .c-blue > ellipse,
svg rect.c-blue, svg circle.c-blue, svg ellipse.c-blue { fill: #E6F1FB; stroke: #185FA5; }
svg .c-blue text.th, svg .c-blue text.t { fill: #0C447C; }
svg .c-blue text.ts { fill: #185FA5; }

/* Green */
svg .c-green > rect, svg .c-green > circle, svg .c-green > ellipse,
svg rect.c-green, svg circle.c-green, svg ellipse.c-green { fill: #EAF3DE; stroke: #3B6D11; }
svg .c-green text.th, svg .c-green text.t { fill: #27500A; }
svg .c-green text.ts { fill: #3B6D11; }

/* Amber */
svg .c-amber > rect, svg .c-amber > circle, svg .c-amber > ellipse,
svg rect.c-amber, svg circle.c-amber, svg ellipse.c-amber { fill: #FAEEDA; stroke: #854F0B; }
svg .c-amber text.th, svg .c-amber text.t { fill: #633806; }
svg .c-amber text.ts { fill: #854F0B; }

/* Red */
svg .c-red > rect, svg .c-red > circle, svg .c-red > ellipse,
svg rect.c-red, svg circle.c-red, svg ellipse.c-red { fill: #FCEBEB; stroke: #A32D2D; }
svg .c-red text.th, svg .c-red text.t { fill: #791F1F; }
svg .c-red text.ts { fill: #A32D2D; }

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  svg text.t   { fill: #e8e6de; }
  svg text.ts  { fill: #9c9a92; }
  svg text.th  { fill: #e8e6de; }

  svg .c-purple > rect, svg .c-purple > circle, svg .c-purple > ellipse,
  svg rect.c-purple, svg circle.c-purple, svg ellipse.c-purple { fill: #3C3489; stroke: #AFA9EC; }
  svg .c-purple text.th, svg .c-purple text.t { fill: #CECBF6; }
  svg .c-purple text.ts { fill: #AFA9EC; }

  svg .c-teal > rect, svg .c-teal > circle, svg .c-teal > ellipse,
  svg rect.c-teal, svg circle.c-teal, svg ellipse.c-teal { fill: #085041; stroke: #5DCAA5; }
  svg .c-teal text.th, svg .c-teal text.t { fill: #9FE1CB; }
  svg .c-teal text.ts { fill: #5DCAA5; }

  svg .c-coral > rect, svg .c-coral > circle, svg .c-coral > ellipse,
  svg rect.c-coral, svg circle.c-coral, svg ellipse.c-coral { fill: #712B13; stroke: #F0997B; }
  svg .c-coral text.th, svg .c-coral text.t { fill: #F5C4B3; }
  svg .c-coral text.ts { fill: #F0997B; }

  svg .c-pink > rect, svg .c-pink > circle, svg .c-pink > ellipse,
  svg rect.c-pink, svg circle.c-pink, svg ellipse.c-pink { fill: #72243E; stroke: #ED93B1; }
  svg .c-pink text.th, svg .c-pink text.t { fill: #F4C0D1; }
  svg .c-pink text.ts { fill: #ED93B1; }

  svg .c-gray > rect, svg .c-gray > circle, svg .c-gray > ellipse,
  svg rect.c-gray, svg circle.c-gray, svg ellipse.c-gray { fill: #444441; stroke: #B4B2A9; }
  svg .c-gray text.th, svg .c-gray text.t { fill: #D3D1C7; }
  svg .c-gray text.ts { fill: #B4B2A9; }

  svg .c-blue > rect, svg .c-blue > circle, svg .c-blue > ellipse,
  svg rect.c-blue, svg circle.c-blue, svg ellipse.c-blue { fill: #0C447C; stroke: #85B7EB; }
  svg .c-blue text.th, svg .c-blue text.t { fill: #B5D4F4; }
  svg .c-blue text.ts { fill: #85B7EB; }

  svg .c-green > rect, svg .c-green > circle, svg .c-green > ellipse,
  svg rect.c-green, svg circle.c-green, svg ellipse.c-green { fill: #27500A; stroke: #97C459; }
  svg .c-green text.th, svg .c-green text.t { fill: #C0DD97; }
  svg .c-green text.ts { fill: #97C459; }

  svg .c-amber > rect, svg .c-amber > circle, svg .c-amber > ellipse,
  svg rect.c-amber, svg circle.c-amber, svg ellipse.c-amber { fill: #633806; stroke: #EF9F27; }
  svg .c-amber text.th, svg .c-amber text.t { fill: #FAC775; }
  svg .c-amber text.ts { fill: #EF9F27; }

  svg .c-red > rect, svg .c-red > circle, svg .c-red > ellipse,
  svg rect.c-red, svg circle.c-red, svg ellipse.c-red { fill: #791F1F; stroke: #F09595; }
  svg .c-red text.th, svg .c-red text.t { fill: #F7C1C1; }
  svg .c-red text.ts { fill: #F09595; }
}
`;

// ─── Injected CSS: Form Element Styles (Layer 5) ─────────────────────
const FORM_STYLES_CSS = `
* { box-sizing: border-box; margin: 0; }

html { background: transparent; }

body {
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.7;
  color: var(--color-text-primary);
  background: transparent;
  -webkit-font-smoothing: antialiased;
}

button {
  font-family: inherit;
  font-size: 14px;
  padding: 6px 16px;
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-md);
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
button:hover { background: var(--color-background-secondary); }
button:active { transform: scale(0.98); }

input[type="text"],
input[type="number"],
input[type="email"],
input[type="search"],
textarea,
select {
  font-family: inherit;
  font-size: 14px;
  padding: 6px 12px;
  height: 36px;
  border: 0.5px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-md);
  background: var(--color-background-primary);
  color: var(--color-text-primary);
  transition: border-color 0.15s;
}
input:hover, textarea:hover, select:hover { border-color: var(--color-border-secondary); }
input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--color-border-primary);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
}
textarea { height: auto; min-height: 80px; resize: vertical; }
input::placeholder, textarea::placeholder { color: var(--color-text-tertiary); }

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--color-border-tertiary);
  border-radius: 2px;
  border: none;
  outline: none;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--color-background-primary);
  border: 0.5px solid var(--color-border-secondary);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
input[type="range"]::-moz-range-thumb {
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--color-background-primary);
  border: 0.5px solid var(--color-border-secondary);
  cursor: pointer;
}

input[type="checkbox"], input[type="radio"] {
  width: 16px; height: 16px;
  accent-color: var(--color-text-info);
}

a { color: var(--color-text-info); text-decoration: none; }
a:hover { text-decoration: underline; }

/* First render: stagger all children */
#content.initial-render > * {
  animation: fadeSlideIn 0.4s ease-out both;
}
#content.initial-render > *:nth-child(1) { animation-delay: 0s; }
#content.initial-render > *:nth-child(2) { animation-delay: 0.06s; }
#content.initial-render > *:nth-child(3) { animation-delay: 0.12s; }
#content.initial-render > *:nth-child(4) { animation-delay: 0.18s; }
#content.initial-render > *:nth-child(5) { animation-delay: 0.24s; }
#content.initial-render > *:nth-child(n+6) { animation-delay: 0.3s; }

/* Subsequent morphs: only new elements animate in */
.morph-enter {
  animation: fadeSlideIn 0.4s ease-out both;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
`;

// ─── Injected JS: Idiomorph DOM Morphing Library (Layer 0) ───────────
// idiomorph v0.3.0 — https://github.com/bigskysoftware/idiomorph
// Inlined to avoid CDN network request inside sandboxed iframe.
const IDIOMORPH_JS = `var Idiomorph=function(){"use strict";let o=new Set;let n={morphStyle:"outerHTML",callbacks:{beforeNodeAdded:t,afterNodeAdded:t,beforeNodeMorphed:t,afterNodeMorphed:t,beforeNodeRemoved:t,afterNodeRemoved:t,beforeAttributeUpdated:t},head:{style:"merge",shouldPreserve:function(e){return e.getAttribute("im-preserve")==="true"},shouldReAppend:function(e){return e.getAttribute("im-re-append")==="true"},shouldRemove:t,afterHeadMorphed:t}};function e(e,t,n={}){if(e instanceof Document){e=e.documentElement}if(typeof t==="string"){t=k(t)}let l=y(t);let r=p(e,l,n);return a(e,l,r)}function a(r,i,o){if(o.head.block){let t=r.querySelector("head");let n=i.querySelector("head");if(t&&n){let e=c(n,t,o);Promise.all(e).then(function(){a(r,i,Object.assign(o,{head:{block:false,ignore:true}}))});return}}if(o.morphStyle==="innerHTML"){l(i,r,o);return r.children}else if(o.morphStyle==="outerHTML"||o.morphStyle==null){let e=M(i,r,o);let t=e?.previousSibling;let n=e?.nextSibling;let l=d(r,e,o);if(e){return N(t,l,n)}else{return[]}}else{throw"Do not understand how to morph style "+o.morphStyle}}function u(e,t){return t.ignoreActiveValue&&e===document.activeElement}function d(e,t,n){if(n.ignoreActive&&e===document.activeElement){}else if(t==null){if(n.callbacks.beforeNodeRemoved(e)===false)return e;e.remove();n.callbacks.afterNodeRemoved(e);return null}else if(!g(e,t)){if(n.callbacks.beforeNodeRemoved(e)===false)return e;if(n.callbacks.beforeNodeAdded(t)===false)return e;e.parentElement.replaceChild(t,e);n.callbacks.afterNodeAdded(t);n.callbacks.afterNodeRemoved(e);return t}else{if(n.callbacks.beforeNodeMorphed(e,t)===false)return e;if(e instanceof HTMLHeadElement&&n.head.ignore){}else if(e instanceof HTMLHeadElement&&n.head.style!=="morph"){c(t,e,n)}else{r(t,e,n);if(!u(e,n)){l(t,e,n)}}n.callbacks.afterNodeMorphed(e,t);return e}}function l(n,l,r){let i=n.firstChild;let o=l.firstChild;let a;while(i){a=i;i=a.nextSibling;if(o==null){if(r.callbacks.beforeNodeAdded(a)===false)return;l.appendChild(a);r.callbacks.afterNodeAdded(a);H(r,a);continue}if(b(a,o,r)){d(o,a,r);o=o.nextSibling;H(r,a);continue}let e=A(n,l,a,o,r);if(e){o=v(o,e,r);d(e,a,r);H(r,a);continue}let t=S(n,l,a,o,r);if(t){o=v(o,t,r);d(t,a,r);H(r,a);continue}if(r.callbacks.beforeNodeAdded(a)===false)return;l.insertBefore(a,o);r.callbacks.afterNodeAdded(a);H(r,a)}while(o!==null){let e=o;o=o.nextSibling;T(e,r)}}function f(e,t,n,l){if(e==="value"&&l.ignoreActiveValue&&t===document.activeElement){return true}return l.callbacks.beforeAttributeUpdated(e,t,n)===false}function r(t,n,l){let e=t.nodeType;if(e===1){const r=t.attributes;const i=n.attributes;for(const o of r){if(f(o.name,n,"update",l)){continue}if(n.getAttribute(o.name)!==o.value){n.setAttribute(o.name,o.value)}}for(let e=i.length-1;0<=e;e--){const a=i[e];if(f(a.name,n,"remove",l)){continue}if(!t.hasAttribute(a.name)){n.removeAttribute(a.name)}}}if(e===8||e===3){if(n.nodeValue!==t.nodeValue){n.nodeValue=t.nodeValue}}if(!u(n,l)){s(t,n,l)}}function i(t,n,l,r){if(t[l]!==n[l]){let e=f(l,n,"update",r);if(!e){n[l]=t[l]}if(t[l]){if(!e){n.setAttribute(l,t[l])}}else{if(!f(l,n,"remove",r)){n.removeAttribute(l)}}}}function s(n,l,r){if(n instanceof HTMLInputElement&&l instanceof HTMLInputElement&&n.type!=="file"){let e=n.value;let t=l.value;i(n,l,"checked",r);i(n,l,"disabled",r);if(!n.hasAttribute("value")){if(!f("value",l,"remove",r)){l.value="";l.removeAttribute("value")}}else if(e!==t){if(!f("value",l,"update",r)){l.setAttribute("value",e);l.value=e}}}else if(n instanceof HTMLOptionElement){i(n,l,"selected",r)}else if(n instanceof HTMLTextAreaElement&&l instanceof HTMLTextAreaElement){let e=n.value;let t=l.value;if(f("value",l,"update",r)){return}if(e!==t){l.value=e}if(l.firstChild&&l.firstChild.nodeValue!==e){l.firstChild.nodeValue=e}}}function c(e,t,l){let r=[];let i=[];let o=[];let a=[];let u=l.head.style;let d=new Map;for(const n of e.children){d.set(n.outerHTML,n)}for(const s of t.children){let e=d.has(s.outerHTML);let t=l.head.shouldReAppend(s);let n=l.head.shouldPreserve(s);if(e||n){if(t){i.push(s)}else{d.delete(s.outerHTML);o.push(s)}}else{if(u==="append"){if(t){i.push(s);a.push(s)}}else{if(l.head.shouldRemove(s)!==false){i.push(s)}}}}a.push(...d.values());m("to append: ",a);let f=[];for(const c of a){m("adding: ",c);let n=document.createRange().createContextualFragment(c.outerHTML).firstChild;m(n);if(l.callbacks.beforeNodeAdded(n)!==false){if(n.href||n.src){let t=null;let e=new Promise(function(e){t=e});n.addEventListener("load",function(){t()});f.push(e)}t.appendChild(n);l.callbacks.afterNodeAdded(n);r.push(n)}}for(const h of i){if(l.callbacks.beforeNodeRemoved(h)!==false){t.removeChild(h);l.callbacks.afterNodeRemoved(h)}}l.head.afterHeadMorphed(t,{added:r,kept:o,removed:i});return f}function m(){}function t(){}function h(e){let t={};Object.assign(t,n);Object.assign(t,e);t.callbacks={};Object.assign(t.callbacks,n.callbacks);Object.assign(t.callbacks,e.callbacks);t.head={};Object.assign(t.head,n.head);Object.assign(t.head,e.head);return t}function p(e,t,n){n=h(n);return{target:e,newContent:t,config:n,morphStyle:n.morphStyle,ignoreActive:n.ignoreActive,ignoreActiveValue:n.ignoreActiveValue,idMap:C(e,t),deadIds:new Set,callbacks:n.callbacks,head:n.head}}function b(e,t,n){if(e==null||t==null){return false}if(e.nodeType===t.nodeType&&e.tagName===t.tagName){if(e.id!==""&&e.id===t.id){return true}else{return L(n,e,t)>0}}return false}function g(e,t){if(e==null||t==null){return false}return e.nodeType===t.nodeType&&e.tagName===t.tagName}function v(t,e,n){while(t!==e){let e=t;t=t.nextSibling;T(e,n)}H(n,e);return e.nextSibling}function A(n,e,l,r,i){let o=L(i,l,e);let t=null;if(o>0){let e=r;let t=0;while(e!=null){if(b(l,e,i)){return e}t+=L(i,e,n);if(t>o){return null}e=e.nextSibling}}return t}function S(e,t,n,l,r){let i=l;let o=n.nextSibling;let a=0;while(i!=null){if(L(r,i,e)>0){return null}if(g(n,i)){return i}if(g(o,i)){a++;o=o.nextSibling;if(a>=2){return null}}i=i.nextSibling}return i}function k(n){let l=new DOMParser;let e=n.replace(/<svg(\\s[^>]*>|>)([\\s\\S]*?)<\\/svg>/gim,"");if(e.match(/<\\/html>/)||e.match(/<\\/head>/)||e.match(/<\\/body>/)){let t=l.parseFromString(n,"text/html");if(e.match(/<\\/html>/)){t.generatedByIdiomorph=true;return t}else{let e=t.firstChild;if(e){e.generatedByIdiomorph=true;return e}else{return null}}}else{let e=l.parseFromString("<body><template>"+n+"</template></body>","text/html");let t=e.body.querySelector("template").content;t.generatedByIdiomorph=true;return t}}function y(e){if(e==null){const t=document.createElement("div");return t}else if(e.generatedByIdiomorph){return e}else if(e instanceof Node){const t=document.createElement("div");t.append(e);return t}else{const t=document.createElement("div");for(const n of[...e]){t.append(n)}return t}}function N(e,t,n){let l=[];let r=[];while(e!=null){l.push(e);e=e.previousSibling}while(l.length>0){let e=l.pop();r.push(e);t.parentElement.insertBefore(e,t)}r.push(t);while(n!=null){l.push(n);r.push(n);n=n.nextSibling}while(l.length>0){t.parentElement.insertBefore(l.pop(),t.nextSibling)}return r}function M(e,t,n){let l;l=e.firstChild;let r=l;let i=0;while(l){let e=w(l,t,n);if(e>i){r=l;i=e}l=l.nextSibling}return r}function w(e,t,n){if(g(e,t)){return.5+L(n,e,t)}return 0}function T(e,t){H(t,e);if(t.callbacks.beforeNodeRemoved(e)===false)return;e.remove();t.callbacks.afterNodeRemoved(e)}function E(e,t){return!e.deadIds.has(t)}function x(e,t,n){let l=e.idMap.get(n)||o;return l.has(t)}function H(e,t){let n=e.idMap.get(t)||o;for(const l of n){e.deadIds.add(l)}}function L(e,t,n){let l=e.idMap.get(t)||o;let r=0;for(const i of l){if(E(e,i)&&x(e,i,n)){++r}}return r}function R(e,n){let l=e.parentElement;let t=e.querySelectorAll("[id]");for(const r of t){let t=r;while(t!==l&&t!=null){let e=n.get(t);if(e==null){e=new Set;n.set(t,e)}e.add(r.id);t=t.parentElement}}}function C(e,t){let n=new Map;R(e,n);R(t,n);return n}return{morph:e,defaults:n}}();`;

// ─── Injected JS: Bridge Functions + Auto-Resize (Layers 1 & 6) ─────
const BRIDGE_JS = `
// Bridge: sendPrompt
window.sendPrompt = function(text) {
  window.parent.postMessage({ type: 'send-prompt', text: text }, '*');
};

// Bridge: openLink
window.openLink = function(url) {
  window.parent.postMessage({ type: 'open-link', url: url }, '*');
};

// Intercept <a> clicks
document.addEventListener('click', function(e) {
  var a = e.target.closest('a[href]');
  if (a && a.href.startsWith('http')) {
    e.preventDefault();
    window.parent.postMessage({ type: 'open-link', url: a.href }, '*');
  }
});

// Listen for streaming content updates from parent
window.addEventListener('message', function(e) {
  if (e.source !== window.parent) return;
  if (e.data && e.data.type === 'update-content') {
    var content = document.getElementById('content');
    if (!content) return;

    // Strip script tags from HTML before inserting — scripts are handled separately below
    var tmp = document.createElement('div');
    tmp.innerHTML = e.data.html;
    var incomingScripts = [];
    tmp.querySelectorAll('script').forEach(function(s) {
      incomingScripts.push({ src: s.src, text: s.textContent });
      s.remove();
    });

    // First render: add stagger class for initial entrance animation
    var isFirstRender = !content.hasAttribute('data-has-content');
    if (isFirstRender) {
      content.classList.add('initial-render');
      content.setAttribute('data-has-content', '1');
      setTimeout(function() { content.classList.remove('initial-render'); }, 800);
    }

    // Use idiomorph to diff/patch DOM (preserves existing nodes, no flicker)
    if (window.Idiomorph) {
      try {
        Idiomorph.morph(content, tmp.innerHTML, {
          morphStyle: 'innerHTML',
          callbacks: {
            beforeNodeAdded: function(node) {
              // Tag new element nodes for entrance animation
              if (node.nodeType === 1) {
                node.classList.add('morph-enter');
              }
            }
          }
        });
      } catch (err) {
        // Fallback: full replacement on morph failure
        content.innerHTML = tmp.innerHTML;
      }
    } else {
      content.innerHTML = tmp.innerHTML;
    }

    // Execute only new scripts (not previously executed)
    incomingScripts.forEach(function(scriptInfo) {
      var key = scriptInfo.src || scriptInfo.text;
      if (content.getAttribute('data-exec-' + btoa(key).slice(0, 16))) return;
      content.setAttribute('data-exec-' + btoa(key).slice(0, 16), '1');
      var newScript = document.createElement('script');
      if (scriptInfo.src) {
        newScript.src = scriptInfo.src;
      } else {
        newScript.textContent = scriptInfo.text;
      }
      content.appendChild(newScript);
    });
    reportHeight();
  }
});

// Auto-resize: report content height to host
function reportHeight() {
  var content = document.getElementById('content');
  var h = content ? content.offsetHeight : document.documentElement.scrollHeight;
  window.parent.postMessage({ type: 'widget-resize', height: h }, '*');
}
var ro = new ResizeObserver(reportHeight);
ro.observe(document.getElementById('content') || document.body);
window.addEventListener('load', reportHeight);
// Periodic reports during initial load
var _resizeInterval = setInterval(reportHeight, 200);
setTimeout(function() { clearInterval(_resizeInterval); }, 15000);
`;

// ─── Document Assembly ───────────────────────────────────────────────
/** Empty shell or shell with initial content — iframe loads once, content streamed via postMessage */
function assembleShell(initialHtml: string = ""): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'unsafe-inline' 'unsafe-eval'
      https://cdnjs.cloudflare.com
      https://esm.sh
      https://cdn.jsdelivr.net
      https://unpkg.com;
    style-src 'unsafe-inline';
    img-src 'self' data: blob:;
    font-src 'self' data:;
    connect-src 'self';
  ">
  <style>
    ${THEME_CSS}
    ${SVG_CLASSES_CSS}
    ${FORM_STYLES_CSS}
  </style>
</head>
<body>
  <div id="content">
    ${initialHtml}
  </div>
  <script>${IDIOMORPH_JS}</script>
  <script>
    ${BRIDGE_JS}
  </script>
</body>
</html>`;
}

// ─── Loading Phrases ─────────────────────────────────────────────────
const LOADING_PHRASES = [
  "Sketching pixels",
  "Wiring up nodes",
  "Painting gradients",
  "Compiling visuals",
  "Arranging atoms",
  "Rendering magic",
  "Polishing edges",
];

function useLoadingPhrase(active: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % LOADING_PHRASES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [active]);
  return LOADING_PHRASES[index];
}

// ─── React Component ─────────────────────────────────────────────────

export function WidgetRenderer({ title, description, html }: WidgetRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(0);
  const [loaded, setLoaded] = useState(false);
  // Whether the iframe shell has been initialized
  const shellReadyRef = useRef(false);
  // Track the last html sent to the iframe to avoid redundant updates
  const committedHtmlRef = useRef("");
  // Tracks whether html content has settled (stopped changing)
  const [htmlSettled, setHtmlSettled] = useState(false);
  const [prevHtml, setPrevHtml] = useState(html);
  const settledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fadingOut, setFadingOut] = useState(false);

  const handleMessage = useCallback((e: MessageEvent) => {
    // Only handle messages from our own iframe
    if (
      iframeRef.current &&
      e.source === iframeRef.current.contentWindow &&
      e.data?.type === "widget-resize" &&
      typeof e.data.height === "number"
    ) {
      setHeight(Math.max(50, Math.min(e.data.height + 8, 4000)));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Reset settled/fade state when html changes (adjust state during render)
  if (html !== prevHtml) {
    setPrevHtml(html);
    setHtmlSettled(false);
    setFadingOut(false);
  }

  // Initialize the iframe shell once when html first appears.
  // Shell loads EMPTY so partial streaming fragments (e.g. unclosed <style>)
  // can't break the bridge script. All content is streamed via postMessage.
  useEffect(() => {
    if (!html || !iframeRef.current) return;

    if (!shellReadyRef.current) {
      shellReadyRef.current = true;
      iframeRef.current.srcdoc = assembleShell();
      return;
    }

    // Wait for iframe to load before sending postMessage
    if (!loaded) return;

    // Stream content into existing iframe via postMessage
    if (html === committedHtmlRef.current) return;
    committedHtmlRef.current = html;

    const iframe = iframeRef.current;
    if (iframe.contentWindow) {
      // targetOrigin "*" is required: the sandboxed iframe (allow-scripts only,
      // no allow-same-origin) has a null origin, so no specific origin can be used.
      iframe.contentWindow.postMessage(
        { type: "update-content", html },
        "*"
      );
    }
  }, [html, loaded]);

  // Detect when html has stopped changing (streaming complete).
  // Resets a debounce timer on every html update — settles after 800ms of no changes.
  useEffect(() => {
    if (!html) return;
    if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    settledTimerRef.current = setTimeout(() => {
      setHtmlSettled(true);
      setFadingOut(true);
      fadeTimerRef.current = setTimeout(() => {
        setFadingOut(false);
      }, 600);
    }, 800);
    return () => {
      if (settledTimerRef.current) clearTimeout(settledTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [html]);

  // Fallback: if iframe has html but hasn't reported a height after 4s, force-show
  useEffect(() => {
    if (!html || (loaded && height > 0)) return;
    const timeout = setTimeout(() => {
      setLoaded(true);
      setHeight((h) => (h > 0 ? h : 500));
    }, 4000);
    return () => clearTimeout(timeout);
  }, [html, loaded, height]);

  // Show the iframe as soon as we have html (shell initializes on first html)
  const showIframe = !!html;
  // Streaming is active until html has stopped changing
  const isStreaming = !!html && !htmlSettled;
  const loadingPhrase = useLoadingPhrase(isStreaming);
  const showStreamingIndicator = isStreaming || fadingOut;

  return (
    <div className="w-full my-3">
      {/* Loading phrases — sits above the widget, fades out when ready */}
      {showStreamingIndicator && (
        <div
          className="mb-2 transition-all duration-500 ease-out"
          style={{
            opacity: isStreaming ? 1 : 0,
            maxHeight: isStreaming ? 32 : 0,
            overflow: "hidden",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "2px solid var(--color-border-light, rgba(0,0,0,0.1))",
                borderTopColor: "var(--color-lilac-dark, #6366f1)",
                animation: "spin 0.8s linear infinite",
                flexShrink: 0,
              }}
            />
            <span
              className="text-[12px] font-medium"
              style={{ color: "var(--text-secondary, #666)" }}
            >
              {loadingPhrase}...
            </span>
          </div>
        </div>
      )}

      <SaveTemplateOverlay
        title={title}
        description={description}
        html={html}
        componentType="widgetRenderer"
        ready={!!html && htmlSettled}
      >
        {/* Iframe: always mounted so ref is stable; srcdoc set once,
            content streamed via postMessage for progressive rendering. */}
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          className="w-full border-0"
          onLoad={() => setLoaded(true)}
          style={{
            height: showIframe ? (height > 0 ? height : 300) : 0,
            overflow: "hidden",
            background: "transparent",
            opacity: showIframe ? 1 : 0,
            transition: "height 200ms ease-out",
            display: html ? undefined : "none",
          }}
          title={title}
        />
      </SaveTemplateOverlay>
    </div>
  );
}
