/** @format */

let unsavedChanges = false;
let cropper = null;

const f1_token = localStorage.getItem("token");

const showSpinner = () => {
	const spinner = document.getElementById("spinner");
	spinner.style.display = "block";
};

const hideSpinner = () => {
	const spinner = document.getElementById("spinner");
	spinner.style.display = "none";
};

// Function to handle image file search
const search = () => {
	const searchbox = document.getElementById("searchBar").value.toUpperCase();
	const imageContainerBoxes = document.querySelectorAll(".image-container-box");
	imageContainerBoxes.forEach((container) => {
		const fileNameElement = container.querySelector("h2.file-name");
		if (fileNameElement) {
			const textValue =
				fileNameElement.textContent || fileNameElement.innerHTML;
			if (textValue.toUpperCase().indexOf(searchbox) > -1) {
				container.removeAttribute("data-hidden");
			} else {
				container.setAttribute("data-hidden", "true");
			}
		} else {
			console.log(
				"File name element is undefined for one of the image containers."
			);
		}
	});
};

// Function to handle video file search
const videosearch = () => {
	const searchbox = document
		.getElementById("videosearchBar")
		.value.toUpperCase();
	const videoContainerDiv = document.querySelectorAll(".video-container-box");
	for (let i = 0; i < videoContainerDiv.length; i++) {
		const file_name = videoContainerDiv[i].getElementsByTagName("h2")[0];
		if (file_name) {
			const textvalue = file_name.textContent || file_name.innerHTML;
			if (textvalue.toUpperCase().indexOf(searchbox) > -1) {
				videoContainerDiv[i].style.display = "block";
			} else {
				videoContainerDiv[i].style.display = "none";
			}
		} else {
			console.log("");
		}
	}
};

// Function to handle audio file search
const audiosearch = () => {
	const searchbox = document
		.getElementById("audiosearchBar")
		.value.toUpperCase();
	const audioContainerDiv = document.querySelectorAll(".audio-container-box");
	for (let i = 0; i < audioContainerDiv.length; i++) {
		const file_name = audioContainerDiv[i].getElementsByTagName("h2")[0];
		if (file_name) {
			const textvalue = file_name.textContent || file_name.innerHTML;
			if (textvalue.toUpperCase().indexOf(searchbox) > -1) {
				audioContainerDiv[i].style.display = "block";
			} else {
				audioContainerDiv[i].style.display = "none";
			}
		} else {
			console.log();
		}
	}
};

// Function to handle doc file search
const docsearch = () => {
	const searchbox = document.getElementById("docsearchBar").value.toUpperCase();
	const docContainerDiv = document.querySelectorAll(".doc-wrapper-container");
	for (let i = 0; i < docContainerDiv.length; i++) {
		const file_name = docContainerDiv[i].getElementsByTagName("h2")[0];
		if (file_name) {
			const textvalue = file_name.textContent || file_name.innerHTML;
			if (textvalue.toUpperCase().indexOf(searchbox) > -1) {
				docContainerDiv[i].style.display = "block";
			} else {
				docContainerDiv[i].style.display = "none";
			}
		} else {
			console.log("");
		}
	}
};

// Function to handle file search
const filesearch = () => {
	const searchbox = document
		.getElementById("filessearchBar")
		.value.toUpperCase();
	const fileContainerDiv = document.querySelectorAll(".files-container-box");
	for (let i = 0; i < fileContainerDiv.length; i++) {
		const file_name = fileContainerDiv[i].getElementsByTagName("h2")[0];
		if (file_name) {
			const textvalue = file_name.textContent || file_name.innerHTML;
			if (textvalue.toUpperCase().indexOf(searchbox) > -1) {
				fileContainerDiv[i].style.display = "block";
			} else {
				fileContainerDiv[i].style.display = "none";
			}
		} else {
			console.log("");
		}
	}
};

document.getElementById("searchBar").addEventListener("input", search);

// Add event listener to the search bar input
document.getElementById("searchBar").addEventListener("input", search);
document
	.getElementById("videosearchBar")
	.addEventListener("input", videosearch);
document
	.getElementById("audiosearchBar")
	.addEventListener("input", audiosearch);
document.getElementById("filessearchBar").addEventListener("input", filesearch);
document.getElementById("docsearchBar").addEventListener("input", docsearch);

// Function to handle video clicks
function handleVideoClick(event) {
	const videoElement = event.target;
	if (!document.fullscreenElement) {
		videoElement.requestFullscreen().catch((err) => {
			console.error("Error attempting to enable full-screen mode:", err);
		});
	} else {
		document.exitFullscreen();
	}
}

//###############################################
function showConfirmationModal() {
	const confirmationModal = document.getElementById("confirmationModal");
	confirmationModal.style.display = "block";
}

function hideConfirmationModal() {
	const confirmationModal = document.getElementById("confirmationModal");
	confirmationModal.style.display = "none";
}

function closeImageModal() {
	const imageModal = document.getElementById("imageModal");
	imageModal.style.display = "none";
}

document.querySelector(".close-btn").addEventListener("click", () => {
	closeModal();
});

document.getElementById("stayOnPageButton").addEventListener("click", () => {
	hideConfirmationModal();
});

document
	.getElementById("discardChangesButton")
	.addEventListener("click", () => {
		unsavedChanges = false;
		hideConfirmationModal();
		closeImageModal();
	});

function handleImageClick(event) {
	const imageElement = event.target;
	const modal = document.getElementById("imageModal");
	const modalImage = document.getElementById("modalImage");
	const filenameSpan = document.querySelector(
		".file-modal-top-title-file-name"
	);
	modalImage.src = imageElement.src;
	modalImage.setAttribute(
		"data-filename",
		imageElement.getAttribute("data-filename")
	);

	const filename =
		imageElement.getAttribute("data-filename") ||
		imageElement.alt ||
		"Unknown File";
	if (filenameSpan) {
		filenameSpan.textContent = filename;
	}

	undoStack.length = 0;
	redoStack.length = 0;
	modalImage.style.transform = "";
	modalImage.dataset.rotation = 0;
	modalImage.dataset.flip = 1;
	unsavedChanges = false;
	modal.style.display = "block";
	updateButtonStates();
	history.pushState(null, null, location.href);
	updateChangesIndicator();
}

function closeModal() {
	const modal = document.getElementById("imageModal");
	if (unsavedChanges) {
		showConfirmationModal();
	} else {
		modal.style.display = "none";
	}
}

function applyTransformation(transform) {
	const modalImage = document.getElementById("modalImage");
	undoStack.push({
		transform: modalImage.style.transform,
		rotation: modalImage.dataset.rotation,
		flip: modalImage.dataset.flip,
	});

	redoStack.length = 0;

	modalImage.style.transform = transform;
	modalImage.dataset.rotation = parseInt(modalImage.dataset.rotation) % 360;
	modalImage.dataset.flip = modalImage.dataset.flip;

	unsavedChanges = true;

	updateButtonStates();
	updateChangesIndicator();
}

