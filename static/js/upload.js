/** @format */

const localStorageToken = localStorage.getItem("token");

function uploadFile() {
	const fileInput = document.getElementById("fileInput");
	const files = fileInput.files;

	if (files.length === 0) {
		// console.error("No files selected.");
		displayErrorMessage("No files selected.");
		uploadFile.disabled = false;
		return;
	}

	const token = localStorage.getItem("token");

	const formData = new FormData();
	for (let i = 0; i < files.length; i++) {
		formData.append("file", files[i]);
	}

	const xhr = new XMLHttpRequest();
	xhr.open("POST", "/upload", true);

	// Set Authorization header with the token
	xhr.setRequestHeader("Authorization", `Bearer ${token}`);
	console.log("Authorization header set with token:", `Bearer ${token}`);

	// Update progress bar during the upload
	xhr.upload.onprogress = function (event) {
		if (event.lengthComputable) {
			const percentComplete = (event.loaded / event.total) * 100;
			const progressBar = document.getElementById("progressBar");
			progressBar.style.width = percentComplete + "%";
			uploadFile.disabled = true;
		}
	};

	xhr.onload = function () {
		if (xhr.status === 200) {
			displaySuccessMessage("File(s) uploaded successfully");
			uploadFile.disabled = false;
			selectedFiles.innerHTML = "";

			setTimeout(function () {
				document.getElementById("progressBarContainer").style.display = "none";
			}, 5000);
			fetchFileList();
			fileInput.value = "";
			displaySelectedFiles();
			clearSelectedFilesContainer();
		} else if (xhr.status === 400) {
			displayErrorMessage(
				"Error uploading file(s): Exceeded maximum table size"
			);
		} else {
			displayErrorMessage("Error uploading file(s)");
		}
	};

	// Function to clear the selected files container
	function clearSelectedFilesContainer() {
		const selectedFiles = document.getElementById("selectedFiles");
		selectedFiles.innerHTML = "";
	}

	xhr.onerror = function () {
		displayErrorMessage("Error uploading file");
	};

	// Display the progress bar container before starting the upload
	document.getElementById("progressBarContainer").style.display = "block";
	xhr.send(formData);
}

// Function to display error message
function displayErrorMessage(message) {
	const uploadMessage = document.getElementById("uploadMessage");
	uploadMessage.textContent = message;
	uploadMessage.className = "error";
	uploadMessage.style.display = "block";

	// Hide the error message after 5 seconds
	setTimeout(() => {
		uploadMessage.style.display = "none";
	}, 10000);
}

// Function to display success message
function displaySuccessMessage(message) {
	const uploadMessage = document.getElementById("uploadMessage");
	uploadMessage.textContent = message;
	uploadMessage.className = "success";
	uploadMessage.style.display = "block";

	// Hide the success message after 5 seconds
	setTimeout(() => {
		uploadMessage.style.display = "none";
	}, 10000);
}

// Function to fetch the updated file list
function fetchFileList() {
	const token = localStorage.getItem("token");

	fetch("/files", {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.json(); // Parse response as JSON
		})
		.then((data) => {
			updateUIWithFileList(data.files);
		})
		.catch((error) => {
			console.error("Error fetching files:", error);
		});
}

// Function to update the UI with the fetched file list
function updateUIWithFileList(files) {
	const recentlyUploadedfileList = document.getElementById(
		"recentlyUploadedfileList"
	);
	recentlyUploadedfileList.innerHTML = "";

	for (let i = 0; i < files.length; i++) {
		const fileItem = document.createElement("div");
		fileItem.textContent = files[i].name;
		recentlyUploadedfileList.appendChild(fileItem);
	}

	document.getElementById("recentlyuploadedfiles").style.display = "block";
}

function triggerFileInput() {
	document.getElementById("fileInput").click();
}

function handleDragOver(event) {
	event.preventDefault();
	document.getElementById("dropArea").classList.add("dragover");
}

function handleDragLeave(event) {
	document.getElementById("dropArea").classList.remove("dragover");
}

