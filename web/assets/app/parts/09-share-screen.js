if (location.pathname === "/share") {
  experienceCategoryInput.addEventListener("change", updateIncidentCategoryOptions);
  updateIncidentCategoryOptions();
  void loadTrustPostOptions()
    .then((options) => {
      trustClassificationInput.addEventListener("change", () => {
        trustClassFeedback.textContent = "";
        updateTrustOutcomeOptions(options.classifications);
      });
      if (trustClassificationInput.value) updateTrustOutcomeOptions(options.classifications);
    })
    .catch(() => {});
  trustSubjectSearchInput.addEventListener("input", scheduleTrustSubjectSearch);
  trustSubjectSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideTrustSubjectResults();
  });
  const editId = new URLSearchParams(location.search).get("edit");
  if (editId) {
    editingPostId = editId;
    void loadPostForEditing();
  } else {
    loadFriendCount();
    void loadPostFieldSuggestions();
  }
  postPlaceInput?.addEventListener("input", schedulePostPlaceSuggestions);
  postLocationInput?.addEventListener("input", schedulePostLocationSuggestions);
  postLocationInput?.addEventListener("focus", schedulePostLocationSuggestions);
  postLocationInput?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (movePostLocationSuggestion(event.key === "ArrowDown" ? 1 : -1)) event.preventDefault();
    } else if (event.key === "Enter" && selectActivePostLocationSuggestion()) {
      event.preventDefault();
    } else if (event.key === "Escape") {
      hidePostLocationSuggestions();
    }
  });
  postLocationInput?.addEventListener("blur", () => {
    setTimeout(hidePostLocationSuggestions, 120);
  });
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (activeStoryFormStep === "story") {
    if (validateStep(storyEntryStep)) showStoryFormStep("details");
    return;
  }
  if (validateStep(experienceDetailsStep)) showReview();
});
document.getElementById("edit-experience").addEventListener("click", backToEdit);
agreementDescription?.addEventListener("input", () => {
  agreementDescriptionCount.textContent = `${agreementDescription.value.length} / 3000`;
});
