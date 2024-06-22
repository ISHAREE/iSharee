/** @format */

// Function to toggle class 'show' on elements
const toggleShowClass = (selector, className = "show") => {
	document.querySelector(selector).classList.toggle(className);
};

// Attach event listeners for showing and hiding right and left sections
const setupSectionToggles = () => {
	const rightAreaSelectors = [
		".open-right-area",
		".open-right-area-1",
		".open-right-area-2",
		".open-right-area-3",
		".open-right-area-4",
		".open-right-area-5",
		".open-right-area-6",
		".open-right-area-7",
		".open-right-area-settings",
	];
	const leftAreaSelectors = [
		".menu-button",
		".menu-button-1",
		".menu-button-2",
		".menu-button-3",
		".menu-button-4",
		".menu-button-5",
		".menu-button-6",
		".menu-button-7",
		".menu-button-settings",
	];

	rightAreaSelectors.forEach((selector) => {
		document
			.querySelector(selector)
			.addEventListener("click", () => toggleShowClass(".app-right"));
	});

	leftAreaSelectors.forEach((selector) => {
		document
			.querySelector(selector)
			.addEventListener("click", () => toggleShowClass(".app-left"));
	});

	document
		.querySelector(".close-right")
		.addEventListener("click", () => toggleShowClass(".app-right"));
	document
		.querySelector(".close-menu")
		.addEventListener("click", () => toggleShowClass(".app-left"));
};

// Logout functionality
document.getElementById("logout-btn").addEventListener("click", () => {
	localStorage.removeItem("token");
	window.location.href = "/";
});

// Clear the first input field
const clearInput = () => {
	document.getElementsByTagName("input")[0].value = "";
};

// Handle section navigation
const handleSectionNavigation = () => {
	const navLinks = document.querySelectorAll(".nav-list-item");
	const quickAccessLinks = document.querySelectorAll(
		".access-icon, .access-text"
	);
	const sections = document.querySelectorAll(".section");
	const activeSection = localStorage.getItem("activeSection") || "dashboard";

	const setActive = (id) => {
		[...navLinks, ...quickAccessLinks].forEach((link) => {
			link.classList.toggle("active", link.dataset.target === id);
		});
		sections.forEach((section) => {
			section.classList.toggle("active", section.id === id);
		});
		localStorage.setItem("activeSection", id);
	};

	setActive(activeSection);

	[...navLinks, ...quickAccessLinks].forEach((link) => {
		link.addEventListener("click", (e) => {
			e.preventDefault();
			setActive(link.dataset.target);
		});
	});
};

// Display success message
const displaySuccessMessage = (message) => {
	const uploadMessage = document.getElementById("uploadMessage");
	uploadMessage.textContent = message;
	uploadMessage.className = "success";
	uploadMessage.style.display = "block";
	setTimeout(() => {
		uploadMessage.style.display = "none";
	}, 5000);
};

// Update session data in the HTML
const updateSessionData = (session) => {
	const sessionId = document.getElementById("sessions");
	sessionId.innerHTML = `
    <h2>Session Information:</h2>
    <p>User ID: ${session.user_id}</p>
    <p>Username: ${session.username}</p>
    <p>Email: ${session.email}</p>
    <p>Files Table: ${session.files_table}</p>
  `;
};

// Fetch and display files
const fetchAndDisplayFiles = () => {
	fetch("/files", {
		headers: {
			Authorization: `Bearer ${localStorage.getItem("token")}`,
		},
	})
		.then((response) => response.json())
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
};

// Start slideshow
const startSlideshow = (images) => {
	let currentIndex = 0;
	const showNextImage = () => {
		if (images[currentIndex]) images[currentIndex].style.display = "none";
		currentIndex = (currentIndex + 1) % images.length;
		if (images[currentIndex]) images[currentIndex].style.display = "block";
	};
	if (images[0]) images[0].style.display = "block";
	setInterval(showNextImage, 27000);
};
fetchAndDisplayFiles();

// Profile, password and email management
const setupProfileManagement = () => {
	const profiletext = document.getElementById("profiletext");
	profiletext.innerText = localStorage.getItem("username");

	const handleFormSubmit = (formId, url, successMessage, updateUI) => {
		document
			.getElementById(formId)
			.addEventListener("submit", function (event) {
				event.preventDefault();
				const form = event.target;
				const formData = new FormData(form);
				fetch(url, {
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
							setTimeout(() => {
								document.querySelector(".modal-backdrop").remove();
								form.reset();
								if (updateUI) updateUI(data);
								messageContainer.innerHTML = "";
							}, 3000);
						}
					})
					.catch((error) => {
						console.error("Error:", error);
						const messageContainer = document.getElementById("flash-messages");
						messageContainer.innerHTML = "";
						const messageElement = document.createElement("div");
						messageElement.className = "alert alert-danger";
						messageElement.innerText = "An error occurred. Please try again.";
						messageContainer.appendChild(messageElement);
					});
			});
	};

	handleFormSubmit(
		"changePasswordForm",
		"/change_password",
		"Password changed successfully."
	);
	handleFormSubmit(
		"changeEmailForm",
		"/change_email",
		"Email changed successfully.",
		(data) => {
			document.getElementById("currentEmail").innerText = data.newEmail;
		}
	);
	handleFormSubmit(
		"profilePictureForm",
		"/change_profile_picture",
		"Profile picture updated successfully."
	);
	handleFormSubmit(
		"removeProfilePictureForm",
		"/remove_profile_picture",
		"Profile picture removed successfully."
	);
};

// Setup notification settings
const setupNotificationSettings = () => {
	const checkboxes = {
		emailNotifications: document.getElementById("emailNotifications"),
		pushNotifications: document.getElementById("pushNotifications"),
		sharedFilesNotifications: document.getElementById(
			"sharedFilesNotifications"
		),
	};

	const updateNotificationsSettings = (type, state) => {
		localStorage.setItem(type, state);
		fetch("/notifications_settings", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("token")}`,
			},
			body: JSON.stringify({ [type]: state }),
		})
			.then((response) => response.json())
			.then((data) => console.log(`${type} updated:`, data))
			.catch((error) => console.error(`Error updating ${type}:`, error));
	};

	Object.keys(checkboxes).forEach((key) => {
		const checkbox = checkboxes[key];
		checkbox.checked = localStorage.getItem(key) === "true";
		checkbox.addEventListener("change", () =>
			updateNotificationsSettings(key, checkbox.checked)
		);
	});
};

// Initialize functions on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
	setupSectionToggles();
	handleSectionNavigation();
	setupProfileManagement();
	setupNotificationSettings();
});