function rotateLeft() {
	const modalImage = document.getElementById("modalImage");
	const currentRotation = parseInt(modalImage.dataset.rotation) || 0;
	const newRotation = (currentRotation - 90) % 360;
	const transform = `rotate(${newRotation}deg) scaleX(${modalImage.dataset.flip})`;
	modalImage.dataset.rotation = newRotation;
	applyTransformation(transform);
}

function rotateRight() {
	const modalImage = document.getElementById("modalImage");
	const currentRotation = parseInt(modalImage.dataset.rotation) || 0;
	const newRotation = (currentRotation + 90) % 360;
	const transform = `rotate(${newRotation}deg) scaleX(${modalImage.dataset.flip})`;
	modalImage.dataset.rotation = newRotation;
	applyTransformation(transform);
}

function flipHorizontal() {
	const modalImage = document.getElementById("modalImage");
	const currentFlip = parseInt(modalImage.dataset.flip) || 1;
	const newFlip = currentFlip * -1;
	const transform = `rotate(${modalImage.dataset.rotation}deg) scaleX(${newFlip})`;
	modalImage.dataset.flip = newFlip;
	applyTransformation(transform);
}

const undoStack = [];
const redoStack = [];

function updateButtonStates() {
	document.getElementById("undoButton").disabled = undoStack.length === 0;
	document.getElementById("redoButton").disabled = redoStack.length === 0;
}

function undo() {
	const modalImage = document.getElementById("modalImage");
	if (undoStack.length > 0) {
		const lastState = undoStack.pop();
		redoStack.push({
			transform: modalImage.style.transform,
			rotation: modalImage.dataset.rotation,
			flip: modalImage.dataset.flip,
		});
		modalImage.style.transform = lastState.transform;
		modalImage.dataset.rotation = lastState.rotation;
		modalImage.dataset.flip = lastState.flip;
		updateButtonStates();
		unsavedChanges = true;

		updateChangesIndicator();
	}
}

function redo() {
	const modalImage = document.getElementById("modalImage");
	if (redoStack.length > 0) {
		const nextState = redoStack.pop();
		undoStack.push({
			transform: modalImage.style.transform,
			rotation: modalImage.dataset.rotation,
			flip: modalImage.dataset.flip,
		});
		modalImage.style.transform = nextState.transform;
		modalImage.dataset.rotation = nextState.rotation;
		modalImage.dataset.flip = nextState.flip;
		updateButtonStates();
		unsavedChanges = true;

		updateChangesIndicator();
	}
}

function cropImage() {
	const modalImage = document.getElementById("modalImage");

	if (!modalImage) {
		console.error("Modal image element not found.");
		return;
	}

	if (cropper) {
		const croppedCanvas = cropper.getCroppedCanvas();
		if (croppedCanvas) {
			const croppedDataUrl = croppedCanvas.toDataURL();
			modalImage.src = croppedDataUrl;
			const filename = modalImage.getAttribute("data-filename");
			const originalImage = document.querySelector(
				`#photosfileList img[data-filename="${filename}"]`
			);

			if (originalImage) {
				originalImage.src = croppedDataUrl;
			}

			cropper.destroy();
			cropper = null;

			updateChangesIndicator();
		} else {
			console.log("Cropping failed. Cropped canvas is null.");
		}
	} else {
		if (modalImage.src) {
			cropper = new Cropper(modalImage, {
				autoCropArea: 1,
				viewMode: 1,
			});
		} else {
			console.error("Modal image source is not set.");
		}
	}
}

document.addEventListener("DOMContentLoaded", function () {
	const cropButton = document.getElementById("cropButton");
	if (cropButton) {
		cropButton.addEventListener("click", cropImage);
	} else {
		console.error("Crop button element not found.");
	}
});

document
	.getElementById("rotateLeftButton")
	.addEventListener("click", rotateLeft);
document
	.getElementById("rotateRightButton")
	.addEventListener("click", rotateRight);
document
	.getElementById("flipHorizontalButton")
	.addEventListener("click", flipHorizontal);
document.getElementById("undoButton").addEventListener("click", undo);
document.getElementById("redoButton").addEventListener("click", redo);
document.querySelector(".close-btn").addEventListener("click", closeModal);
document
	.getElementById("stayOnPageButton")
	.addEventListener("click", hideConfirmationModal);
document
	.getElementById("discardChangesButton")
	.addEventListener("click", () => {
		unsavedChanges = false;
		closeModal();
	});

window.addEventListener("popstate", (event) => {
	const imageModal = document.getElementById("imageModal");
	if (imageModal.style.display === "block") {
		event.preventDefault();
		showConfirmationModal();
	}
});

history.replaceState(null, null, location.href);

//###################################################
function saveCopy() {
	saveImage("copy");
}

function replaceOriginal() {
	const modalImage = document.getElementById("modalImage");
	if (!modalImage) {
		console.error("Modal image element not found.");
		return;
	}

	const filename = modalImage.getAttribute("data-filename");
	if (!filename) {
		console.error("Filename attribute not found on modal image.");
		return;
	}

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	const img = new Image();
	img.src = modalImage.src;
	img.onload = function () {
		canvas.width = img.width;
		canvas.height = img.height;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate((modalImage.dataset.rotation * Math.PI) / 180);
		ctx.scale(modalImage.dataset.flip, 1);
		ctx.drawImage(img, -img.width / 2, -img.height / 2);

		const dataURL = canvas.toDataURL();

		console.log("Replacing original image with filename:", filename);
		sendImageToServer(dataURL, filename, "replace");
	};
}

function saveImage(action) {
	const modalImage = document.getElementById("modalImage");
	if (!modalImage) {
		console.error("Modal image element not found.");
		return;
	}

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	const img = new Image();
	img.src = modalImage.src;

	img.onload = function () {
		canvas.width = img.width;
		canvas.height = img.height;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.translate(canvas.width / 2, canvas.height / 2);
		ctx.rotate((modalImage.dataset.rotation * Math.PI) / 180);
		ctx.scale(modalImage.dataset.flip, 1);
		ctx.drawImage(img, -img.width / 2, -img.height / 2);

		const dataURL = canvas.toDataURL();

		if (action === "replace") {
			const filename = modalImage.getAttribute("data-filename");
			sendImageToServer(dataURL, filename, "replace");
		} else {
			const filenameModal = document.getElementById("filenameModal");
			if (!filenameModal) {
				console.error("Filename modal element not found.");
				return;
			}
			$("#filenameModal").modal("show");

			const saveFilenameBtn = document.getElementById("saveFilenameBtn");
			if (!saveFilenameBtn) {
				console.error("Save filename button element not found.");
				return;
			}
			saveFilenameBtn.addEventListener("click", function () {
				const newFilenameInput = document.getElementById("newFilename");
				if (!newFilenameInput) {
					console.error("New filename input element not found.");
					return;
				}
				const newFilename = newFilenameInput.value.trim();
				if (!newFilename) {
					alert("Please enter a valid filename.");
					return;
				}
				sendImageToServer(dataURL, newFilename, "copy");
				$("#filenameModal").modal("hide");
			});
		}
	};
}

