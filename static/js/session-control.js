/** @format */

document.addEventListener("DOMContentLoaded", function () {
	// Check if the user is already logged in from another tab
	if (sessionStorage.getItem("is_logged_in") === "true") {
		alert(
			"You are already logged in from another tab. Please close the other tab to log in here."
		);
		// Optionally redirect to a different page or disable the login form
		window.location.href = "/main"; // Replace with the URL of the main page
	}

	// Listen for form submission
	const loginForm = document.querySelector("#loginForm"); // Adjust the selector as needed
	loginForm.addEventListener("submit", function (event) {
		// Set the session storage flag to indicate that the user is logged in
		sessionStorage.setItem("is_logged_in", "true");
	});
});

// Listen for the unload event to clear the session storage
window.addEventListener("unload", function () {
	sessionStorage.removeItem("is_logged_in");
});
