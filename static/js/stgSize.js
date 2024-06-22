/** @format */

const ft_token = localStorage.getItem("token");

// Function to format bytes to human-readable format
function formatBytes(bytes) {
	const units = ["bytes", "KB", "MB", "GB", "TB"];
	let unitIndex = 0;
	let size = bytes;

	// Check if size is a number
	if (isNaN(size) || size === 0) {
		return "0 bytes";
	}

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}
	return size.toFixed(2) + " " + units[unitIndex];
}

function displayTableSizes() {
	fetch("http://192.168.74.8:5000/table_sizes", {
	// fetch("https://ishare-i8td.onrender.com/table_sizes", {
		method: "GET",
		headers: {
			Authorization: `Bearer ${ft_token}`,
		},
	})
		.then((response) => {
			if (response.ok) {
				return response.json();
			} else {
				throw new Error("Failed to fetch table sizes");
			}
		})
		.then((data) => {
			const totalTableSize = formatBytes(data.total_table_size);
			const usedTableSize = formatBytes(data.used_table_size);
			const remainingSize = formatBytes(
				Math.max(0, data.total_table_size - data.used_table_size)
			);

			document.getElementById("storageSize").innerHTML = `
            <p>Total Table Size: ${totalTableSize}</p>
            <p>Used Table Size: ${usedTableSize}</p>
            <p>Remaining Total Size: ${remainingSize}</p>
        `;
		})
		.catch((error) => {
			console.error("Error fetching table sizes:", error);
			document.getElementById("storageSize").innerHTML =
				"<p>Error fetching table sizes</p>";
		});
}

displayTableSizes();