async function sendImageToServer(dataURL, filename, action) {
	try {
		if (!dataURL || !filename || !action) {
			throw new Error("Invalid input data");
		}

		const response = await fetch("/save-image", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				image: dataURL,
				filename: filename,
				action: action,
			}),
		});

		if (!response.ok) {
			let errorMessage = `HTTP error! Status: ${response.status}`;
			if (response.status === 401) {
				errorMessage = "Unauthorized. Please log in.";
			} else if (response.status === 500) {
				errorMessage = "Server error. Please try again later.";
			}
			throw new Error(errorMessage);
		}

		const data = await response.json();
		console.log(data.message);
		unsavedChanges = false;
		if (action === "copy") {
			showPopup("Image saved as a copy successfully.");
		} else {
			showPopup("Image replaced successfully.");
		}
	} catch (error) {
		console.error("Error saving image:", error);
		let errorMessage = "Failed to save image. Please try again.";
		if (error.message.includes("Unauthorized")) {
			errorMessage = "You are not authorized to perform this action.";
		} else if (error.message.includes("Server error")) {
			errorMessage =
				"There is an issue with the server. Please try again later.";
		}
		showPopup(errorMessage);
	}
}

function updateChangesIndicator() {
	const indicator = document.querySelector(".image-changes-indicator");
	if (unsavedChanges) {
		indicator.textContent = "Unsaved changes";
	} else {
		indicator.textContent = "No changes";
	}
}

function showPopup(message) {
	const popupModal = document.getElementById("popupModal");
	const popupMessage = document.getElementById("popupMessage");

	popupMessage.textContent = message;

	// Show the modal
	popupModal.style.display = "block";
	setTimeout(function () {
		popupModal.style.display = "none";
	}, 10000);
}

document.addEventListener("DOMContentLoaded", function () {
	const saveButton = document.getElementById("saveButton");
	const replaceButton = document.getElementById("replaceButton");
	if (saveButton) {
		saveButton.addEventListener("click", saveCopy);
	} else {
		console.error("Save button element not found.");
	}
	if (replaceButton) {
		replaceButton.addEventListener("click", replaceOriginal);
	} else {
		console.error("Replace button element not found.");
	}
});

