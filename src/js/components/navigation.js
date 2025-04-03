export function createNavigation() {
  const nav = document.createElement('nav');
  nav.innerHTML = `
    <ul>
      <li><a href="/index.html" class="nav-logo-link"><img src="../../assets/logo-only-blue-on-white.svg" alt="Home" class="nav-logo"></a></li>
      <li><a href="/src/about.html">About</a></li>
      <li><a href="/src/schedule.html">Schedule</a></li>
      <li><a href="/src/results.html">Results</a></li>
      <li><a href="/src/records.html">Records</a></li>
      <li><a href="/src/meet.html">Home Meet</a></li>
      <li><a href="/src/contact.html">Contact</a></li>
    </ul>
  `;
  return nav;
}
