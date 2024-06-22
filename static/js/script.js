document
	.querySelector(".open-right-area")
	.addEventListener("click", function () {
		document.querySelector(".app-right").classList.add("show");
	});
document
	.querySelector(".open-right-area-1")
	.addEventListener("click", function () {
		document.querySelector(".app-right").classList.add("show");
	});
document
	.querySelector(".open-right-area-2")
	.addEventListener("click", function () {
		document.querySelector(".app-right").classList.add("show");
	});
document
	.querySelector(".open-right-area-3")
	.addEventListener("click", function () {
		document.querySelector(".app-right").classList.add("show");
	});
document
	.querySelector(".open-right-area-4")
	.addEventListener("click", function () {
		document.querySelector(".app-right").classList.add("show");
	});
document
	.querySelector(".open-right-area-5")
	.addEventListener("click", function () {
		document.querySelector(".app-right").classList.add("show");
	});
document
	.querySelector(".open-right-area-6")
	.addEventListener("click", function () {
		document.querySelector(".app-right").classList.add("show");
	});
document
	.querySelector(".open-right-area-7")
	.addEventListener("click", function () {
		document.querySelector(".app-right").classList.add("show");
	});
document
	.querySelector(".open-right-area-settings")
	.addEventListener("click", function () {
		document.querySelector(".app-right").classList.add("show");
	});

document.querySelector(".close-right").addEventListener("click", function () {
	document.querySelector(".app-right").classList.remove("show");
});

document.querySelector(".close-menu").addEventListener("click", function () {
	document.querySelector(".app-left").classList.remove("show");
});

document.querySelector(".menu-button").addEventListener("click", function () {
	document.querySelector(".app-left").classList.add("show");
});
document.querySelector(".menu-button-1").addEventListener("click", function () {
	document.querySelector(".app-left").classList.add("show");
});
document.querySelector(".menu-button-2").addEventListener("click", function () {
	document.querySelector(".app-left").classList.add("show");
});
document.querySelector(".menu-button-3").addEventListener("click", function () {
	document.querySelector(".app-left").classList.add("show");
});
document.querySelector(".menu-button-4").addEventListener("click", function () {
	document.querySelector(".app-left").classList.add("show");
});
document.querySelector(".menu-button-5").addEventListener("click", function () {
	document.querySelector(".app-left").classList.add("show");
});
document.querySelector(".menu-button-6").addEventListener("click", function () {
	document.querySelector(".app-left").classList.add("show");
});
document.querySelector(".menu-button-7").addEventListener("click", function () {
	document.querySelector(".app-left").classList.add("show");
});
document
	.querySelector(".menu-button-settings")
	.addEventListener("click", function () {
		document.querySelector(".app-left").classList.add("show");
	});

document.querySelector(".close-menu").addEventListener("click", function () {
	document.querySelector(".app-left").classList.remove("show");
});

document.addEventListener("click", function (event) {
	// Check if the click is outside the .app-right menu
	if (
		!document.querySelector(".app-right").contains(event.target) &&
		!event.target.closest(".open-right-area") &&
		!event.target.closest(".open-right-area-1") &&
		!event.target.closest(".open-right-area-2") &&
		!event.target.closest(".open-right-area-3") &&
		!event.target.closest(".open-right-area-4") &&
		!event.target.closest(".open-right-area-5") &&
		!event.target.closest(".open-right-area-6") &&
		!event.target.closest(".open-right-area-7") &&
		!event.target.closest(".open-right-area-settings")
	) {
		document.querySelector(".app-right").classList.remove("show");
	}

	// Check if the click is outside the .app-left menu
	if (
		!document.querySelector(".app-left").contains(event.target) &&
		!event.target.closest(".menu-button") &&
		!event.target.closest(".menu-button-1") &&
		!event.target.closest(".menu-button-2") &&
		!event.target.closest(".menu-button-3") &&
		!event.target.closest(".menu-button-4") &&
		!event.target.closest(".menu-button-5") &&
		!event.target.closest(".menu-button-6") &&
		!event.target.closest(".menu-button-7") &&
		!event.target.closest(".menu-button-settings")
	) {
		document.querySelector(".app-left").classList.remove("show");
	}
});

