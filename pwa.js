/* Installation support; account data is never stored by the service worker. */
(() => {
  let installPrompt = null;
  let installed = false;
  const standalone = () => installed || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  function syncInstallButtons() {
    document.querySelectorAll('[data-install-row]').forEach(row => { row.hidden = standalone(); });
  }
  function closeInstallHelp() { document.getElementById('installHelpModal').classList.remove('show'); }
  window.closeInstallHelp = closeInstallHelp;
  function showInstallHelp() {
    const localFile = location.protocol === 'file:' || !window.isSecureContext;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const text = document.getElementById('installHelpText');
    if (localFile) {
      text.innerHTML = '<p>Primero publica todos los archivos del ZIP en tu hosting con HTTPS y abre el enlace del panel.</p><p>La vista previa de Acode o un archivo local no permiten instalar la app.</p>';
    } else if (ios) {
      text.innerHTML = '<p>Abre este enlace en Safari. Toca <b>Compartir → Agregar a la pantalla de inicio</b>.</p><p>Si aparece la opción, activa <b>Abrir como app web</b> y toca <b>Agregar</b>.</p>';
    } else {
      text.innerHTML = '<p>Abre este enlace en Chrome o Edge. En el menú <b>⋮</b> busca <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.</p><p>Si la opción tarda en aparecer, espera unos segundos y vuelve a abrir el menú.</p>';
    }
    document.getElementById('installHelpModal').classList.add('show');
  }
  window.requestPanelInstall = async () => {
    if (standalone()) return;
    if (!installPrompt) { showInstallHelp(); return; }
    const prompt = installPrompt;
    installPrompt = null;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') closeInstallHelp();
    } catch (error) {
      console.warn('Installation:', error);
      showInstallHelp();
    }
  };
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    syncInstallButtons();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installed = true;
    closeInstallHelp();
    syncInstallButtons();
    if (typeof toast === 'function') toast('Panel instalado');
  });
  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', syncInstallButtons);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeInstallHelp(); });
  syncInstallButtons();

  if ('serviceWorker' in navigator && window.isSecureContext && location.protocol !== 'file:') {
    const register = () => navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' })
      .catch(error => console.warn('Service Worker:', error));
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }

  // Keep a readable screen if the external Firebase SDK could not load.
  if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
    const splash = document.getElementById('sessionSplash');
    splash.classList.remove('hidden');
    const card = splash.querySelector('.session-splash-card');
    card.innerHTML = '<div class="session-splash-logo">A</div><div class="session-splash-title">No se pudo conectar</div><p class="install-help-copy">Revisa tu conexión a internet y vuelve a intentarlo.</p><button type="button" class="btn btn-primary" onclick="location.reload()">Reintentar</button>';
  }
})();
