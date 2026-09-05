/* =========================================================
   BLOG NAVIGATION
========================================================= */

const sections = document.querySelectorAll(
  ".blog-year, .reading-corner"
);

const yearLinks = document.querySelectorAll(
  ".year-nav a"
);


/* =========================================================
   ACTIVE YEAR
========================================================= */

function updateActiveYear() {

  const scrollPosition =
    window.scrollY + window.innerHeight * 0.25;

  let currentId = null;

  sections.forEach((section) => {

    if (section.offsetTop <= scrollPosition) {
      currentId = section.id;
    }

  });

  yearLinks.forEach((link) => {

    link.classList.toggle(
      "is-active",
      link.getAttribute("href") === `#${currentId}`
    );

  });

}


window.addEventListener(
  "scroll",
  updateActiveYear,
  { passive: true }
);

updateActiveYear();
