/** @format */

document.addEventListener("DOMContentLoaded", () => {
	const navLinks = document.querySelectorAll(".nav-link");
	const quickAccessLinks = document.querySelectorAll(
		".access-icon, .access-text"
	);
	const sections = document.querySelectorAll(".section");
	const activeSection = localStorage.getItem("activeSection") || "dashboard";

	// Function to set active link and section
	const setActive = (id) => {
		navLinks.forEach((link) => {
			link.classList.toggle("active", link.dataset.target === id);
		});

		quickAccessLinks.forEach((link) => {
			link.classList.toggle("active", link.dataset.target === id);
		});

		sections.forEach((section) => {
			section.classList.toggle("active", section.id === id);
		});

		localStorage.setItem("activeSection", id);
	};

	// Initialize the state based on saved value or default
	setActive(activeSection);

	// Add click event listeners to navigation links
	navLinks.forEach((link) => {
		link.addEventListener("click", (e) => {
			e.preventDefault();
			setActive(link.dataset.target);
		});
	});

	// Add click event listeners to quick access links
	quickAccessLinks.forEach((link) => {
		link.addEventListener("click", (e) => {
			e.preventDefault();
			setActive(link.dataset.target);
		});
	});
});
