import { createNavigation } from './components/navigation.js';

document.addEventListener('DOMContentLoaded', () => {
  // Find the nav element and replace it with our navigation component
  const existingNav = document.querySelector('nav');
  if (existingNav) {
    existingNav.replaceWith(createNavigation());
  }
});
