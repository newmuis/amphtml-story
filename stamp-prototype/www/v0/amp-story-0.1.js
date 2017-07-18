(self.AMP=self.AMP||[]).push({n:"amp-story",v:"1498757212170",f:(function(AMP){var e,l="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){if(c.get||c.set)throw new TypeError("ES3 does not support getters and setters.");a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value)},m=function(a){return"undefined"!=typeof window&&window===a?a:"undefined"!=typeof global?global:a}(this);function p(){p=function(){};m.Symbol||(m.Symbol=aa)}var ba=0;function aa(a){return"jscomp_symbol_"+(a||"")+ba++}
function q(){p();var a=m.Symbol.iterator;a||(a=m.Symbol.iterator=m.Symbol("iterator"));"function"!=typeof Array.prototype[a]&&l(Array.prototype,a,{configurable:!0,writable:!0,value:function(){return t(this)}});q=function(){}}function t(a){var b=0;return ca(function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}})}function ca(a){q();var b={next:a};b[m.Symbol.iterator]=function(){return this};return b}function u(a){q();var b=a[Symbol.iterator];return b?b.call(a):t(a)}
function v(a,b){function c(){}c.prototype=b.prototype;a.prototype=new c;a.prototype.constructor=a;for(var d in b)if(Object.defineProperties){var f=Object.getOwnPropertyDescriptor(b,d);f&&Object.defineProperty(a,d,f)}else a[d]=b[d]};Date.now();self.log=self.log||{user:null,dev:null};var x=self.log;function y(){if(x.user)return x.user;throw Error("failed to call initLogConstructor");}function z(){if(x.dev)return x.dev;throw Error("failed to call initLogConstructor");};function da(a){if(a.nodeType){var b=(a.ownerDocument||a).defaultView;if(b=b!=(b.__AMP_TOP||b)&&A(b,"url-replace")?C(b,"url-replace"):null)return b}b=D(a);b=D(b);b=b.isSingleDoc()?b.win:b;return C(b,"url-replace")}function E(a,b){a=a.__AMP_TOP||a;return C(a,b)}function D(a){return a.nodeType?E((a.ownerDocument||a).defaultView,"ampdoc").getAmpDoc(a):a}
function C(a,b){A(a,b);var c=a.services;c||(c=a.services={});var d=c;a=d[b];a.obj||(a.obj=new a.ctor(a.context),a.ctor=null,a.context=null,a.resolve&&a.resolve(a.obj));return a.obj}function A(a,b){a=a.services&&a.services[b];return!(!a||!a.ctor&&!a.obj)};Promise.resolve();var ea={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},fa=/(&|<|>|"|'|`)/g;function F(a,b,c){a=a.createElement(b);for(var d in c)a.setAttribute(d,c[d]);return a}function ga(a,b,c){for(var d=a;d&&d!==c;d=d.parentElement)if(b(d))return d;return null}function ha(a){return ea[a]};var G,H="Webkit webkit Moz moz ms O o".split(" ");function ia(a){var b=!1,c=null;return function(){b||(c=a(),b=!0);return c}};var I={"align-content":"alignContent","align-items":"alignItems","align-self":"alignSelf","grid-area":"gridArea","justify-content":"justifyContent","justify-items":"justifyItems","justify-self":"justifySelf"},ja=Object.keys(I).map(function(a){return"["+a+"]"}).join(",");function J(a){AMP.BaseElement.apply(this,arguments)}v(J,AMP.BaseElement);
J.prototype.buildCallback=function(){for(var a=this.element.querySelectorAll(ja),b=u(a),c=b.next();!c.done;c=b.next())for(var c=c.value,d=c.attributes.length-1;0<=d;d--){var f=c.attributes[d],w=f.name.toLowerCase(),n=I[w];n&&(c.style[n]=f.value,c.removeAttribute(w))}};J.prototype.isLayoutSupported=function(a){return"container"==a};AMP.registerElement("amp-story-grid-layer",J);function K(a){AMP.BaseElement.apply(this,arguments)}v(K,AMP.BaseElement);K.prototype.isLayoutSupported=function(a){return"container"==a};AMP.registerElement("amp-story-page",K);function L(a){this.b=a;this.g=!1;this.a=null}
L.prototype.build=function(){if(this.g)return this.getRoot();this.g=!0;this.a=this.b.document.createElement("section");this.a.classList.add("i-amp-story-bookend");this.a.innerHTML='<h3 class="i-amp-story-bookend-heading">Share the story</h3>\n    <ul class="i-amp-story-bookend-share">\n      <li>\n        <div class="i-amp-story-bookend-share-icon">\n          <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24">\n        <path fill="none" d="M0 0h24v24H0V0z"/>\n        <path d="M23 11h-2V9h-2v2h-2v2h2v2h2v-2h2zM8 11v2.4h3.97c-.16 1.03-1.2 3.02-3.97 3.02-2.39 0-4.34-1.98-4.34-4.42S5.61 7.58 8 7.58c1.36 0 2.27.58 2.79 1.08l1.9-1.83C11.47 5.69 9.89 5 8 5c-3.87 0-7 3.13-7 7s3.13 7 7 7c4.04 0 6.72-2.84 6.72-6.84 0-.46-.05-.81-.11-1.16H8z"/>\n        <path fill="none" d="M1 5h14v14H1z"/>\n      </svg>\n        </div>\n      </li>\n      <li>\n        <div class="i-amp-story-bookend-share-icon">\n          <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24">\n        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>\n        <path d="M0 0h24v24H0z" fill="none"/>\n      </svg>\n        </div>\n      </li>\n      <li>\n        <div class="i-amp-story-bookend-share-icon">\n          <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="#000000">\n        <path d="M0 0h24v24H0z" fill="none"/>\n        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>\n      </svg>\n        </div>\n      </li>\n    </ul>';return this.getRoot()};
L.prototype.isBuilt=function(){return this.g};L.prototype.setRelatedArticles=function(a){var b=this;this.isBuilt();var c=this.b.document.createDocumentFragment();a.forEach(function(a){return c.appendChild(ka(b,a))});this.getRoot().appendChild(c)};function ka(a,b){var c=a.b.document.createDocumentFragment();b.heading&&c.appendChild(la(a,b.heading));c.appendChild(ma(a,b.articles));return c}
function ma(a,b){var c=F(a.b.document,"div",{"class":"i-amp-story-bookend-article-set"});b.forEach(function(b){return c.appendChild(na(a,b))});return c}function la(a,b){var c=F(a.b.document,"h3",{"class":"i-amp-story-bookend-heading"});a=(a=b)?a.replace(fa,ha):a;c.innerText=a;return c}
function na(a,b){a=a.b.document.createElement("article");a.innerHTML=(b.image?'<div class="i-amp-story-bookend-article-image">\n        <img src="'+b.image+'"\n            width="116"\n            height="116">\n        </img>\n      </div>':"")+'\n      <h2 class="i-amp-story-bookend-article-heading">\n        '+b.title+'\n      </h2>\n      <div class="i-amp-story-bookend-article-meta">\n        example.com - 10 mins\n      </div>';return a}L.prototype.getRoot=function(){this.isBuilt();return this.a};function M(a,b){b?a.setAttribute("hidden","hidden"):a.removeAttribute("hidden")}function N(a){this.b=a;this.g=!1;this.a=null;this.s=!1;this.o=this.i=this.j=null}e=N.prototype;
e.build=function(){if(this.g)return this.getRoot();this.g=!0;this.a=this.b.document.createElement("aside");this.a.classList.add("i-amp-story-system-layer");this.a.innerHTML='<div class="i-amp-story-progress">\n      <div class="i-amp-story-progress-bar"></div>\n      <div class="i-amp-story-progress-value"></div>\n    </div>\n    <div class="i-amp-story-ui-right">\n      <div role="button" class="i-amp-story-exit-fullscreen i-amp-story-button" hidden>\n        <svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">\n          <path d="M0 0h24v24H0z" fill="none"/>\n          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>\n        </svg>\n      </div>\n      <div div role="button" class="i-amp-story-bookend-close i-amp-story-button" hidden>\n        <svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">\n          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>\n          <path d="M0 0h24v24H0z" fill="none"/>\n        </svg>\n      </div role="button">\n    </nav>';this.j=
this.a.querySelector(".i-amp-story-exit-fullscreen");this.i=this.a.querySelector(".i-amp-story-bookend-close");this.o=this.a.querySelector(".i-amp-story-progress-value");oa(this);return this.getRoot()};function oa(a){a.j.addEventListener("click",function(b){O(a,"ampstory:exitfullscreen",b)});a.i.addEventListener("click",function(b){O(a,"ampstory:closebookend",b)})}e.getRoot=function(){return this.a};e.setInFullScreen=function(a){this.s=a;pa(this,a)};
function pa(a,b){E(a.b,"vsync").mutate(function(){M(a.j,!b)})}e.toggleCloseBookendButton=function(a){var b=this;E(this.b,"vsync").mutate(function(){M(b.i,!a)})};function O(a,b,c){c&&c.stopPropagation();a=a.getRoot();var d=new Event(b,{bubbles:!0});d.initEvent&&d.initEvent(b,!0);a.dispatchEvent(d)}
e.updateProgressBar=function(a,b){var c=this,d=a/b;E(this.b,"vsync").mutate(function(){var a=c.o,b={transform:"scale("+(d+",1")+")"},n;for(n in b){var Q=a,qa=b[n],h;h=Q.style;var k=n;if(2>k.length?0:0==k.lastIndexOf("--",0))h=k;else{G||(G=Object.create(null));var r=G[k];if(!r){r=k;if(void 0===h[k]){var g;g=k;g=g.charAt(0).toUpperCase()+g.slice(1);b:{for(var B=0;B<H.length;B++){var R=H[B]+g;if(void 0!==h[R]){g=R;break b}}g=""}void 0!==h[g]&&(r=g)}G[k]=r}h=r}h&&(Q.style[h]=qa)}})};function ra(a){var b={title:y().assert(a.title),url:y().assert(a.url)};a.image&&(b.image=a.image);return b}function sa(a){return Object.keys(a).map(function(b){var c={articles:a[b].map(ra)};b.trim().length&&(c.heading=b);return c})};function ta(a){return!!(a.requestFullscreen||a.webkitRequestFullScreen||a.mozRequestFullScreen||a.msRequestFullscreen)};function P(a){var b=this;AMP.BaseElement.call(this,a);this.l=!0;this.w=this.getVsync();this.f=new L(this.win);this.c=new N(this.win);this.h=!1;this.m=[];this.u=ia(function(){return ua(b)})}v(P,AMP.BaseElement);e=P.prototype;
e.buildCallback=function(){var a=this;this.element.appendChild(this.c.build());this.element.addEventListener("click",this.v.bind(this),!0);this.element.addEventListener("ampstory:exitfullscreen",function(){S(a,!0)});this.element.addEventListener("ampstory:closebookend",function(){va(a)});this.win.document.addEventListener("keydown",function(b){switch(b.keyCode){case 37:T(a);break;case 39:U(a)}},!0);var b=y().assertElement(this.element.querySelector("amp-story-page"),"Story must have at least one page.");
b.setAttribute("active","");this.scheduleResume(b);for(var c=this.element.querySelectorAll("amp-video"),d=u(c),f=d.next();!f.done;f=d.next()){var w=f.value;w.setAttribute("autoplay","")}};e.layoutCallback=function(){V(this);return Promise.resolve()};e.isLayoutSupported=function(a){return"container"==a};function W(a){var b=a.element.querySelector("amp-story-page[active]");return b}
function X(a){var b=W(a),c=b.getAttribute("advance-to");return c?y().assert(a.element.querySelector("amp-story-page#"+c),'Page "'+b.id+'" refers to page "'+c+'", but no such page exists.'):b.nextElementSibling===a.c.getRoot()||Y(a,b.nextElementSibling)?null:b.nextElementSibling}function U(a){var b=W(a),c=X(a);c?Z(a,c).then(function(){return a.m.push(b)}).then(function(){return V(a)}):wa(a)}function T(a){var b=a.m.pop();b&&Z(a,b)}
function Z(a,b){if(!a.h){var c=W(a);ta(a.element)&&a.l&&xa(a);a.c.updateProgressBar(a.getPageIndex(b),a.getPageCount()-1);return a.mutateElement(function(){b.setAttribute("active","");c.removeAttribute("active")},b).then(function(){a.schedulePause(c);a.scheduleResume(b)})}}e.setAutoFullScreen=function(a){this.l=a};
function xa(a){a.c.setInFullScreen(!0);a=a.element;a.requestFullscreen?a.requestFullscreen():a.webkitRequestFullScreen?a.webkitRequestFullScreen():a.mozRequestFullScreen?a.mozRequestFullScreen():a.msRequestFullscreen?a.msRequestFullscreen():z().warn("Ignored fullscreen request.")}
function S(a,b){b&&a.setAutoFullScreen(!1);a.c.setInFullScreen(!1);a=a.element.ownerDocument;a.exitFullscreen?a.exitFullscreen():a.webkitExitFullscreen?a.webkitExitFullscreen():a.mozCancelFullScreen?a.mozCancelFullScreen():a.msExitFullscreen?a.msExitFullscreen():z().warn("Ignored fullscreen request.")}function wa(a){a.h||(a.f.isBuilt(),S(a),a.c.toggleCloseBookendButton(!0),a.h=!0,a.getVsync().mutate(function(){a.element.classList.add("i-amp-story-bookend-active");a.f.getRoot().scrollTop=0}))}
function va(a){a.c.toggleCloseBookendButton(!1);a.h=!1;a.getVsync().mutate(function(){a.element.classList.remove("i-amp-story-bookend-active")})}e.v=function(a){if(ya(this,a)){var b=.25*this.getViewport().getWidth();a.pageX>=b?U(this):T(this);a.stopPropagation()}};function V(a){var b=X(a);b?a.schedulePreload(b):za(a)}function za(a){a.f.isBuilt()||(a.element.appendChild(a.f.build()),a.u().then(function(b){null!==b&&a.f.setRelatedArticles(b)}))}
function ua(a){var b=Aa(a);return null===b?Promise.resolve(null):da(a.getAmpDoc()).expandAsync(y().assertString(b)).then(function(b){return E(a.win,"xhr").fetchJson(b)}).then(function(a){y().assert(a.ok,"Invalid HTTP response");return a.json()}).then(sa)}function Aa(a){return a.element.hasAttribute("related-articles")?a.element.getAttribute("related-articles"):null}
function ya(a,b){return!ga(b.target,function(b){var c;(c=b===a.c.getRoot()||Y(a,b))||(c=b.hasAttribute("on")&&b.getAttribute("on").match(/(^|;)\s*tap\s*:/));return c},a.element)}function Y(a,b){return a.f.isBuilt()&&b===a.f.getRoot()}e.getPages=function(){return this.element.querySelectorAll("amp-story-page")};e.getPageCount=function(){return this.getPages().length};e.getPageIndex=function(a){return Array.prototype.indexOf.call(this.getPages(),a)};AMP.registerElement("amp-story",P,'amp-story,amp-story-grid-layer,amp-story-page{contain:strict!important;overflow:hidden!important}amp-story{height:100%!important;position:relative!important;text-rendering:geometricPrecision!important;width:100%!important}body>amp-story{height:100vh!important}.i-amp-story-system-layer{background:-webkit-linear-gradient(top,rgba(0,0,0,.35),transparent);background:linear-gradient(to bottom,rgba(0,0,0,.35),transparent);position:absolute;top:0;left:0;right:0;height:44px;z-index:100000;padding:4px 0 0;box-sizing:border-box}.i-amp-story-ui-right{float:right}.i-amp-story-button{margin:0 8px;height:40px;width:40px;cursor:pointer;border-radius:40px;box-sizing:border-box;padding:8px}.i-amp-story-button:active{background:rgba(0,0,0,.2)}.i-amp-story-progress-bar,.i-amp-story-progress-value{position:absolute;left:0;right:0;top:0;height:4px}.i-amp-story-progress-bar{background:hsla(0,0%,100%,.25)}.i-amp-story-progress-value{background:#fff;width:100%;-webkit-transform:translateZ(0) scaleX(0);transform:translateZ(0) scaleX(0);-webkit-transition:-webkit-transform 0.3s ease;transition:-webkit-transform 0.3s ease;transition:transform 0.3s ease;transition:transform 0.3s ease,-webkit-transform 0.3s ease;-webkit-transform-origin:left;transform-origin:left;will-change:transform}[dir=rtl] .i-amp-story-progress-value{-webkit-transform-origin:right;transform-origin:right}amp-story-page{bottom:0!important;display:none!important;left:0!important;position:absolute!important;right:0!important;top:0!important}amp-story-page[active]{display:block!important}amp-story-grid-layer{bottom:0!important;display:-ms-grid!important;display:grid!important;left:0!important;position:absolute!important;right:0!important;top:0!important;padding:68px 32px 32px}amp-story-grid-layer *{box-sizing:border-box!important;margin:0!important}amp-story-grid-layer[template=fill]>:not(:first-child){display:none!important}amp-story-grid-layer[template=fill]>:first-child{bottom:0!important;display:block!important;height:auto!important;left:0!important;position:absolute!important;right:0!important;top:0!important;width:auto!important}amp-story-grid-layer[template=fill]>amp-anim img,amp-story-grid-layer[template=fill]>amp-img img,amp-story-grid-layer[template=fill]>amp-video video{-o-object-fit:cover!important;object-fit:cover!important}amp-story-grid-layer[template=vertical]{-webkit-align-content:start;-ms-flex-line-pack:start;align-content:start;grid-auto-flow:row!important;grid-gap:16px;-ms-grid-columns:100%!important;grid-template-columns:100%!important;-webkit-box-pack:stretch;-webkit-justify-content:stretch;-ms-flex-pack:stretch;justify-content:stretch;-ms-grid-column-align:start;justify-items:start}amp-story-grid-layer[template=vertical]>*{width:100%}amp-story-grid-layer[template=horizontal]{-webkit-align-content:stretch;-ms-flex-line-pack:stretch;align-content:stretch;-webkit-box-align:start;-webkit-align-items:start;-ms-flex-align:start;align-items:start;grid-auto-flow:column!important;grid-gap:16px;-ms-grid-rows:100%!important;grid-template-rows:100%!important;-webkit-box-pack:start;-webkit-justify-content:start;-ms-flex-pack:start;justify-content:start}amp-story-grid-layer[template=thirds]{-ms-grid-rows:(1fr)[3]!important;grid-template-rows:repeat(3,1fr)!important;grid-template-areas:"upper-third" "middle-third" "lower-third"!important}.i-amp-story-bookend{background:rgba(0,0,0,.85)!important;color:#fff;bottom:0!important;display:none!important;left:0!important;position:absolute;right:0!important;top:0!important;padding:44px 32px 32px;overflow:auto}.i-amp-story-bookend-active .i-amp-story-bookend{display:block!important}.i-amp-story-bookend-heading{text-transform:uppercase;padding:0 0 8px;margin:16px 0 8px;border-bottom:1px solid hsla(0,0%,100%,.25);font-weight:700;letter-spacing:0.83px}.i-amp-story-bookend-article-meta,.i-amp-story-bookend-heading{font-size:10px;color:hsla(0,0%,100%,.54);font-family:Roboto,sans-serif;line-height:1}.i-amp-story-bookend-article-meta{font-weight:300}.i-amp-story-bookend-article-set>article{margin:24px 0;overflow:hidden}.i-amp-story-bookend-article-set:last-child>article:last-child{margin-bottom:0}.i-amp-story-bookend-article-heading{font-family:Roboto,sans-serif;font-weight:300;font-size:16px;color:#ffff;line-height:1.4;margin:0 0 8px}.i-amp-story-bookend-article-image{width:116px;height:116px;float:right;margin-left:16px}.i-amp-story-bookend-heading+.i-amp-story-bookend-article-set{border-top:none}.i-amp-story-bookend-article-set{border-top:1px solid hsla(0,0%,100%,.25)}.i-amp-story-bookend-share-icon>svg{fill:#fff}.i-amp-story-bookend-share{margin:0;padding:0;list-style:none;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap}.i-amp-story-bookend-share-icon{box-sizing:border-box;padding:6px;margin:-6px;width:44px;height:44px}.i-amp-story-bookend-share>li{margin:16px 0;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-basis:33.333%;-ms-flex-preferred-size:33.333%;flex-basis:33.333%}.i-amp-story-bookend-share>li:nth-child(3n+2){-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center}.i-amp-story-bookend-share>li:nth-child(3n+3){-webkit-box-pack:end;-webkit-justify-content:flex-end;-ms-flex-pack:end;justify-content:flex-end}\n/*# sourceURL=/extensions/amp-story/0.1/amp-story.css*/');
})});
//# sourceMappingURL=amp-story-0.1.js.map