//####################################################
// Define a function to fetch and display files
function fetchAndDisplayFiles() {
	// console.log("fetchAndDisplayFiles function is called.");
	fetch("/files", {
		headers: {
			Authorization: `Bearer ${f1_token}`,
		},
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.json();
		})
		.then((data) => {
			const photosContainer = document.getElementById("photosfileList");
			const videoFileList = document.getElementById("videofileList");
			const audioFileList = document.getElementById("audiofileList");
			const docFileList = document.getElementById("docfileList");
			const otherFilesContainer = document.getElementById("otherFilesList");
			const MsgBoxContainer = document.querySelector(".msg");
			const messageContainer = document.getElementById("messageContainer");

			photosContainer.innerHTML = "";
			videoFileList.innerHTML = "";
			audioFileList.innerHTML = "";
			docFileList.innerHTML = "";
			otherFilesContainer.innerHTML = "";

			let photosHasData = false;
			let videoHasData = false;
			let audioHasData = false;
			let docHasData = false;
			let otherHasData = false;

			data.files.forEach((file) => {
				const fileExtension = file.filename.split(".").pop().toLowerCase();

				const MAX_FILE_NAME_LENGTH = 20;

				const checkbox = document.createElement("input");
				checkbox.type = "checkbox";
				checkbox.className = "file-checkbox";
				checkbox.id = `checkbox-${file.id}`;
				checkbox.name = `checkbox-${file.id}`;
				checkbox.style.display = "none";
				checkbox.value = file.filename;

				if (["jpg", "jpeg", "svg", "png"].includes(fileExtension)) {
					const imageContainerBox = document.createElement("div");
					imageContainerBox.className = "image-container-box";
					imageContainerBox.id = `file-${file.id}`;
					const imageDiv = document.createElement("div");
					imageDiv.className = "image";
					imageDiv.id = "image";
					const imageElement = document.createElement("img");
					imageElement.src = `data:${file.content_type};base64,${file.content}`;

					imageElement.setAttribute("data-filename", file.filename);

					imageDiv.appendChild(imageElement);
					const fileNameDiv = document.createElement("div");
					fileNameDiv.className = "image-name";
					const fileNameHeading = document.createElement("h2");
					fileNameHeading.className = "file-name";
					fileNameHeading.id = "fileName"; // Add id attribute
					const truncatedFileName = truncateFileName(
						file.filename,
						MAX_FILE_NAME_LENGTH
					);
					fileNameHeading.textContent = truncatedFileName;
					fileNameDiv.appendChild(fileNameHeading);
					imageContainerBox.appendChild(imageDiv);
					imageContainerBox.appendChild(fileNameDiv);
					imageContainerBox.appendChild(checkbox);
					photosContainer.appendChild(imageContainerBox);
					imageContainerBox.addEventListener("contextmenu", (event) => {
						event.preventDefault();
						showButtons(event, file.id, file.filename);
					});

					imageContainerBox.addEventListener("dblclick", () => {
						const checkbox = imageContainerBox.querySelector(".file-checkbox");
						checkbox.checked = !checkbox.checked;
						if (checkbox.checked) {
							imageContainerBox.style.backgroundColor = "#053676";
						} else {
							imageContainerBox.style.backgroundColor = "";
						}
					});
					imageElement.addEventListener("click", handleImageClick);
					photosHasData = true;
				} else if (
					["mp4", "mov", "avi", "mkv", "webm"].includes(fileExtension)
				) {
					const videoContainerDiv = document.createElement("div");
					videoContainerDiv.className = "video-container-box";
					videoContainerDiv.id = `file-${file.id}`;
					const videoElement = document.createElement("video");
					videoElement.src = `data:${file.content_type};base64,${file.content}`;
					videoElement.controls = true;
					videoElement.setAttribute("data-setup", "{}");
					videoElement.setAttribute("controlsList", "nodownload");

					videoContainerDiv.appendChild(videoElement);

					const fileNameDiv = document.createElement("h2");
					fileNameDiv.className = "file-name";
					fileNameDiv.id = "fileName";
					const truncatedFileName = truncateFileName(
						file.filename,
						MAX_FILE_NAME_LENGTH
					);
					fileNameDiv.textContent = truncatedFileName;
					videoContainerDiv.appendChild(fileNameDiv);
					videoContainerDiv.appendChild(checkbox);
					videoFileList.appendChild(videoContainerDiv);
					videoContainerDiv.addEventListener("contextmenu", (event) => {
						event.preventDefault();
						showButtons(event, file.id, file.filename);
					});

					videoContainerDiv.addEventListener("dblclick", () => {
						const checkbox = videoContainerDiv.querySelector(".file-checkbox");
						checkbox.checked = !checkbox.checked;
						if (checkbox.checked) {
							videoContainerDiv.style.backgroundColor = "#053676";
						} else {
							videoContainerDiv.style.backgroundColor = "";
						}
					});
					videoElement.addEventListener("click", handleVideoClick);
					videoHasData = true;
				} else if (["mp3", "wav", "ogg"].includes(fileExtension)) {
					const audioContainerDiv = document.createElement("div");
					audioContainerDiv.className = "audio-container-box";
					audioContainerDiv.id = `file-${file.id}`;

					const audioElement = document.createElement("audio");
					audioElement.src = `data:${file.content_type};base64,${file.content}`;
					audioElement.controls = true;
					audioContainerDiv.appendChild(audioElement);

					const fileNameDiv = document.createElement("h2");
					fileNameDiv.className = "file-name";
					fileNameDiv.id = "fileName";
					const truncatedFileName = truncateFileName(
						file.filename,
						MAX_FILE_NAME_LENGTH
					);
					fileNameDiv.textContent = truncatedFileName;
					audioContainerDiv.appendChild(fileNameDiv);
					audioContainerDiv.appendChild(checkbox);
					audioFileList.appendChild(audioContainerDiv);
					audioContainerDiv.addEventListener("contextmenu", (event) => {
						event.preventDefault();
						showButtons(event, file.id, file.filename);
					});

					audioContainerDiv.addEventListener("dblclick", () => {
						const checkbox = audioContainerDiv.querySelector(".file-checkbox");
						checkbox.checked = !checkbox.checked;
						if (checkbox.checked) {
							audioContainerDiv.style.backgroundColor = "#053676";
						} else {
							audioContainerDiv.style.backgroundColor = "";
						}
					});
					audioHasData = true;
				} else if (["doc", "pdf", "docx"].includes(fileExtension)) {
					const docWrapperContainer = document.createElement("div");
					docWrapperContainer.className = "doc-wrapper-container";
					docWrapperContainer.id = `file-${file.id}`;
					const docContainerDiv = document.createElement("div");
					docContainerDiv.className = "doc-container-box";
					const iconElement = document.createElement("i");
					iconElement.className = "far fa-file";
					switch (fileExtension) {
						case "pdf":
							iconElement.className = "far fa-file-pdf";
							break;
						case "doc":
						case "docx":
							iconElement.className = "far fa-file-word";
							break;
						case "xls":
						case "xlsx":
							iconElement.className = "far fa-file-excel";
							break;
					}
					const fileNameDiv = document.createElement("h2");
					fileNameDiv.className = "file-name";
					fileNameDiv.id = "fileName";
					const truncatedFileName = truncateFileName(
						file.filename,
						MAX_FILE_NAME_LENGTH
					);
					fileNameDiv.textContent = truncatedFileName;
					fileNameDiv.prepend(iconElement);
					docContainerDiv.appendChild(fileNameDiv);
					docWrapperContainer.appendChild(docContainerDiv);
					docFileList.appendChild(docWrapperContainer);
					docContainerDiv.appendChild(checkbox);
					docWrapperContainer.addEventListener("contextmenu", (event) => {
						event.preventDefault();
						showButtons(event, file.id, file.filename);
					});

					docWrapperContainer.addEventListener("dblclick", () => {
						const checkbox =
							docWrapperContainer.querySelector(".file-checkbox");
						checkbox.checked = !checkbox.checked;
						if (checkbox.checked) {
							docWrapperContainer.style.backgroundColor = "#053676";
						} else {
							docWrapperContainer.style.backgroundColor = "";
						}
					});

					docHasData = true;
				} else if (fileExtension === "pdf") {
					const docWrapperContainer = document.createElement("div");
					docWrapperContainer.className = "doc-wrapper-container";
					docWrapperContainer.id = `file-${file.id}`;

					const docContainerDiv = document.createElement("div");
					docContainerDiv.className = "doc-container-box";

					const iconElement = document.createElement("i");
					iconElement.className = "far fa-file-pdf";

					const fileNameDiv = document.createElement("h2");
					fileNameDiv.className = "file-name";
					fileNameDiv.textContent = file.filename;

					const embedElement = document.createElement("embed");
					embedElement.src = `data:${file.content_type};base64,${file.content}`;
					embedElement.type = "application/pdf";
					embedElement.width = "100%";
					embedElement.height = "400px";

					fileNameDiv.prepend(iconElement);
					docContainerDiv.appendChild(fileNameDiv);
					docContainerDiv.appendChild(embedElement);
					docWrapperContainer.appendChild(docContainerDiv);
					docFileList.appendChild(docWrapperContainer);

					docHasData = true;
				} else {
					const fileContainerDiv = document.createElement("div");
					fileContainerDiv.className = "files-container-box";
					fileContainerDiv.id = `file-${file.id}`;
					const contentsDiv = document.createElement("div");
					contentsDiv.className = "files-container-box-contents";

					let iconClass;
					switch (fileExtension) {
						case "pdf":
							iconClass = "far fa-file-pdf";
							break;
						case "html":
							iconClass = "fab fa-html5";
							break;
						case "css":
							iconClass = "far fa-css3-alt";
							break;
						case "py":
							iconClass = "fab fa-python";
							break;
						case "js":
							iconClass = "fab fa-js-square";
							break;
						case "xlsx":
							iconClass = "far fa-file-excel";
							break;
						case "gif":
							iconClass = "fas fa-file-video";
							break;
						default:
							iconClass = "far fa-file";
							break;
					}

					const iconElement = document.createElement("i");
					iconElement.className = iconClass;
					const iconDiv = document.createElement("div");
					iconDiv.className = "icon";
					iconDiv.appendChild(iconElement);
					const fileNameDiv = document.createElement("h2");
					fileNameDiv.className = "file-name";
					fileNameDiv.id = "fileName";
					const truncatedFileName = truncateFileName(
						file.filename,
						MAX_FILE_NAME_LENGTH
					);
					fileNameDiv.textContent = truncatedFileName;
					contentsDiv.appendChild(iconDiv);
					contentsDiv.appendChild(fileNameDiv);
					fileContainerDiv.appendChild(contentsDiv);
					fileContainerDiv.appendChild(checkbox);
					otherFilesContainer.appendChild(fileContainerDiv);
					fileContainerDiv.addEventListener("contextmenu", (event) => {
						event.preventDefault();
						showButtons(event, file.id, file.filename);
					});

					fileContainerDiv.addEventListener("dblclick", () => {
						const checkbox = fileContainerDiv.querySelector(".file-checkbox");
						checkbox.checked = !checkbox.checked;
						if (checkbox.checked) {
							fileContainerDiv.style.backgroundColor = "#053676";
							fileNameElement.style.textDecoration = "underline";
							fileNameElements.style.color = "fff";
						} else {
							fileContainerDiv.style.backgroundColor = "";
						}
					});
					otherHasData = true;
				}
			});
			const fileNameElements = document.querySelectorAll(".file-name");

			fileNameElements.forEach((fileNameElement) => {
				fileNameElement.addEventListener("dblclick", () => {
					const checkbox =
						fileNameElement.parentNode.querySelector(".file-checkbox");
					if (checkbox) {
						checkbox.checked = !checkbox.checked;
					}
				});
			});

			// Display appropriate messages for each section
			if (!photosHasData) {
				photosContainer.innerHTML = "No photos available.";
			}
			if (!videoHasData) {
				videoFileList.innerHTML = "No videos available.";
			}
			if (!audioHasData) {
				audioFileList.innerHTML = "No audio files available.";
			}
			if (!docHasData) {
				docFileList.innerHTML = "No documents available.";
			}
			if (!otherHasData) {
				otherFilesContainer.innerHTML = "No files available.";
			}

			// Display overall message if no data is available
			if (
				!photosHasData &&
				!videoHasData &&
				!audioHasData &&
				!docHasData &&
				!otherHasData
			) {
				MsgBoxContainer.innerHTML = "No data available.";
				messageContainer.textContent = "No data available.";
			} else {
				MsgBoxContainer.innerHTML = "";
				messageContainer.textContent = "";
			}
		})
		.catch((error) => {
			console.error("Error fetching files:", error);
		})
		.finally(() => {
			hideSpinner();
		});
}

