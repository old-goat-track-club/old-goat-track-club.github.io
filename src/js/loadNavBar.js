fetch("/src/nav.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("nav-placeholder").innerHTML = data;
  })
  .catch((err) => console.error("Failed to load navbar", err));
