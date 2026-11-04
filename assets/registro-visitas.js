/* Registro de visitas de Regenergy Projects.
   Envía a una hoja de Google (Apps Script) la IP, la ubicación aproximada, el navegador
   y el tiempo de visita. Si REG_URL está vacío no envía nada. */
(function(){
  var REG_URL = '';   // URL /exec del Apps Script (ver instrucciones)
  if(!REG_URL || !window.fetch) { window.regAcceso = function(){}; return; }
  var sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  var activo = 0, desde = document.visibilityState === 'visible' ? Date.now() : 0;
  var geo = null, acceso = false, iniciado = false, salio = false;
  function seg(){ return Math.round((activo + (desde ? Date.now() - desde : 0)) / 1000); }
  function enviar(ev){
    var d = {sid: sid, ev: ev, dur: seg(), acc: acceso, pag: location.pathname, ref: document.referrer || '',
             ua: navigator.userAgent, pant: screen.width + 'x' + screen.height, idioma: navigator.language || '',
             zona: (Intl.DateTimeFormat().resolvedOptions().timeZone || '')};
    if(geo){ d.ip = geo.ip; d.ciudad = geo.ciudad; d.region = geo.region; d.pais = geo.pais; d.lat = geo.lat; d.lon = geo.lon; d.isp = geo.isp; }
    var b = JSON.stringify(d);
    try { if(navigator.sendBeacon && navigator.sendBeacon(REG_URL, b)) return; } catch(e){}
    try { fetch(REG_URL, {method: 'POST', mode: 'no-cors', keepalive: true, headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: b}); } catch(e){}
  }
  function conTiempo(p, ms){ return Promise.race([p, new Promise(function(_, r){ setTimeout(function(){ r(new Error('tiempo')); }, ms); })]); }
  function buscarGeo(){
    return conTiempo(fetch('https://ipapi.co/json/').then(function(r){ return r.json(); }), 5000).then(function(j){
      if(!j || !j.ip || j.error) throw new Error('ipapi');
      return {ip: j.ip, ciudad: j.city || '', region: j.region || '', pais: j.country_name || '', lat: j.latitude, lon: j.longitude, isp: j.org || ''};
    }).catch(function(){
      return conTiempo(fetch('https://ipwho.is/').then(function(r){ return r.json(); }), 5000).then(function(j){
        if(!j || !j.ip) throw new Error('ipwho');
        return {ip: j.ip, ciudad: j.city || '', region: j.region || '', pais: j.country || '', lat: j.latitude, lon: j.longitude, isp: (j.connection && (j.connection.isp || j.connection.org)) || ''};
      });
    }).catch(function(){ return null; });
  }
  buscarGeo().then(function(g){ geo = g; iniciado = true; enviar('inicio'); });
  setTimeout(function(){ if(!iniciado){ iniciado = true; enviar('inicio'); } }, 7000);
  setInterval(function(){ if(document.visibilityState === 'visible' && iniciado) enviar('activo'); }, 30000);
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'visible'){ desde = Date.now(); }
    else { if(desde){ activo += Date.now() - desde; desde = 0; } if(iniciado) enviar('oculta'); }
  });
  window.addEventListener('pagehide', function(){ if(salio) return; salio = true; if(desde){ activo += Date.now() - desde; desde = 0; } enviar('salida'); });
  window.regAcceso = function(){ acceso = true; enviar('acceso'); };
})();
