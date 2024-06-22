/** @format */

document.addEventListener("DOMContentLoaded", function () {
	const res_token = localStorage.getItem("token");
	// Function to fetch and display recently added files
	// fetch("http://192.168.74.8:5000/recently_added_files", {
	fetch("http://192.168.74.8:5000/recently_added_files", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${res_token}`,
		},
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			return response.json(); // Parse response as JSON
		})
		.then((data) => {
			try {
				const recentlyAddedFilesContainer =
					document.getElementById("recentlyAddedFiles");
				recentlyAddedFilesContainer.innerHTML = ""; // Clear previous content

				data.files.forEach((file) => {
					const fileItem = document.createElement("div");
					fileItem.textContent = file.filename;
					recentlyAddedFilesContainer.appendChild(fileItem);
				});
			} catch (error) {
				console.error("Error parsing JSON response:", error);
			}
		})
		.catch((error) =>
			console.error("Error fetching recently added files:", error)
		);
});
