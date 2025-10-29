// runtime/app-client.js
window.addEventListener("asx:ready", () => {
  document.getElementById("splash").style.display = "none";
  const c = document.getElementById("content");
  c.classList.remove("hide");
});


function initASX() {
  document.getElementById("content").innerHTML = `
    <h2>Welcome to ASX Browser Runtime</h2>
    <p>This environment runs entirely on JSON + RAM.</p>
  `;
}
