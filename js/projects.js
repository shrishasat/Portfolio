const cards = document.querySelectorAll(".project-card");
const details = document.querySelectorAll(".detail-project");
const placeholder = document.querySelector(".detail-placeholder");

function showProject(projectId) {
  // Hide all project details
  details.forEach((detail) => {
    detail.classList.remove("active");
  });

  // Find matching detail panel
  const target = document.querySelector(
    `.detail-project[data-detail="${projectId}"]`
  );

  if (!target) return;

  // Hide placeholder
  if (placeholder) {
    placeholder.style.display = "none";
  }

  // Show selected project
  target.classList.add("active");
}

// Hover over project cards
cards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    showProject(card.dataset.project);
  });
});
