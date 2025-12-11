/**
 * Loads a local video file and explicitly handles playback logic for mobile browsers.
 * @param {HTMLInputElement} inputElement - The file input that triggered the change.
 * @param {string} videoId - The ID of the <video> element to play the file in (e.g., 'player1').
 */
function loadLocalVideo(inputElement, videoId) {
    const file = inputElement.files[0];

    if (file) {
        // Create a temporary URL for the local file in the browser's memory
        const videoURL = URL.createObjectURL(file);

        // Get the corresponding video element and the upload button/label
        const videoElement = document.getElementById(videoId);
        // Find the label using its CSS class or relationship to the input element
        const videoSlot = videoElement.parentElement;
        const uploadButton = videoSlot.querySelector('.upload-button');

        // 1. Set the video source
        videoElement.src = videoURL;
        videoElement.load();
        
        // 2. Hide the upload button now that a video is loaded
        if (uploadButton) {
            uploadButton.style.display = 'none';
        }

        // 3. Crucial: Attempt to play the video after a short delay
        // This attempts to start playback, which is often successful when triggered by the file input change.
        setTimeout(() => {
            videoElement.play()
                .then(() => {
                    console.log("Video started successfully!");
                    // Ensure it is unmuted if the user wants audio later
                    // You might want to add an un-mute button/indicator
                })
                .catch(error => {
                    console.warn("Autoplay was blocked by the browser. User must click the play button on the video control:", error);
                    // If autoplay fails, show the controls so the user can click play
                    videoElement.setAttribute('controls', 'true');
                });
        }, 100); // 100ms delay to ensure DOM update
    }
}