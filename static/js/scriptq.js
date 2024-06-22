/** @format */

const body = document.querySelector("body"),
	sidebar = body.querySelector("nav"),
	toggle = body.querySelector(".toggle"),
	modeSwitch = body.querySelector(".toggle-switch"),
	modeText = body.querySelector(".mode-text");

// Function to save theme preference to local storage
const saveThemePreference = (theme) => {
	localStorage.setItem("theme", theme);
};

// Function to load theme preference from local storage
const loadThemePreference = () => {
	const theme = localStorage.getItem("theme");
	if (theme === "dark") {
		body.classList.add("dark");
		modeText.innerText = "Light mode";
	} else {
		body.classList.remove("dark");
		modeText.innerText = "Dark mode";
	}
};

// Load theme preference on page load
loadThemePreference();

toggle.addEventListener("click", () => {
	sidebar.classList.toggle("close");
});

modeSwitch.addEventListener("click", () => {
	body.classList.toggle("dark");

	if (body.classList.contains("dark")) {
		modeText.innerText = "Light mode";
		saveThemePreference("dark");
	} else {
		modeText.innerText = "Dark mode";
		saveThemePreference("light");
	}
});
