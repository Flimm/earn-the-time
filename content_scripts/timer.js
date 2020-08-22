(async function() {
  if (window.extensionEarning) {
    return;
  }
  window.extensionEarning = true;

  let timeoutID;
  let lastTime;

  // browser.runtime.onMessage.addListener((message) => {
  // });

  const type = await typeOfCurrentWebsite();
  // TODO: if the user changes settings, then the type of a page can change.
  // The content script needs to respond to that.

  if (! (type == "work" || type == "entertainment")) {
    return;
  }

  addCSS(`
    .extension-earn-it, .extension-earn-it__timer {
      /* override some possible styling: */
      width: auto;
      margin: 0;
      padding: 0;
      background-color: transparent;
      border-radius: unset;
      box-shadow: none;
    }
    .extension-earn-it {
      position: fixed;
      display: flex;
      justify-content: center;
      top: calc(100vh - 50px);
      bottom: 0;
      left: 0;
      right: 0;
      pointer-events: none;
    }
    .extension-earn-it__timer {
      font-size: 20px;
      background-color: red;
      opacity: 0.5;
      z-index: 1000000;
      transition-delay: 2s;
      pointer-events: none;
      padding: 0.5rem;
      font-family: monospace;
    }
    .extension-earn-it--work {
      background-color: green;
      color: white;
    }
    .extension-earn-it--entertainment {
      background-color: orange;
      color: white;
    }
  `);

  const el = document.createElement("div");
  el.innerHTML = `
    <div class="extension-earn-it">
      <div class="extension-earn-it__timer extension-earn-it--${ escapeHTML(type) }">
        ...
      </div>
    </div>
  `;
  document.body.appendChild(el.firstElementChild);

  startTimer();

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  function startTimer() {
    lastTime = new Date().getTime();
    timeoutID = setTimeout(timer, 5); // but afterwards, every 1000 milliseconds
  }

  function stopTimer() {
    clearTimeout(timeoutID);
    timeoutID = undefined;
  }

  async function timer() {
    try {
      const newTime = new Date().getTime(); // in milliseconds
      const timeElapsed = newTime - lastTime;
      const today = yyyymmdd(new Date());

      let timeSaved = (await browser.storage.sync.get(["timeSaved"])).timeSaved;
      if (timeSaved == undefined || timeSaved.date != today) {
        timeSaved = {
          date: today,
          savings: 0, // in milliseconds
        };
      }

      if (type == "work") {
        timeSaved.savings = timeSaved.savings + timeElapsed;
      } else if (type == "entertainment") {
        timeSaved.savings = timeSaved.savings - timeElapsed;
      } else {
        throw new Error("the variable named 'type' contained an unexpected value");
      }

      document.querySelector(".extension-earn-it__timer").textContent = formatSeconds(Math.floor(timeSaved.savings / 1000));
      await browser.storage.sync.set({timeSaved});

      if (timeSaved.savings <= 0 && type == "entertainment") {
        redirectBecauseBlocked();
      } else {
        lastTime = newTime;
        timeoutID = setTimeout(timer, 1000);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function redirectBecauseBlocked() {
    let p = new URLSearchParams();
    p.set('redirect', document.location);
    document.location = browser.extension.getURL('pages/blocked.html') + '?' + p.toString();
  }

  async function typeOfCurrentWebsite() {
    let res = await browser.storage.sync.get(["workDomains", "entertainmentDomains"]);
    res.workDomains = res.workDomains || [];
    res.entertainmentDomains = res.entertainmentDomains || [];

    for (let workDomain of res.workDomains) {
      if (isURLUnderHostname(document.location, workDomain)) {
        return "work";
      }
    }

    for (let entertainmentDomain of res.entertainmentDomains) {
      if (isURLUnderHostname(document.location, entertainmentDomain)) {
        return "entertainment";
      }
    }
    return "neither";
  }


  function isURLUnderHostname(url, condition_hostname) {
    url = new URL(url);
    const parts = url.hostname.split('.').filter(x => x);
    const condition_parts = condition_hostname.split('.').filter(x => x);
    if (! condition_parts || ! parts) {
      return false;
    }
    const relevantParts = parts.slice(-1 * condition_parts.length);
    return normalizeHostname(relevantParts.join(".")) == normalizeHostname(condition_parts.join("."));
  }

  function normalizeHostname(hostname) {
    const url = new URL("http://" + hostname);
    return url.hostname.replace(/\.+$/g, "");
  }

  function addCSS(css) {
      let style = document.createElement('style');
      style.innerHTML = css;
      document.querySelector("head").appendChild(style);
  }

  function escapeHTML(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatSeconds(secs) {
    let prefix = (secs < 0) ? "-" : "";
    secs = Math.abs(secs);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs - (h * 3600)) / 60);
    const s = secs % 60;

    if (h == 0) {
      return prefix + zeroPad(m, 2) + ":" + zeroPad(s, 2);
    } else {
      return prefix + zeroPad(h, 2) + ":" + zeroPad(m, 2) + ":" + zeroPad(s, 2);
    }
  }

  function zeroPad(num, places) {
    return String(num).padStart(places, '0');
  }

  function yyyymmdd(d) {
    return zeroPad(d.getFullYear(), 4) + "-" + zeroPad(d.getMonth() + 1, 2) + "-" + zeroPad(d.getDate(), 2);
  }

})().catch((e) => {
  console.error(e);
  alert("timer.js: " + e);
});