const logoutButton = document.getElementById("logout-btn");

logoutButton.addEventListener("click", () => {
	localStorage.removeItem("token");

	window.location.href = "/";
});

const clearInput = () => {
	const input = document.getElementsByTagName("input")[0];
	input.value = "";
};

const f12_token = localStorage.getItem("token");
// Define a function to fetch and display files
function fetchAndDisplayFiles() {
	fetch("/files", {
		// Fetch files from the Flask backend
		headers: {
			Authorization: `Bearer ${f12_token}`,
		},
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			const photosContainer = document.getElementById("photoSlider");
			const images = [];

			photosContainer.innerHTML = "";

			data.files.forEach((file) => {
				const fileExtension = file.filename.split(".").pop().toLowerCase();

				if (["jpg", "jpeg", "svg", "png"].includes(fileExtension)) {
					const imageContainerBox = document.createElement("div");
					imageContainerBox.className = "image-Slider-box";
					imageContainerBox.id = `file-${file.id}`;
					const imageDiv = document.createElement("div");
					imageDiv.className = "image-container";
					imageDiv.id = "image-container";
					const imageElement = document.createElement("img");
					imageElement.src = `data:${file.content_type};base64,${file.content}`;
					imageDiv.appendChild(imageElement);
					imageContainerBox.appendChild(imageDiv);
					photosContainer.appendChild(imageContainerBox);

					images.push(imageContainerBox);
					imageContainerBox.style.display = "none";
				}
			});

			startSlideshow(images);
		});
}

function startSlideshow(images) {
	let currentIndex = 0;

	function showNextImage() {
		if (images[currentIndex]) {
			images[currentIndex].style.display = "none";
		}

		currentIndex = (currentIndex + 1) % images.length;

		if (images[currentIndex]) {
			images[currentIndex].style.display = "block";
		}
	}

	if (images[0]) {
		images[0].style.display = "block";
	}

	setInterval(showNextImage, 27000);
}
fetchAndDisplayFiles();

document
	.getElementById("changePasswordForm")
	.addEventListener("submit", function (event) {
		event.preventDefault();

		// Get form values
		const currentPassword = document.getElementById("currentPassword").value;
		const newPassword = document.getElementById("newPassword").value;
		const confirmNewPassword =
			document.getElementById("confirmNewPassword").value;

		// Validate new password and confirm password match
		if (newPassword !== confirmNewPassword) {
			alert("New passwords do not match.");
			return;
		}

		// Create a request object to send to the server
		const requestData = {
			current_password: currentPassword,
			new_password: newPassword,
			confirm_password: confirmNewPassword,
		};

		// Send request to the server
		fetch("/change_password", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestData),
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.success) {
					alert("Password changed successfully.");
					// Close the modal
					$("#changePasswordModal").modal("hide");

					// Manually remove the modal backdrop
					$(".modal-backdrop").remove();
					$("body").removeClass("modal-open");
					$("body").css("padding-right", "");
				} else {
					alert(data.message || "An error occurred.");
				}
			})
			.catch((error) => {
				console.error("Error:", error);
				alert("An error occurred.");
			});
	});

document.querySelectorAll(".password-toggle").forEach(function (toggle) {
	toggle.addEventListener("click", function () {
		const input = this.previousElementSibling;
		const type =
			input.getAttribute("type") === "password" ? "text" : "password";
		input.setAttribute("type", type);

		// Toggle the icon class (for example, changing between "hide" and "show" icons)
		if (type === "password") {
			this.classList.remove("bxs-show");
			this.classList.add("bxs-hide");
		} else {
			this.classList.remove("bxs-hide");
			this.classList.add("bxs-show");
		}
	});
});

