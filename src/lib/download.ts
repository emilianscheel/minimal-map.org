/**
 * Triggers a file download in the browser by creating a temporary anchor element.
 *
 * @param url      The URL of the file to download (e.g., a Blob URL or Data URI).
 * @param fileName The suggested name for the downloaded file.
 */
export function triggerFileDownload(url: string, fileName: string): void {
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	if (url.startsWith('blob:')) {
		URL.revokeObjectURL(url);
	}
}
