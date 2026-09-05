// Highlight the active year/section in the year-nav as the reader scrolls,
// and show a back-to-top control once they've moved away from the top.

const sections = document.querySelectorAll(".blog-year, .reading-corner");
const yearLinks = document.querySelectorAll(".year-nav a");
const backTop = document.getElementById("backTop");

function setActive() {
  let currentId = null;
  const scrollPos = window.scrollY + window.innerHeight * 0.25;

  sections.forEach((section) => {
    if (section.offsetTop <= scrollPos) currentId = section.id;
  });

  yearLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${currentId}`);
  });

  backTop.classList.toggle("show", window.scrollY > 400);
}

window.addEventListener("scroll", setActive, { passive: true });
setActive();

backTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