document
	.getElementById("editUserModal")
	.addEventListener("submit", function (event) {
		event.preventDefault();

		// Get form values
		const newUsername = document.getElementById("newUsername").value;

		// Create a request object to send to the server
		const requestData = {
			new_username: newUsername,
		};

		// Send request to the server
		fetch("/change_username", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestData),
		})
			.then((response) => response.json())
			.then((data) => {
				const messageDiv = document.getElementById("usernameChangeMessage");

				if (data.success) {
					// Update the displayed username
					document.getElementById("currentUsername").textContent = newUsername;

					// Display success message
					messageDiv.classList.remove("d-none", "alert-danger");
					messageDiv.classList.add("alert-success");
					messageDiv.textContent = "Username changed successfully.";

					// Close the modal after a delay
					setTimeout(() => {
						$("#editUserModal").modal("hide");

						// Manually remove the modal backdrop
						$(".modal-backdrop").remove();
						$("body").removeClass("modal-open");
						$("body").css("padding-right", "");

						// Clear the success message
						messageDiv.classList.add("d-none");
						messageDiv.textContent = "";
					}, 2000); // 2-second delay
				} else {
					// Display error message
					messageDiv.classList.remove("d-none", "alert-success");
					messageDiv.classList.add("alert-danger");
					messageDiv.textContent = data.message || "An error occurred.";
				}
			})
			.catch((error) => {
				console.error("Error:", error);

				const messageDiv = document.getElementById("usernameChangeMessage");
				// Display error message
				messageDiv.classList.remove("d-none", "alert-success");
				messageDiv.classList.add("alert-danger");
				messageDiv.textContent = "An error occurred.";
			});
	});

document
	.getElementById("changeEmailForm")
	.addEventListener("submit", function (event) {
		event.preventDefault();

		var form = event.target;
		var formData = new FormData(form);

		fetch(form.action, {
			method: "POST",
			body: formData,
			headers: {
				Accept: "application/json",
			},
		})
			.then((response) => response.json())
			.then((data) => {
				const messageContainer = document.getElementById("flash-messages");
				messageContainer.innerHTML = "";

				const messageElement = document.createElement("div");
				messageElement.className = `alert alert-${data.status}`;
				messageElement.innerText = data.message;

				messageContainer.appendChild(messageElement);

				if (data.status === "success") {
					// Update UI for success
					setTimeout(() => {
						$("#changeEmailModal").modal("hide"); // Hide modal if using Bootstrap modal
						$(".modal-backdrop").remove(); // Remove modal backdrop if necessary
						form.reset(); // Clear form inputs

						// Update email display in profile section
						const emailLabel = document.getElementById("currentEmail");
						if (emailLabel) {
							const newEmail = formData.get("newEmail");
							const maxLength = 20;
							emailLabel.innerText =
								newEmail.length > maxLength
									? newEmail.substring(0, maxLength) + "..."
									: newEmail;
						}

						messageContainer.innerHTML = ""; // Clear messages
					}, 3000);
				}
			})
			.catch((error) => {
				console.error("Error:", error);
				const messageContainer = document.getElementById("flash-messages");
				messageContainer.innerHTML = "";

				const messageElement = document.createElement("div");
				messageElement.className = "alert alert-danger";
				messageElement.innerText =
					"There was an error changing your email. Please try again.";

				messageContainer.appendChild(messageElement);
			});
	});


document
	.getElementById("removeProfilePictureLink")
	.addEventListener("click", function (event) {
		event.preventDefault();

		var form = document.getElementById("removeProfilePictureForm");
		var formData = new FormData(form);

		fetch(form.action, {
			method: "POST",
			body: formData,
		})
			.then((response) => response.json())
			.then((data) => {
				const messageContainer = document.getElementById("flash-messages");
				messageContainer.innerHTML = "";

				const messageElement = document.createElement("div");
				messageElement.className = `alert alert-${data.status}`;
				messageElement.innerText = data.message;

				messageContainer.appendChild(messageElement);

				if (data.status === "success") {
					// Update UI for success
					setTimeout(() => {
						fetch("/main")
							.then((response) => response.text())
							.then((html) => {
								const parser = new DOMParser();
								const doc = parser.parseFromString(html, "text/html");
								const newProfilePicture = doc.querySelector(
									".profile-con .profile-picture"
								).style.backgroundImage;
								document.querySelector(
									".profile-con .profile-picture"
								).style.backgroundImage = newProfilePicture;
							});

						messageContainer.innerHTML = ""; // Clear messages
					}, 3000);
				}
			})
			.catch((error) => {
				console.error("Error:", error);
				const messageContainer = document.getElementById("flash-messages");
				messageContainer.innerHTML = "";

				const messageElement = document.createElement("div");
				messageElement.className = "alert alert-danger";
				messageElement.innerText =
					"There was an error removing your profile picture. Please try again.";

				messageContainer.appendChild(messageElement);
			});
	});

