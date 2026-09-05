const cards = document.querySelectorAll(".project-card");
const details = document.querySelectorAll(".detail-project");
const placeholder = document.querySelector(".detail-placeholder");

let activeProject = null;

function showProject(projectId) {
  activeProject = projectId;

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

// Switch detail panel only when entering a project card
cards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    showProject(card.dataset.project);
  });
});

// Keep the currently selected detail panel visible
// while moving the cursor from the card toward the panel.
const detailPanel = document.querySelector(".project-detail");

if (detailPanel) {
  detailPanel.addEventListener("mouseenter", () => {
    if (activeProject) {
      const target = document.querySelector(
        `.detail-project[data-detail="${activeProject}"]`
      );

      if (target) {
        placeholder.style.display = "none";
        target.classList.add("active");
      }
    }
  });
}
