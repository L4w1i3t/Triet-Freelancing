// Dropdown toggle function
function toggleExportDropdown() {
  const dropdown = document.getElementById("exportDropdown");
  dropdown.style.display =
    dropdown.style.display === "none" ? "block" : "none";
}

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const dropdown = document.getElementById("exportDropdown");
  const exportButton = event.target.closest(".export-dropdown");
  if (!exportButton && dropdown) {
    dropdown.style.display = "none";
  }
});