//Notification section navigation
document.addEventListener("DOMContentLoaded", function () {
	// Get all section links
	const sectionLinks = document.querySelectorAll(".nav-lnks a");

	// Add click event listeners to each link
	sectionLinks.forEach((link) => {
		link.addEventListener("click", function (event) {
			event.preventDefault();

			// Remove active class from all section links
			sectionLinks.forEach((link) => {
				link.parentElement.classList.remove("active");
			});

			// Hide all sections
			document.querySelectorAll(".sec").forEach((div) => {
				div.classList.remove("active");
			});

			// Get the target section and display it with animation
			const targetId = this.getAttribute("href").substring(1);
			const targetSection = document.getElementById(targetId);
			if (targetSection) {
				targetSection.classList.add("active");
				this.parentElement.classList.add("active");
			}
		});
	});
});

document.addEventListener("DOMContentLoaded", function () {
	// Get all section links
	const sectionLinks = document.querySelectorAll(".nav-lnks a");

	// Add click event listeners to each link
	sectionLinks.forEach((link) => {
		link.addEventListener("click", function (event) {
			event.preventDefault();

			// Remove active class from all section links
			sectionLinks.forEach((lnk) => {
				lnk.parentElement.classList.remove("active");
			});

			// Hide all sections
			document.querySelectorAll(".sec").forEach((div) => {
				div.classList.remove("active");
			});

			// Get the target section and display it with animation
			const targetId = link.getAttribute("href").substring(1);
			const targetSection = document.getElementById(targetId);
			if (targetSection) {
				targetSection.classList.add("active");
				link.parentElement.classList.add("active");

				// Update the URL in the address bar only for the clicked link
				const fullPath = `/main/settings/${targetId}`;
				history.pushState({}, "", fullPath);
			}
		});
	});

	// Handle initial state based on URL hash or default
	const pathSegments = window.location.pathname.split("/");
	const activeSection = pathSegments[pathSegments.length - 1]; // Get the last segment of the path
	const activeLink = document.querySelector(
		`.nav-lnks a[href="/${activeSection}"]`
	);

	if (activeLink) {
		activeLink.click(); // Trigger click event on the active link to show the correct section
	}
});


// Function to check if an element is a descendant of another element
const isDescendant = (parent, child) => {
	let node = child.parentNode;
	while (node != null) {
		if (node === parent) {
			return true;
		}
		node = node.parentNode;
	}
	return false;
};

document.addEventListener("DOMContentLoaded", () => {
	const navLinks = document.querySelectorAll(".nav-list-link");
	const sections = document.querySelectorAll(".section");
	const activeSection = localStorage.getItem("activeSection") || "dashboard";

	// Function to set active link and section
	const setActive = (id) => {
		// Remove active class from all links initially
		navLinks.forEach((link) => {
			link.classList.remove("active");
		});

		// Add active class to the clicked link
		const activeLink = document.querySelector(
			`.nav-list-link[data-target="${id}"]`
		);
		if (activeLink) {
			activeLink.classList.add("active");
		}

		// Hide all sections initially
		sections.forEach((section) => {
			section.style.display = section.id === id ? "block" : "none";
		});

		localStorage.setItem("activeSection", id);

		// Update the URL to reflect the active section
		history.pushState({ section: id }, "", `/main/${id}`);
	};

	// Initialize the state based on saved value or default
	setActive(activeSection);

	// Add click event listeners to navigation links
	navLinks.forEach((link) => {
		link.addEventListener("click", (e) => {
			e.preventDefault(); // Prevent default behavior (page reload)
			const target = link.dataset.target;
			setActive(target);
		});
	});

	// Listen for popstate events to handle browser back/forward button clicks
	window.addEventListener("popstate", (e) => {
		const state = e.state;
		if (state && state.section) {
			setActive(state.section);
		}
	});
});

