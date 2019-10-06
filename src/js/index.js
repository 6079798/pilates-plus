import SmoothScroll from "smooth-scroll";

import "./sliders";
import "./forms";

if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}

SmoothScroll("[data-scroll]", {
  updateURL: false,
  speedAsDuration: true
});

const page = document.body;
const navBtn = document.querySelector("[data-nav-toggle]");
const navContainer = document.querySelector(".nav");

const toggleNav = () => {
  navBtn.classList.toggle("nav-btn--active");
  navContainer.classList.toggle("nav--shown");
  page.classList.toggle("page--no-scroll");
};

navBtn.addEventListener("click", toggleNav);

document.addEventListener("scrollStart", ({ detail: { toggle } }) => {
  if (
    toggle.parentElement.matches(".nav__link") &&
    navContainer.matches(".nav--shown")
  )
    toggleNav();
});
