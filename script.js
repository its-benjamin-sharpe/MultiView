// =========================================================
// 1. VIDEO LOADING AND PLAYBACK LOGIC (Updated)
// =========================================================

function loadLocalVideo(inputElement, videoId) {
    const file = inputElement.files[0];

    if (file) {
        const videoURL = URL.createObjectURL(file);
        const videoElement = document.getElementById(videoId);
        const videoSlot = videoElement.parentElement;
        const uploadButton = videoSlot.querySelector('.upload-button');

        // 1. Set the video source
        videoElement.src = videoURL;
        videoElement.load();
        
        // 2. Hide the upload button
        if (uploadButton) {
            uploadButton.style.display = 'none';
        }

        // 3. Attempt to play (muted autoplay is required for mobile browsers)
        videoElement.play()
            .then(() => {
                console.log(`Video ${videoId} started successfully!`);
            })
            .catch(error => {
                console.warn("Autoplay blocked. User must click the play button:", error);
                // Ensure controls are visible for user interaction
                videoElement.setAttribute('controls', 'true');
            });
    }
}


// =========================================================
// 2. RESIZING LOGIC (New)
// =========================================================

const container = document.querySelector('.video-container');
const vDivider = document.getElementById('vertical-divider');
const hDivider = document.getElementById('horizontal-divider');

let isDraggingV = false;
let isDraggingH = false;

// --- Vertical Divider Logic (Column Resizing) ---
vDivider.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDraggingV = true;
});

// --- Horizontal Divider Logic (Row Resizing) ---
hDivider.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDraggingH = true;
});

// Global Mouse Move Listener (handles both vertical and horizontal dragging)
document.addEventListener('mousemove', (e) => {
    if (isDraggingV) {
        // Calculate percentage width for the first column
        let newWidthPercent = (e.clientX / window.innerWidth) * 100;
        
        // Clamp the value between 10% and 90%
        newWidthPercent = Math.min(90, Math.max(10, newWidthPercent));

        // Update the vertical divider position
        vDivider.style.left = newWidthPercent + 'vw';

        // Update the grid columns template
        container.style.gridTemplateColumns = `${newWidthPercent}fr ${100 - newWidthPercent}fr`;
    }

    if (isDraggingH) {
        // Calculate percentage height for the first row
        let newHeightPercent = (e.clientY / window.innerHeight) * 100;
        
        // Clamp the value between 10% and 90%
        newHeightPercent = Math.min(90, Math.max(10, newHeightPercent));

        // Update the horizontal divider position
        hDivider.style.top = newHeightPercent + 'vh';

        // Update the grid rows template
        container.style.gridTemplateRows = `${newHeightPercent}fr ${100 - newHeightPercent}fr`;
    }
});

// Stop dragging when mouse or touch button is released
document.addEventListener('mouseup', () => {
    isDraggingV = false;
    isDraggingH = false;
});


// =========================================================
// 3. SYNCHRONIZATION LOGIC (New)
// =========================================================

const syncButton = document.getElementById('sync-button');
const videoElements = [
    document.getElementById('player1'),
    document.getElementById('player2'),
    document.getElementById('player3'),
    document.getElementById('player4')
];

syncButton.addEventListener('click', () => {
    let isAnyPlaying = videoElements.some(v => !v.paused);
    let playableVideos = videoElements.filter(v => v.readyState >= 3); // Check for READY_STATE_ENOUGH_DATA

    if (playableVideos.length === 0) {
        alert("Please upload and load at least one video first.");
        return;
    }

    if (isAnyPlaying) {
        // PAUSE All
        playableVideos.forEach(video => video.pause());
        syncButton.textContent = 'PLAY All Videos';
    } else {
        // Find the latest current time among all loaded videos to sync to
        let referenceTime = 0;
        playableVideos.forEach(video => {
            referenceTime = Math.max(referenceTime, video.currentTime);
        });
        
        // SYNC and PLAY
        playableVideos.forEach(video => {
            // Set all to the same time
            video.currentTime = referenceTime; 
            // Attempt to play
            video.play().catch(e => console.error("Play failed after sync:", e));
        });
        syncButton.textContent = 'PAUSE All Videos';
    }
});