function handleDrop(event) {
	event.preventDefault();
	document.getElementById("dropArea").classList.remove("dragover");
	const files = event.dataTransfer.files;
	handleFiles(files);
}

function handleFiles(files) {
	const fileInput = document.getElementById("fileInput");
	const existingFiles = fileInput.files;

	// Create a new FileList object to hold the combined files
	const combinedFiles = new DataTransfer();

	// Add existing files to the combined FileList object
	for (let i = 0; i < existingFiles.length; i++) {
		combinedFiles.items.add(existingFiles[i]);
	}

	// Check if the file being dropped is already in the existing files
	for (let i = 0; i < files.length; i++) {
		let fileExists = false;
		for (let j = 0; j < existingFiles.length; j++) {
			if (
				files[i].name === existingFiles[j].name &&
				files[i].size === existingFiles[j].size
			) {
				fileExists = true;
				break;
			}
		}
		// If the file does not exist in the existing files, add it to the combined files
		if (!fileExists) {
			combinedFiles.items.add(files[i]);
		}
	}

	// Update the input element with the combined file list
	fileInput.files = combinedFiles.files;

	// Display the updated selected files
	displaySelectedFiles();
}

function displaySelectedFiles() {
	const fileInput = document.getElementById("fileInput");
	const selectedFiles = fileInput.files;
	const selectedFilesContainer = document.getElementById("selectedFiles");
	selectedFiles.innerHTML = "";

	if (selectedFiles.length === 0) {
		selectedFilesContainer.textContent = "No files selected.";
	} else {
		for (let i = 0; i < selectedFiles.length; i++) {
			const fileName = selectedFiles[i].name;
			const fileItem = document.createElement("div");
			fileItem.classList.add("file-item");

			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.className = "file-checkbox";
			checkbox.style.display = "none";
			checkbox.dataset.fileId = selectedFiles[i].id;
			checkbox.dataset.fileName = fileName;

			const fileNameText = document.createElement("p");
			fileNameText.textContent = fileName;
			fileNameText.id = "card-content-name";

			const removeButton = document.createElement("button");
			removeButton.textContent = "X";
			removeButton.classList.add("remove-button");

			removeButton.onclick = function () {
				const indexToRemove = Array.from(selectedFiles).findIndex(
					(file) => file.name === fileName
				);
				if (indexToRemove > -1) {
					const newFiles = Array.from(selectedFiles);
					newFiles.splice(indexToRemove, 1);
					const newFileList = new DataTransfer();
					newFiles.forEach((file) => newFileList.items.add(file));
					fileInput.files = newFileList.files;
					displaySelectedFiles();
				}
			};

			fileItem.appendChild(checkbox);
			fileItem.appendChild(fileNameText);
			fileItem.appendChild(removeButton);
			selectedFilesContainer.appendChild(fileItem);
		}
	}

	// Call the function to update the total file size
	displayTotalFileSize();
}

// Function to calculate and display the total file size
function displayTotalFileSize() {
	const fileInput = document.getElementById("fileInput");
	const selectedFiles = fileInput.files;
	let totalSize = 0;

	for (let i = 0; i < selectedFiles.length; i++) {
		totalSize += selectedFiles[i].size;
	}

	// Convert bytes to appropriate unit (KB, MB, GB, etc.)
	const formattedTotalSize = formatBytes(totalSize);

	// Display the total file size
	const totalFileSizeElement = document.getElementById("totalFileSize");
	totalFileSizeElement.textContent = formattedTotalSize;
}

// Function to format file size in human-readable format
function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Initialize the display of selected files and total file size
displaySelectedFiles();

// Event listeners for drag and drop functionality
document
	.getElementById("dropArea")
	.addEventListener("dragover", handleDragOver);
document
	.getElementById("dropArea")
	.addEventListener("dragleave", handleDragLeave);
document.getElementById("dropArea").addEventListener("drop", handleDrop);

// Event listener for file input change
document
	.getElementById("fileInput")
	.addEventListener("change", displaySelectedFiles);