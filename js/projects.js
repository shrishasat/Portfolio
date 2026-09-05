const cards = document.querySelectorAll(".project-card");
const details = document.querySelectorAll(".detail-project");
const placeholder = document.querySelector(".detail-placeholder");

function showProject(projectId) {
  details.forEach((detail) => {
    detail.classList.remove("active");
  });

  const target = document.querySelector(
    `.detail-project[data-detail="${projectId}"]`
  );

  if (!target) return;

  if (placeholder) {
    placeholder.style.display = "none";
  }

  target.classList.add("active");
}

// CLICK a project card to open its details
cards.forEach((card) => {
  card.addEventListener("click", () => {
    showProject(card.dataset.project);
  });
});
