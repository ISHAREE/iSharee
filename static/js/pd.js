/** @format */

// Function to handle file click
function handleFileClick(event) {
	const fileElement = event.target;
	const fileExtension = fileElement
		.getAttribute("data-filename")
		.split(".")
		.pop()
		.toLowerCase();

	if (["jpg", "jpeg", "svg", "png"].includes(fileExtension)) {
		handleImageClick(event);
	} else if (["pdf"].includes(fileExtension)) {
		handlePDFClick(fileElement.getAttribute("data-filename"));
	} else if (["doc", "docx"].includes(fileExtension)) {
		handleDOCXClick(fileElement.getAttribute("data-filename"));
	}
}

// Function to display PDFs
function handlePDFClick(filename) {
	fetch(`/files/${filename}`)
		.then((response) => response.arrayBuffer())
		.then((data) => {
			const pdfContainer = document.getElementById("pdfContainer");
			pdfContainer.style.display = "block";

			const loadingTask = pdfjsLib.getDocument({ data });
			loadingTask.promise.then((pdf) => {
				pdf.getPage(1).then((page) => {
					const scale = 1.5;
					const viewport = page.getViewport({ scale });

					const canvas = document.createElement("canvas");
					const context = canvas.getContext("2d");
					canvas.height = viewport.height;
					canvas.width = viewport.width;

					const renderContext = {
						canvasContext: context,
						viewport: viewport,
					};
					page.render(renderContext);

					pdfContainer.innerHTML = "";
					pdfContainer.appendChild(canvas);
				});
			});
		});
}

// Function to display and edit DOCX files
function handleDOCXClick(filename) {
	fetch(`/files/${filename}`)
		.then((response) => response.arrayBuffer())
		.then((data) => {
			mammoth
				.convertToHtml({ arrayBuffer: data })
				.then((result) => {
					const docxContainer = document.getElementById("docxContainer");
					docxContainer.style.display = "block";
					docxContainer.innerHTML = result.value;
				})
				.catch((err) => console.error("DOCX conversion error:", err));
		});
}


