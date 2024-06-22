/** @format */

feather.replace();

// Helper functions to manage cookies
function setCookie(name, value, days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(";");
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == " ") c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

var html = document.getElementsByTagName("html")[0];
var radios = document.getElementsByName("themes");

function setTheme(theme) {
	// Remove the existing theme class
	if (html.classList.length > 0) {
		html.classList.remove(html.classList.item(0));
	}
	// Add the new theme class
	html.classList.add(theme);
	// Store the theme in cookies
	setCookie("theme", theme, 7); // Set cookie to expire in 7 days
}

// Set the theme based on cookie value
var savedTheme = getCookie("theme");
if (savedTheme) {
	setTheme(savedTheme);
	document.getElementById(savedTheme).checked = true;
} else {
	setTheme("light-theme"); // Default theme
	document.getElementById("light-theme").checked = true;
}

for (var i = 0; i < radios.length; i++) {
	radios[i].addEventListener("change", function () {
		setTheme(this.id);
	});
}