fetchAndDisplayFiles();
// const intervalId = setInterval(fetchAndDisplayFiles, 600000);

function truncateFileName(fileName, maxLength) {
	if (fileName.length > maxLength) {
		return fileName.slice(0, maxLength - 3) + "...";
	} else {
		return fileName;
	}
}

// Function to load and display PDF
function loadAndDisplayPDF(fileId, contentType, content) {
	const embedElement = document.createElement("embed");
	embedElement.src = `data:${contentType};base64,${content}`;
	embedElement.type = "application/pdf";
	embedElement.width = "100%";
	embedElement.height = "600px";

	const pdfContainer = document.getElementById(`file-${fileId}`);
	pdfContainer.innerHTML = ""; // Clear existing content
	pdfContainer.appendChild(embedElement);
}

document.addEventListener("DOMContentLoaded", () => {
	const checkboxes = document.querySelectorAll(".file-checkbox");
	checkboxes.forEach((checkbox) => {
		checkbox.addEventListener("change", function () {
			const fileContainerDiv = this.closest(".files-container-box");
			if (this.checked) {
				fileContainerDiv.style.backgroundColor = "#053676";
			} else {
				fileContainerDiv.style.backgroundColor = "";
			}
		});
	});
});

function selectAllFiles(container) {
	if (!container) {
		console.error("Container is undefined");
		return;
	}

	const checkboxes = container.querySelectorAll(".file-checkbox");
	checkboxes.forEach((checkbox) => {
		checkbox.checked = true;

		// Find the parent container of the checkbox
		const fileContainerDiv = checkbox.closest(
			".files-container-box, .image-container-box, .video-container-box, .audio-container-box, .doc-wrapper-container"
		);

		// Apply the highlight style
		if (fileContainerDiv) {
			fileContainerDiv.style.backgroundColor = "#053676";
		}
	});
}

function deselectAllFiles(container) {
	if (!container) {
		console.error("Container is undefined");
		return;
	}

	const checkboxes = container.querySelectorAll(".file-checkbox");
	checkboxes.forEach((checkbox) => {
		checkbox.checked = false;

		const fileContainerDiv = checkbox.closest(
			".files-container-box, .image-container-box, .video-container-box, .audio-container-box, .doc-wrapper-container"
		);
		if (fileContainerDiv) {
			fileContainerDiv.style.backgroundColor = "";
		}
	});
}

const d_token = localStorage.getItem("token");
function createDownloadButton(fileId, filename, multiple = false) {
	const downloadButton = document.createElement("button");
	downloadButton.className = "context-menu-button";
	downloadButton.innerHTML = `<i class="fas fa-download icon"></i> ${
		multiple ? "Download" : "Download"
	}`;
	downloadButton.addEventListener("click", () => {
		if (multiple) {
			downloadSelectedFiles();
		} else {
			downloadFile(fileId, filename);
		}
	});
	return downloadButton;
}

function downloadSelectedFiles() {
	const selectedFiles = getSelectedFiles();
	if (selectedFiles.ids.length > 0) {
		selectedFiles.ids.forEach((fileId, index) => {
			downloadFile(fileId, selectedFiles.filenames[index]);
		});
	} else {
		alert("No files selected for download.");
	}
}

function getSelectedFiles() {
	const checkboxes = document.querySelectorAll(".file-checkbox:checked");
	const ids = [];
	const filenames = [];
	checkboxes.forEach((checkbox) => {
		ids.push(checkbox.id.replace("checkbox-", ""));
		filenames.push(checkbox.value);
	});
	return { ids, filenames };
}

function createDeleteButton() {
	const deleteButton = document.createElement("button");
	deleteButton.className = "context-menu-button";
	deleteButton.innerHTML = `<i class="fas fa-trash-alt icon"></i> Delete`;
	deleteButton.addEventListener("click", () => {
		const selectedFiles = getSelectedFiles();
		if (selectedFiles.ids.length > 0) {
			deleteFile(selectedFiles.ids, selectedFiles.filenames);
		} else {
			alert("No files selected for deletion.");
		}
	});
	return deleteButton;
}

function createShareButton() {
	const shareButton = document.createElement("button");
	shareButton.className = "context-menu-button";
	shareButton.innerHTML = `<i class="fas fa-share-alt icon"></i> Share`;
	shareButton.addEventListener("click", (event) => {
		event.preventDefault();
		const selectedFiles = getSelectedFiles();
		if (selectedFiles.ids.length > 0) {
			showShareMenu(event, selectedFiles.ids, selectedFiles.filenames);
		} else {
			alert("No files selected for sharing.");
		}
	});
	return shareButton;
}

