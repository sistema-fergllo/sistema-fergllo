/* Loader for the preserved legacy login recovery plus the Faragello visual touch. */
(function(){
  'use strict';
  function load(src, done){
    var s=document.createElement('script');
    s.src=src;
    s.onload=function(){if(done)done();};
    s.onerror=function(){console.error('Faragello loader failed:',src);if(done)done();};
    document.head.appendChild(s);
  }
  function loadCss(src){
    var l=document.createElement('link'); l.rel='stylesheet'; l.href=src; document.head.appendChild(l);
  }
  loadCss('faragello-touch.css?v=20261031');
  load('login-fix-legacy.js?v=20261031-legacy',function(){
    load('faragello-touch.js?v=20261031');
  });
})();
