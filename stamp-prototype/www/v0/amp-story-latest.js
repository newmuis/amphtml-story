(self.AMP=self.AMP||[]).push({n:"amp-story",v:"1498496027382",f:(function(AMP){var e,l="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){if(c.get||c.set)throw new TypeError("ES3 does not support getters and setters.");a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value)},p=function(a){return"undefined"!=typeof window&&window===a?a:"undefined"!=typeof global?global:a}(this);function q(){q=function(){};p.Symbol||(p.Symbol=r)}var u=0;function r(a){return"jscomp_symbol_"+(a||"")+u++}
function v(){q();var a=p.Symbol.iterator;a||(a=p.Symbol.iterator=p.Symbol("iterator"));"function"!=typeof Array.prototype[a]&&l(Array.prototype,a,{configurable:!0,writable:!0,value:function(){return w(this)}});v=function(){}}function w(a){var b=0;return x(function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}})}function x(a){v();var b={next:a};b[p.Symbol.iterator]=function(){return this};return b}function y(a){v();var b=a[Symbol.iterator];return b?b.call(a):w(a)}
function A(a,b){function c(){}c.prototype=b.prototype;a.prototype=new c;a.prototype.constructor=a;for(var d in b)if(Object.defineProperties){var f=Object.getOwnPropertyDescriptor(b,d);f&&Object.defineProperty(a,d,f)}else a[d]=b[d]};Date.now();self.log=self.log||{user:null,dev:null};var B=self.log;function C(){if(B.user)return B.user;throw Error("failed to call initLogConstructor");}function D(){if(B.dev)return B.dev;throw Error("failed to call initLogConstructor");};function E(a){a=a.__AMP_TOP||a;var b=a.services;b||(b=a.services={});a=b.vsync;a.obj||(a.obj=new a.ctor(a.context),a.ctor=null,a.context=null,a.resolve&&a.resolve(a.obj));return a.obj};function F(a,b,c){for(var d=a;d&&d!==c;d=d.parentElement)if(b(d))return d;return null};var G,H="Webkit webkit Moz moz ms O o".split(" ");var I={"align-content":"alignContent","align-items":"alignItems","align-self":"alignSelf","grid-area":"gridArea","justify-content":"justifyContent","justify-items":"justifyItems","justify-self":"justifySelf"},aa=Object.keys(I).map(function(a){return"["+a+"]"}).join(",");function J(a){AMP.BaseElement.apply(this,arguments)}A(J,AMP.BaseElement);
J.prototype.buildCallback=function(){for(var a=this.element.querySelectorAll(aa),b=y(a),c=b.next();!c.done;c=b.next())for(var c=c.value,d=c.attributes.length-1;0<=d;d--){var f=c.attributes[d],t=f.name.toLowerCase(),m=I[t];m&&(c.style[m]=f.value,c.removeAttribute(t))}};J.prototype.isLayoutSupported=function(a){return"container"==a};AMP.registerElement("amp-story-grid-layer",J);function K(a){AMP.BaseElement.apply(this,arguments)}A(K,AMP.BaseElement);K.prototype.isLayoutSupported=function(a){return"container"==a};AMP.registerElement("amp-story-page",K);var ba=[[{title:"This is India and the best places you should go",domainName:"apub.com",readingTimeMins:5,image:{url:"http://placekitten.com/g/200/200"}},{title:"A wonderful weekend with Tenturi",domainName:"apub.com",readingTimeMins:20,image:{url:"http://placekitten.com/g/220/220"}}],[{title:"Examining the moon",domainName:"apub.com",readingTimeMins:45},{title:"Architecture in the thousand-year capital",domainName:"apub.com",readingTimeMins:45}]];function L(a){this.c=a;this.g=!1;this.m=this.a=null}
L.prototype.build=function(){var a=this;if(this.g)return this.getRoot();this.g=!0;this.a=this.c.document.createElement("section");this.a.classList.add("i-amp-story-bookend");this.a.innerHTML='<h3 class="i-amp-story-bookend-heading">Share the story</h3>\n    <ul class="i-amp-story-bookend-share">\n      <li>\n        <div class="i-amp-story-bookend-share-icon">\n          <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24">\n        <path fill="none" d="M0 0h24v24H0V0z"/>\n        <path d="M23 11h-2V9h-2v2h-2v2h2v2h2v-2h2zM8 11v2.4h3.97c-.16 1.03-1.2 3.02-3.97 3.02-2.39 0-4.34-1.98-4.34-4.42S5.61 7.58 8 7.58c1.36 0 2.27.58 2.79 1.08l1.9-1.83C11.47 5.69 9.89 5 8 5c-3.87 0-7 3.13-7 7s3.13 7 7 7c4.04 0 6.72-2.84 6.72-6.84 0-.46-.05-.81-.11-1.16H8z"/>\n        <path fill="none" d="M1 5h14v14H1z"/>\n      </svg>\n        </div>\n      </li>\n      <li>\n        <div class="i-amp-story-bookend-share-icon">\n          <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24">\n        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>\n        <path d="M0 0h24v24H0z" fill="none"/>\n      </svg>\n        </div>\n      </li>\n      <li>\n        <div class="i-amp-story-bookend-share-icon">\n          <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="#000000">\n        <path d="M0 0h24v24H0z" fill="none"/>\n        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>\n      </svg>\n        </div>\n      </li>\n    </ul>\n    <h3 class="i-amp-story-bookend-heading">More to read</h3>\n    <div class="i-amp-story-bookend-more-articles"></div>';this.m=
this.a.querySelector(".i-amp-story-bookend-more-articles");ba.forEach(function(b){return a.m.appendChild(ca(a,b))});return this.getRoot()};L.prototype.isBuilt=function(){return this.g};function ca(a,b){var c=a.c.document.createElement("div");c.classList.add("i-amp-story-bookend-article-set");b.forEach(function(b){return c.appendChild(da(a,b))});return c}
function da(a,b){var c=a.c.document.createElement("article");c.innerHTML=(b.image?'<div class="i-amp-story-bookend-article-image">\n        <img src="'+b.image.url+'"\n            width="116"\n            height="116">\n        </img>\n      </div>':"")+'\n      <h2 class="i-amp-story-bookend-article-heading">\n        '+b.title+'\n      </h2>\n      <div class="i-amp-story-bookend-article-meta">\n        '+b.domainName+" - "+b.readingTimeMins+" mins\n      </div>";return c}L.prototype.getRoot=function(){return this.a};function O(a,b){b?a.setAttribute("hidden","hidden"):a.removeAttribute("hidden")}function P(a){this.c=a;this.g=!1;this.a=null;this.u=!1;this.s=this.i=this.j=null}e=P.prototype;
e.build=function(){if(this.g)return this.getRoot();this.g=!0;this.a=this.c.document.createElement("aside");this.a.classList.add("i-amp-story-system-layer");this.a.innerHTML='<div class="i-amp-story-progress">\n      <div class="i-amp-story-progress-bar"></div>\n      <div class="i-amp-story-progress-value"></div>\n    </div>\n    <div class="i-amp-story-ui-right">\n      <div role="button" class="i-amp-story-exit-fullscreen i-amp-story-button" hidden>\n        <svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">\n          <path d="M0 0h24v24H0z" fill="none"/>\n          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>\n        </svg>\n      </div>\n      <div div role="button" class="i-amp-story-bookend-close i-amp-story-button" hidden>\n        <svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">\n          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>\n          <path d="M0 0h24v24H0z" fill="none"/>\n        </svg>\n      </div role="button">\n    </nav>';this.j=
this.a.querySelector(".i-amp-story-exit-fullscreen");this.i=this.a.querySelector(".i-amp-story-bookend-close");this.s=this.a.querySelector(".i-amp-story-progress-value");ea(this);return this.getRoot()};function ea(a){a.j.addEventListener("click",function(b){Q(a,"ampstory:exitfullscreen",b)});a.i.addEventListener("click",function(b){Q(a,"ampstory:closebookend",b)})}e.getRoot=function(){return this.a};e.setInFullScreen=function(a){this.u=a;fa(this,a)};
function fa(a,b){E(a.c).mutate(function(){O(a.j,!b)})}e.toggleCloseBookendButton=function(a){var b=this;E(this.c).mutate(function(){O(b.i,!a)})};function Q(a,b,c){c&&c.stopPropagation();a=a.getRoot();var d=new Event(b,{bubbles:!0});d.initEvent&&d.initEvent(b,!0);a.dispatchEvent(d)}
e.updateProgressBar=function(a,b){var c=this,d=a/b;E(this.c).mutate(function(){var a=c.s,b={transform:"scale("+(d+",1")+")"},m;for(m in b){var M=a,ga=b[m],h;h=M.style;var k=m;if(2>k.length?0:0==k.lastIndexOf("--",0))h=k;else{G||(G=Object.create(null));var n=G[k];if(!n){n=k;if(void 0===h[k]){var g;g=k;g=g.charAt(0).toUpperCase()+g.slice(1);b:{for(var z=0;z<H.length;z++){var N=H[z]+g;if(void 0!==h[N]){g=N;break b}}g=""}void 0!==h[g]&&(n=g)}G[k]=n}h=n}h&&(M.style[h]=ga)}})};function ha(a){return!!(a.requestFullscreen||a.webkitRequestFullScreen||a.mozRequestFullScreen||a.msRequestFullscreen)};function R(a){AMP.BaseElement.call(this,a);this.l=!0;this.w=this.getVsync();this.f=new L(this.win);this.b=new P(this.win);this.h=!1;this.o=[]}A(R,AMP.BaseElement);e=R.prototype;
e.buildCallback=function(){var a=this;this.element.appendChild(this.b.build());this.element.addEventListener("click",this.v.bind(this),!0);this.element.addEventListener("ampstory:exitfullscreen",function(){S(a,!0)});this.element.addEventListener("ampstory:closebookend",function(){ia(a)});this.win.document.addEventListener("keydown",function(b){switch(b.keyCode){case 37:T(a);break;case 39:U(a)}},!0);var b=C().assertElement(this.element.querySelector("amp-story-page"),"Story must have at least one page.");
b.setAttribute("active","");this.scheduleResume(b);for(var c=this.element.querySelectorAll("amp-video"),d=y(c),f=d.next();!f.done;f=d.next()){var t=f.value;t.setAttribute("autoplay","")}};e.layoutCallback=function(){V(this);return Promise.resolve()};e.isLayoutSupported=function(a){return"container"==a};function W(a){var b=a.element.querySelector("amp-story-page[active]");return b}
function X(a){var b=W(a),c=b.getAttribute("advance-to");return c?C().assert(a.element.querySelector("amp-story-page#"+c),'Page "'+b.id+'" refers to page "'+c+'", but no such page exists.'):b.nextElementSibling===a.b.getRoot()||Y(a,b.nextElementSibling)?null:b.nextElementSibling}function U(a){var b=W(a),c=X(a);c?Z(a,c).then(function(){return a.o.push(b)}).then(function(){return V(a)}):ja(a)}function T(a){var b=a.o.pop();b&&Z(a,b)}
function Z(a,b){if(!a.h){var c=W(a);ha(a.element)&&a.l&&ka(a);a.b.updateProgressBar(a.getPageIndex(b),a.getPageCount()-1);return a.mutateElement(function(){b.setAttribute("active","");c.removeAttribute("active")},b).then(function(){a.schedulePause(c);a.scheduleResume(b)})}}e.setAutoFullScreen=function(a){this.l=a};
function ka(a){a.b.setInFullScreen(!0);a=a.element;a.requestFullscreen?a.requestFullscreen():a.webkitRequestFullScreen?a.webkitRequestFullScreen():a.mozRequestFullScreen?a.mozRequestFullScreen():a.msRequestFullscreen?a.msRequestFullscreen():D().warn("Ignored fullscreen request.")}
function S(a,b){b&&a.setAutoFullScreen(!1);a.b.setInFullScreen(!1);a=a.element.ownerDocument;a.exitFullscreen?a.exitFullscreen():a.webkitExitFullscreen?a.webkitExitFullscreen():a.mozCancelFullScreen?a.mozCancelFullScreen():a.msExitFullscreen?a.msExitFullscreen():D().warn("Ignored fullscreen request.")}function ja(a){a.h||(a.f.isBuilt(),S(a),a.b.toggleCloseBookendButton(!0),a.h=!0,a.getVsync().mutate(function(){a.element.classList.add("i-amp-story-bookend-active");a.f.getRoot().scrollTop=0}))}
function ia(a){a.b.toggleCloseBookendButton(!1);a.h=!1;a.getVsync().mutate(function(){a.element.classList.remove("i-amp-story-bookend-active")})}e.v=function(a){if(la(this,a)){var b=.25*this.getViewport().getWidth();a.pageX>=b?U(this):T(this);a.stopPropagation()}};function V(a){var b=X(a);b?a.schedulePreload(b):a.f.isBuilt()||a.element.appendChild(a.f.build())}
function la(a,b){return!F(b.target,function(b){var c;(c=b===a.b.getRoot()||Y(a,b))||(c=b.hasAttribute("on")&&b.getAttribute("on").match(/(^|;)\s*tap\s*:/));return c},a.element)}function Y(a,b){return a.f.isBuilt()&&b===a.f.getRoot()}e.getPages=function(){return this.element.querySelectorAll("amp-story-page")};e.getPageCount=function(){return this.getPages().length};e.getPageIndex=function(a){return Array.prototype.indexOf.call(this.getPages(),a)};AMP.registerElement("amp-story",R,'amp-story,amp-story-grid-layer,amp-story-page{contain:strict!important;overflow:hidden!important}amp-story{height:100%!important;position:relative!important;width:100%!important}body>amp-story{height:100vh!important}.i-amp-story-system-layer{background:-webkit-linear-gradient(top,rgba(0,0,0,.8),transparent);background:linear-gradient(to bottom,rgba(0,0,0,.8),transparent);position:absolute;top:0;left:0;right:0;height:44px;z-index:100000;padding:4px 0 0;box-sizing:border-box}.i-amp-story-ui-right{float:right}.i-amp-story-button{margin:0 8px;height:40px;width:40px;cursor:pointer;border-radius:40px;box-sizing:border-box;padding:8px}.i-amp-story-button:active{background:rgba(0,0,0,.2)}.i-amp-story-progress-bar,.i-amp-story-progress-value{position:absolute;left:0;right:0;top:0;height:4px}.i-amp-story-progress-bar{background:hsla(0,0%,100%,.25)}.i-amp-story-progress-value{background:#fff;width:100%;-webkit-transform:translateZ(0) scaleX(0);transform:translateZ(0) scaleX(0);-webkit-transition:-webkit-transform 0.3s ease;transition:-webkit-transform 0.3s ease;transition:transform 0.3s ease;transition:transform 0.3s ease,-webkit-transform 0.3s ease;-webkit-transform-origin:left;transform-origin:left;will-change:transform}[dir=rtl] .i-amp-story-progress-value{-webkit-transform-origin:right;transform-origin:right}amp-story-page{bottom:0!important;display:none!important;left:0!important;position:absolute!important;right:0!important;top:0!important}amp-story-page[active]{display:block!important}amp-story-grid-layer{bottom:0!important;display:-ms-grid!important;display:grid!important;left:0!important;position:absolute!important;right:0!important;top:0!important;padding:68px 32px 32px}amp-story-grid-layer *{box-sizing:border-box!important;margin:0!important}amp-story-grid-layer[template=fill]>:not(:first-child){display:none!important}amp-story-grid-layer[template=fill]>:first-child{bottom:0!important;display:block!important;height:auto!important;left:0!important;position:absolute!important;right:0!important;top:0!important;width:auto!important}amp-story-grid-layer[template=fill]>amp-anim img,amp-story-grid-layer[template=fill]>amp-img img,amp-story-grid-layer[template=fill]>amp-video video{-o-object-fit:cover!important;object-fit:cover!important}amp-story-grid-layer[template=vertical]{-webkit-align-content:start;-ms-flex-line-pack:start;align-content:start;grid-auto-flow:row!important;grid-gap:16px;-ms-grid-columns:100%!important;grid-template-columns:100%!important;-webkit-box-pack:stretch;-webkit-justify-content:stretch;-ms-flex-pack:stretch;justify-content:stretch;-ms-grid-column-align:start;justify-items:start}amp-story-grid-layer[template=vertical]>*{width:100%}amp-story-grid-layer[template=horizontal]{-webkit-align-content:stretch;-ms-flex-line-pack:stretch;align-content:stretch;-webkit-box-align:start;-webkit-align-items:start;-ms-flex-align:start;align-items:start;grid-auto-flow:column!important;grid-gap:16px;-ms-grid-rows:100%!important;grid-template-rows:100%!important;-webkit-box-pack:start;-webkit-justify-content:start;-ms-flex-pack:start;justify-content:start}amp-story-grid-layer[template=thirds]{-ms-grid-rows:(auto)[3]!important;grid-template-rows:repeat(3,auto)!important;grid-template-areas:"upper-third" "middle-third" "lower-third"!important}.i-amp-story-bookend{background:rgba(0,0,0,.85)!important;color:#fff;bottom:0!important;display:none!important;left:0!important;position:absolute;right:0!important;top:0!important;padding:44px 32px 32px;overflow:auto}.i-amp-story-bookend-active .i-amp-story-bookend{display:block!important}.i-amp-story-bookend-heading{text-transform:uppercase;padding:0 0 8px;margin:16px 0 8px;border-bottom:1px solid hsla(0,0%,100%,.25);font-weight:700;letter-spacing:0.83px}.i-amp-story-bookend-article-meta,.i-amp-story-bookend-heading{font-size:10px;color:hsla(0,0%,100%,.54);font-family:Roboto,sans-serif;line-height:1}.i-amp-story-bookend-article-meta{font-weight:300}.i-amp-story-bookend-article-set>article{margin:24px 0;overflow:hidden}.i-amp-story-bookend-article-set:last-child>article:last-child{margin-bottom:0}.i-amp-story-bookend-article-heading{font-family:Roboto,sans-serif;font-weight:300;font-size:16px;color:#ffff;line-height:1.4;margin:0 0 8px}.i-amp-story-bookend-article-image{width:116px;height:116px;float:right;margin-left:16px}.i-amp-story-bookend-article-set:first-child{border-top:none}.i-amp-story-bookend-article-set{border-top:1px solid hsla(0,0%,100%,.25)}.i-amp-story-bookend-share-icon>svg{fill:#fff}.i-amp-story-bookend-share{margin:0;padding:0;list-style:none;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap}.i-amp-story-bookend-share-icon{box-sizing:border-box;padding:6px;margin:-6px;width:44px;height:44px}.i-amp-story-bookend-share>li{margin:16px 0;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-basis:33.333%;-ms-flex-preferred-size:33.333%;flex-basis:33.333%}.i-amp-story-bookend-share>li:nth-child(3n+2){-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center}.i-amp-story-bookend-share>li:nth-child(3n+3){-webkit-box-pack:end;-webkit-justify-content:flex-end;-ms-flex-pack:end;justify-content:flex-end}\n/*# sourceURL=/extensions/amp-story/0.1/amp-story.css*/');
})});
//# sourceMappingURL=amp-story-0.1.js.map