function createRenameButton(fileId, filename) {
	const renamebtn = document.createElement("button");
	renamebtn.className = "context-menu-button";
	renamebtn.innerHTML = `<i class="fas fa-edit icon"></i> Rename`;
	renamebtn.addEventListener("click", (event) => {
		event.preventDefault();
		showRenameMenu(event, fileId, filename);
	});
	return renamebtn;
}

let container;
function createSelectAllButton(container) {
	const selectAllButton = document.createElement("button");
	selectAllButton.className = "context-menu-button";
	selectAllButton.innerHTML = `<i class="fas fa-check-square icon"></i> Mark All <span id="shortcut">Ctrl+A</span>`;
	selectAllButton.addEventListener("click", () => {
		selectAllFiles(container); // Pass container to selectAllFiles
	});
	return selectAllButton;
}

function createDeSelectAllButton(container) {
	const deSelectAllButton = document.createElement("button");
	deSelectAllButton.className = "context-menu-button";
	deSelectAllButton.innerHTML = `<i class="far fa-square icon"></i> Un-Mark <span id="shortcut_D">Ctrl+Shift+A</span>`;
	deSelectAllButton.addEventListener("click", () => {
		deselectAllFiles(container); // Pass container to deselectAllFiles
	});
	return deSelectAllButton;
}

function showButtons(event, fileId, filename) {
	const existingContainer = document.querySelector(".context-menu-container");
	if (existingContainer) {
		existingContainer.remove();
	}

	const containers = [
		document.getElementById("photosfileList"),
		document.getElementById("videofileList"),
		document.getElementById("audiofileList"),
		document.getElementById("docfileList"),
		document.getElementById("otherFilesList"),
	];

	let container = null;
	for (const cont of containers) {
		if (cont && cont.contains(event.target)) {
			container = cont;
			break;
		}
	}

	if (!container) {
		console.error("Container element not found");
		return;
	}

	const containerRect = container.getBoundingClientRect();
	const menuContainer = document.createElement("div");
	menuContainer.className = "context-menu-container";

	let left = event.pageX;
	let top = event.pageY;

	menuContainer.style.position = "absolute";
	menuContainer.style.visibility = "hidden";
	document.body.appendChild(menuContainer);

	const menuRect = menuContainer.getBoundingClientRect();

	if (left + menuRect.width > containerRect.right) {
		left = containerRect.right - menuRect.width;
	}
	if (top + menuRect.height > containerRect.bottom) {
		top = containerRect.bottom - menuRect.height;
	}
	if (left < containerRect.left) {
		left = containerRect.left;
	}
	if (top < containerRect.top) {
		top = containerRect.top;
	}

	menuContainer.style.left = `${left}px`;
	menuContainer.style.top = `${top}px`;
	menuContainer.style.visibility = "visible";

	const downloadButton = createDownloadButton(fileId, filename, true);
	const deleteButton = createDeleteButton();
	const shareButton = createShareButton();
	const LinkButton = GenerateLinkButton();
	const renameButton = createRenameButton(fileId, filename);
	const selectAllButton = createSelectAllButton(container); // Pass container
	const deSelectAllButton = createDeSelectAllButton(container); // Pass container

	menuContainer.appendChild(downloadButton);
	menuContainer.appendChild(deleteButton);
	menuContainer.appendChild(shareButton);
	menuContainer.appendChild(LinkButton);
	menuContainer.appendChild(renameButton);
	menuContainer.appendChild(selectAllButton);
	menuContainer.appendChild(deSelectAllButton);

	downloadButton.addEventListener("click", hideButtons);
	deleteButton.addEventListener("click", hideButtons);
	shareButton.addEventListener("click", hideButtons);
	LinkButton.addEventListener("click", hideButtons);
	renameButton.addEventListener("click", hideButtons);
	selectAllButton.addEventListener("click", hideButtons);
	deSelectAllButton.addEventListener("click", hideButtons);

	document.body.appendChild(menuContainer);

	document.addEventListener("click", hideButtonsOutside);
	menuContainer.addEventListener("click", (event) => event.stopPropagation());
}

function hideButtons() {
	const menuContainer = document.querySelector(".context-menu-container");
	if (menuContainer) {
		menuContainer.remove();
	}
	document.removeEventListener("click", hideButtonsOutside);
}

function hideButtonsOutside(event) {
	const menuContainer = document.querySelector(".context-menu-container");
	if (menuContainer && !menuContainer.contains(event.target)) {
		menuContainer.remove();
	}
}

function downloadFile(fileId, filename) {
	// fetch(`/download/${fileId}`, {
	fetch(`/download/${fileId}`, {
		headers: {
			Authorization: `Bearer ${d_token}`,
		},
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.blob();
		})
		.then((blob) => {
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
		})
		.catch((error) => {
			console.log("");
		});
}

function deleteFile(fileIds, filenames) {
	// Check if fileIds is an array, if not, convert it to an array
	if (!Array.isArray(fileIds)) {
		fileIds = [fileIds];
	}
	if (!Array.isArray(filenames)) {
		filenames = [filenames];
	}

	// Send delete requests for each file
	fileIds.forEach((fileId, index) => {
		fetch(`/delete/${fileId}`, {
			// fetch(`/delete/${fileId}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${d_token}`,
			},
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				console.log(`File '${filenames[index]}' deleted successfully.`);

				const fileElement = document.getElementById(`file-${fileId}`);
				if (fileElement) {
					fileElement.remove();
					console.log(`File element '${filenames[index]}' removed from UI.`);
				} else {
					console.log(`File element '${filenames[index]}' not found in UI.`);
				}

				// If this is the last file, display a notification message
				if (index === fileIds.length - 1) {
					showDeleteNotification(filenames);
				}
			})
			.catch((error) => {
				console.error("Error deleting file:", error);
			});
	});
}

function showDeleteNotification(filenames) {
	let notificationText;
	if (filenames.length === 1) {
		notificationText = `File '${filenames[0]}' has been deleted.`;
	} else {
		notificationText = `${filenames.length} files have been deleted.`;
	}
	const notificationElement = document.createElement("div");
	notificationElement.className = "delete-notification";
	notificationElement.textContent = notificationText;
	document.body.appendChild(notificationElement);
	setTimeout(() => {
		notificationElement.remove();
	}, 3000);
}

