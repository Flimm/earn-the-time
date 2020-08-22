/*
 * Example of settings in sync storage:
 *
 * workDomains: ["example1.com", "example2.com"],
 * entertainmentDomains: ["example3.com", "example4.com"],
 * timeSaved: {
 *   date: "2020-01-15",
 *   savings: 0, // in milliseconds
 * },
 */

const settingNames = ["workDomains", "entertainmentDomains"];

ready(async function() {
  try {
    const settings = await browser.storage.sync.get(settingNames);
    for (let settingName of settingNames) {
      const settingValue = settings[settingName];
      const el = document.querySelector(`.js-setting[data-setting='${CSS.escape(settingName)}']`);
      el.disabled = false;
      try {
        el.value = settingValue.join("\n");
      } catch(e) {
        console.error(e);
        alert(e);
      }
    }
    document.querySelector("#js-save").disabled = false;
  } catch (e) {
    console.error(e);
    alert(e);
  }
});

document.querySelector("#js-save").addEventListener("click", async function() {
  try {
    const saved = {};
    for (let settingName of settingNames) {
      const el = document.querySelector(`.js-setting[data-setting='${CSS.escape(settingName)}']`);
      saved[settingName] = el.value.split("\n").map(x => x.trim()).filter(x => x);
    }
    await browser.storage.sync.set(saved);
  } catch (e) {
    console.error(e);
    alert(e);
  }
});

function ready(fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