function toggleDropdown() {
	document.getElementById("dropdown-content").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
	if (
		!event.target.matches(".btn-container") &&
		!event.target.matches(".btn-container *")
	) {
		var dropdowns = document.getElementsByClassName("dropdown-content");
		for (var i = 0; i < dropdowns.length; i++) {
			var openDropdown = dropdowns[i];
			if (openDropdown.classList.contains("show")) {
				openDropdown.classList.remove("show");
			}
		}
	}
};

// ##################################################

// JavaScript to trigger file input when button is clicked
document
	.getElementById("selectProfilePictureButton")
	.addEventListener("click", function () {
		document.getElementById("profile_picture").click();
	});

// JavaScript to handle file input change and display the preview
document
	.getElementById("profile_picture")
	.addEventListener("change", function (event) {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = function (e) {
				document.getElementById("profile_picture_preview").src =
					e.target.result;
			};
			reader.readAsDataURL(file);
		}
	});

document
	.getElementById("profilePictureForm")
	.addEventListener("submit", function (event) {
		event.preventDefault();

		var form = event.target;
		var formData = new FormData(form);

		fetch(form.action, {
			method: "POST",
			body: formData,
		})
			.then((response) => response.json())
			.then((data) => {
				const messageContainer = document.getElementById("flash-messages");
				messageContainer.innerHTML = "";

				const messageElement = document.createElement("div");
				messageElement.className = `alert alert-${data.status}`;
				messageElement.innerText = data.message;

				messageContainer.appendChild(messageElement);

				if (data.status === "success") {
					// Update UI for success
					setTimeout(() => {
						$("#editProfileModal").modal("hide"); // Hide modal if using Bootstrap modal
						$(".modal-backdrop").remove(); // Remove modal backdrop if necessary
						form.reset(); // Clear form inputs

						// Fetch the updated profile picture from the server and update the img src
						fetch("/main")
							.then((response) => response.text())
							.then((html) => {
								const parser = new DOMParser();
								const doc = parser.parseFromString(html, "text/html");
								const newProfilePicture = doc.querySelector(
									".profile-con .profile-picture"
								).style.backgroundImage;
								document.querySelector(
									".profile-con .profile-picture"
								).style.backgroundImage = newProfilePicture;
							});

						messageContainer.innerHTML = ""; // Clear messages
					}, 3000);
				}
			})
			.catch((error) => {
				console.error("Error:", error);
				const messageContainer = document.getElementById("flash-messages");
				messageContainer.innerHTML = "";

				const messageElement = document.createElement("div");
				messageElement.className = "alert alert-danger";
				messageElement.innerText =
					"There was an error updating your profile picture. Please try again.";

				messageContainer.appendChild(messageElement);
			});
	});


	document.addEventListener("DOMContentLoaded", function () {
		fetch("/get_notifications", {
			method: "GET",
			credentials: "include",
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.success) {
					document.getElementById("emailNotifications").checked =
						data.emailNotifications;
					document.getElementById("pushNotifications").checked =
						data.pushNotifications;
					document.getElementById("sharedFilesNotifications").checked =
						data.sharedFilesNotifications;
					document.getElementById("deletedFilesNotifications").checked =
						data.deletedFilesNotifications;
					document.getElementById("newBrowserSignInNotifications").checked =
						data.newBrowserSignInNotifications;
				} else {
					alert(data.message);
				}
			});

		const checkboxes = document.querySelectorAll(
			'.notification-option input[type="checkbox"]'
		);
		checkboxes.forEach((checkbox) => {
			checkbox.addEventListener("change", function () {
				const settings = {
					emailNotifications:
						document.getElementById("emailNotifications").checked,
					pushNotifications:
						document.getElementById("pushNotifications").checked,
					sharedFilesNotifications: document.getElementById(
						"sharedFilesNotifications"
					).checked,
					deletedFilesNotifications: document.getElementById(
						"deletedFilesNotifications"
					).checked,
					newBrowserSignInNotifications: document.getElementById(
						"newBrowserSignInNotifications"
					).checked,
				};

				fetch("/update_notifications", {
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(settings),
				})
					.then((response) => response.json())
					.then((data) => {
						if (!data.success) {
							alert(data.message);
						}
					});
			});
		});
	});
