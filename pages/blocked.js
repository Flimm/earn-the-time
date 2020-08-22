(function() {
  const params = new URLSearchParams(window.location.search);
  const url = params.get('redirect');

  if (url) {
    let el = document.createElement('a');
    el.href = url;
    el.textContent = url;
    document.querySelector(".js").appendChild(el);
  }
})();

