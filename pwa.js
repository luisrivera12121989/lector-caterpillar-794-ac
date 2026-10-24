(() => {
  const status = document.getElementById("pwa-status");
  const installButton = document.getElementById("pwa-install");
  if (!status || !installButton) return;

  let installPrompt = null;
  let cacheReady = false;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  function setStatus() {
    if (!navigator.onLine) {
      status.textContent = cacheReady ? "Sin conexión · manual disponible" : "Sin conexión · caché no lista";
      status.dataset.state = "offline";
    } else if (cacheReady) {
      status.textContent = "En línea · lectura sin conexión lista";
      status.dataset.state = "ready";
    } else {
      status.textContent = "En línea · preparando caché";
      status.dataset.state = "checking";
    }
  }

  if (standalone) {
    installButton.hidden = true;
  } else if (isIOS) {
    installButton.hidden = false;
    installButton.addEventListener("click", () => {
      window.alert("Para instalar este lector, abre el menú Compartir de Safari y elige “Añadir a pantalla de inicio”.");
    });
  } else {
    installButton.hidden = false;
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
    });
    window.addEventListener("appinstalled", () => {
      installPrompt = null;
      installButton.hidden = true;
      status.textContent = navigator.onLine ? "Instalado · lectura sin conexión lista" : "Sin conexión · manual disponible";
      status.dataset.state = navigator.onLine ? "ready" : "offline";
    });
    installButton.addEventListener("click", async () => {
      if (!installPrompt) {
        window.alert("Abre el menú del navegador y elige “Instalar aplicación” o “Añadir a pantalla de inicio”.");
        return;
      }
      const prompt = installPrompt;
      installPrompt = null;
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") installButton.hidden = true;
    });
  }

  window.addEventListener("online", setStatus);
  window.addEventListener("offline", setStatus);
  setStatus();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).then(async (registration) => {
      await navigator.serviceWorker.ready;
      cacheReady = Boolean(registration.active);
      setStatus();
    }).catch(() => {
      status.textContent = navigator.onLine ? "En línea · caché sin activar" : "Sin conexión · caché no lista";
      status.dataset.state = "offline";
    });
  } else {
    status.textContent = navigator.onLine ? "En línea · caché no compatible" : "Sin conexión · caché no compatible";
    status.dataset.state = "offline";
  }
})();