function showShareMenu(event, fileIds, filenames) {
	const existingContainer = document.querySelector(
		".share-context-menu-container"
	);
	if (existingContainer) {
		existingContainer.remove();
	}

	const menuContainer = document.createElement("div");
	menuContainer.className = "share-context-menu-container";

	const headerContainer = document.createElement("div");
	headerContainer.className = "header-container";
	const header = document.createElement("h3");
	header.className = "share-context-menu-header";
	header.textContent = "Enter recipient's username or email";
	headerContainer.appendChild(header);

	const clbtn = document.createElement("button");
	clbtn.className = "context-menu-closeButton";
	clbtn.id = "context-menu-close-btn";
	clbtn.innerHTML = `<i class="fas fa-times icon"></i>`;
	clbtn.addEventListener("click", () => {
		menuContainer.remove();
		document.removeEventListener("click", hideMenuOnClickOutside);
	});
	headerContainer.appendChild(clbtn);
	menuContainer.appendChild(headerContainer);

	const input = document.createElement("input");
	input.id = "recipientInput";
	input.className = "context-menu-input recipient-input";
	menuContainer.appendChild(input);

	const sharebtn = document.createElement("button");
	sharebtn.className = "shareButton";
	sharebtn.id = "shareButton";
	const icon = document.createElement("i");
	icon.className = "fas fa-share-alt icon";
	icon.id = "shareButtonicon";
	sharebtn.appendChild(icon);

	// Create the spinner element dynamically
	const spinner = document.createElement("div");
	spinner.className = "spinner-container";
	spinner.style.position = "absolute";
	spinner.innerHTML = `<div class="share-button-spinner"></div>`;
	spinner.style.display = "none";
	sharebtn.appendChild(spinner);

	menuContainer.appendChild(sharebtn);

	const msg = document.createElement("div");
	msg.className = "msgContainer";
	msg.id = "msgContainer";
	msg.style.display = "flex";
	msg.style.marginTop = "10px";
	msg.textContent = " ";
	menuContainer.appendChild(msg);

	const confirmationMsg = document.createElement("div");
	const maxLength = 50;
	const truncatedFilenames = filenames.map((filename) =>
		filename.length > maxLength
			? filename.substring(0, maxLength) + "..."
			: filename
	);
	confirmationMsg.textContent = `Files '${truncatedFilenames.join(
		", "
	)}' selected for sharing.`;
	confirmationMsg.className = "confirmation-message";
	menuContainer.appendChild(confirmationMsg);
	setTimeout(() => {
		confirmationMsg.remove();
	}, 1440000);
	document.body.appendChild(menuContainer);

	menuContainer.style.display = "block";
	const repositionMenu = () => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const menuWidth = menuContainer.offsetWidth;
		const menuHeight = menuContainer.offsetHeight;

		menuContainer.style.left = `${(viewportWidth - menuWidth) / 2}px`;
		menuContainer.style.top = `${(viewportHeight - menuHeight) / 2}px`;
	};

	repositionMenu();

	window.addEventListener("resize", repositionMenu);

	// document.addEventListener("click", hideMenuOnClickOutside);
	input.addEventListener("input", () => {
		const recipientIdentifier = input.value;
		const fv_token = localStorage.getItem("token");
		if (recipientIdentifier.length > 0) {
			fetch("/validate_user", {
				// fetch("/validate_user", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${fv_token}`,
				},
				body: JSON.stringify({
					recipient_identifier: recipientIdentifier,
				}),
			})
				.then((response) => {
					if (!response.ok) {
						throw new Error("Network response was not ok");
					}
					return response.json();
				})
				.then((data) => {
					const msgContainer = document.getElementById("msgContainer");
					if (msgContainer) {
						const message = data.exists
							? `${recipientIdentifier} is available for sharing`
							: `${recipientIdentifier} is not available for sharing`;
						msgContainer.textContent = message;
						msgContainer.style.color = data.exists ? "green" : "red";
					}
				})
				.catch((error) => {
					const msgContainer = document.getElementById("msgContainer");
					if (msgContainer) {
						msgContainer.textContent = "Error validating user";
						msgContainer.style.color = "red";
					}
				});
		} else {
			const msgContainer = document.getElementById("msgContainer");
			if (msgContainer) {
				msgContainer.textContent = "";
			}
		}
	});

	let recipientIdentifier = "";

	input.addEventListener("input", () => {
		recipientIdentifier = input.value.trim();
	});

	function shareFiles(fileIds, recipient, message, color) {
		const payload = {
			file_ids: fileIds,
			recipient_identifier: recipient,
			timezone_offset: new Date().getTimezoneOffset() / -60, // Calculate the timezone offset in hours
		};

		// Show spinner
		const spinner = document.querySelector(".spinner-container");
		spinner.style.display = "block";

		const fs_token = localStorage.getItem("token");

		fetch("/share", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${fs_token}`,
			},
			body: JSON.stringify(payload),
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response.json();
			})
			.then((data) => {
				if (data.error) {
					showShareMenuMessage(message, color);
				} else {
					showShareMenuMessage(`Files shared with ${recipient}`, color);
				}
			})
			.catch((error) => {
				showShareMenuMessage("Error sharing files", "red");
			})
			.finally(() => {
				spinner.style.display = "none";
			});
	}

	function showShareMenuMessage(message, color) {
		let msgContainer = document.getElementById("msgContainer");
		if (!msgContainer) {
			msgContainer = document.createElement("div");
			msgContainer.id = "msgContainer";
			msgContainer.className = "msgContainer";
			msgContainer.style.display = "flex";
			msgContainer.style.marginTop = "10px";
			document.body.appendChild(msgContainer);
		}
		msgContainer.textContent = message;
		msgContainer.style.color = color;
	}

	sharebtn.addEventListener("click", (e) => {
		e.stopPropagation();
		const recipient = recipientIdentifier;

		if (recipient === "") {
			showShareMenuMessage("Recipient cannot be empty", "red");
			return;
		}
		shareFiles(fileIds, recipient, "", "");
	});
}

function hideMenuOnClickOutside(event) {
	const menuContainer = document.querySelector(".share-context-menu-container");
	if (menuContainer && !menuContainer.contains(event.target)) {
		menuContainer.remove();
		document.removeEventListener("click", hideMenuOnClickOutside);
	}
}

function createLinkModal(event, fileIds, filenames) {
	// Accept an array of file IDs
	const existingContainer = document.querySelector(".rmodal-container");
	if (existingContainer) {
		existingContainer.remove();
	}

	const rmodal = document.createElement("div");
	rmodal.className = "rmodal-container";
	rmodal.id = "rmodal-container";

	const modalheader = document.createElement("div");
	modalheader.className = "rmodal-header-container";
	const header = document.createElement("h3");
	header.className = "modal-header";
	header.textContent = "iSharee App";
	modalheader.appendChild(header);

	// Create and append the input field
	const inputField = document.createElement("input");
	inputField.type = "text";
	inputField.className = "link-input";
	inputField.value = "Generating link...";
	inputField.placeholder = "Shareable link will appear here";

	// Create the copy button with an icon
	const copyButton = document.createElement("button");
	copyButton.className = "copy-button";
	copyButton.innerHTML = '<i class="bx bx-copy"></i>'; // Using Font Awesome icon
	copyButton.addEventListener("click", () => {
		inputField.select();
		document.execCommand("copy");
		alert("Link copied to clipboard!");
	});

	// Create a container for the input and copy button
	const inputContainer = document.createElement("div");
	inputContainer.className = "input-container";
	inputContainer.appendChild(inputField);
	inputContainer.appendChild(copyButton);

	// Create the button container
	const btnContainer = document.createElement("div");
	btnContainer.className = "btn-container";

	// Create the Cancel button
	const cancelButton = document.createElement("button");
	cancelButton.className = "btn-cancel";
	cancelButton.textContent = "Cancel";
	cancelButton.addEventListener("click", () => {
		rmodal.remove();
		document.removeEventListener("click", hideMenuOnClickOutside);
	});

	// Append buttons to the button container
	btnContainer.appendChild(cancelButton);

	// Append elements to the modal
	rmodal.appendChild(modalheader);
	rmodal.appendChild(inputContainer); // Use inputContainer instead of inputField directly
	rmodal.appendChild(btnContainer);
	document.body.appendChild(rmodal);
	rmodal.style.display = "block";

	const repositionmenu = () => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const menuWidth = rmodal.offsetWidth;
		const menuHeight = rmodal.offsetHeight;

		rmodal.style.left = `${(viewportWidth - menuWidth) / 2}px`;
		rmodal.style.top = `${(viewportHeight - menuHeight) / 2}px`;
	};

	repositionmenu();

	window.addEventListener("resize", repositionmenu);

	// Generate shareable link
	generateShareableLink(fileIds)
		.then((link) => {
			inputField.value = link;
		})
		.catch((error) => {
			inputField.value = "Error generating link.";
			console.error("Error:", error);
		});
}

function GenerateLinkButton() {
	const LinkButton = document.createElement("button");
	LinkButton.className = "context-menu-button";
	LinkButton.innerHTML = `<i class="fas fa-link icon"></i>Generate Link`;
	LinkButton.addEventListener("click", (event) => {
		event.preventDefault();
		const selectedFiles = getSelectedFiles();

		if (selectedFiles.ids.length > 0) {
			createLinkModal(event, selectedFiles.ids, selectedFiles.filenames);
		} else {
			alert("No files selected for sharing.");
		}
	});
	return LinkButton;
}

async function generateShareableLink(fileIds) {
	const response = await fetch("/generate_link", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ file_ids: fileIds }),
	});
	const data = await response.json();
	if (data.shareable_link) {
		return data.shareable_link;
	} else {
		throw new Error(data.error || "Unknown error");
	}
}

function showRenameMenu(event, fileId, filename) {
	const existingContainer = document.querySelector(".rmodal-container");
	if (existingContainer) {
		existingContainer.remove();
	}

	const rmodal = document.createElement("div");
	rmodal.className = "rmodal-container";
	rmodal.id = "rmodal-container";

	const modalheader = document.createElement("div");
	modalheader.className = "rmodal-header-container";
	const header = document.createElement("h3");
	header.className = "modal-header";
	header.textContent = "iSharee App";
	modalheader.appendChild(header);

	// Create and append the input field
	const inputField = document.createElement("input");
	inputField.type = "text";
	inputField.className = "rename-input";
	inputField.value = filename;
	inputField.placeholder = "Enter new filename";

	// Create the button container
	const btnContainer = document.createElement("div");
	btnContainer.className = "btn-container";

	// Create the Cancel button
	const cancelButton = document.createElement("button");
	cancelButton.className = "btn-cancel";
	cancelButton.textContent = "Cancel";
	cancelButton.addEventListener("click", () => {
		rmodal.remove();
		document.removeEventListener("click", hideMenuOnClickOutside);
	});

	// Create the Okay button
	const okayButton = document.createElement("button");
	okayButton.className = "btn-okay";
	okayButton.textContent = "Okay";
	okayButton.addEventListener("click", () => {
		const newName = inputField.value.trim();
		if (newName && newName !== filename) {
			renameFile(fileId, newName, MsgCon);
		} else if (newName === filename) {
			MsgCon.textContent = "The new name is the same as the current name.";
			MsgCon.style.color = "red";
		} else {
			MsgCon.textContent = "Filename cannot be empty.";
			MsgCon.style.color = "red";
		}
	});

	// Create and style the message container
	const MsgCon = document.createElement("div");
	MsgCon.id = "MsgCon";
	MsgCon.className = "MsgCon";
	MsgCon.style.display = "flex";
	MsgCon.style.marginTop = "10px";

	// Append buttons to the button container
	btnContainer.appendChild(cancelButton);
	btnContainer.appendChild(okayButton);

	// Append elements to the modal
	rmodal.appendChild(modalheader);
	rmodal.appendChild(inputField);
	rmodal.appendChild(btnContainer);
	rmodal.appendChild(MsgCon);
	document.body.appendChild(rmodal);
	rmodal.style.display = "block";

	const repositionmenu = () => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const menuWidth = rmodal.offsetWidth;
		const menuHeight = rmodal.offsetHeight;

		rmodal.style.left = `${(viewportWidth - menuWidth) / 2}px`;
		rmodal.style.top = `${(viewportHeight - menuHeight) / 2}px`;
	};

	repositionmenu();

	window.addEventListener("resize", repositionmenu);
}

const fR_token = localStorage.getItem("token");
function renameFile(fileId, newName, MsgCon) {
	fetch("/rename", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${fR_token}`,
		},
		body: JSON.stringify({ file_id: fileId, new_filename: newName }),
	})
		.then((response) => {
			const contentType = response.headers.get("content-type");
			if (contentType && contentType.indexOf("application/json") !== -1) {
				return response.json();
			} else {
				return response.text().then((text) => {
					throw new Error(`Unexpected response: ${text}`);
				});
			}
		})
		.then((data) => {
			if (data.message) {
				MsgCon.textContent = "File renamed successfully."; // Update MsgCon
				MsgCon.style.color = "green";

				// Directly update the UI element
				const fileElement = document.querySelector(
					`#file-${fileId} .file-name`
				);
				if (fileElement) {
					fileElement.textContent = newName;
				}
				fetchAndDisplayFiles();
			} else {
				MsgCon.textContent =
					"Error renaming file: " + (data.error || "Unknown error");
				MsgCon.style.color = "red";
			}
		})
		.catch((error) => {
			console.error("Error renaming file:", error);
			MsgCon.textContent = "Error renaming file: " + error.message;
			MsgCon.style.color = "red";
		});
}
