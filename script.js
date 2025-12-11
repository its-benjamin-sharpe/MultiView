// =========================================================
// GLOBAL SETUP
// =========================================================

const container = document.querySelector('.video-container');
const vDivider = document.getElementById('vertical-divider');
const hDivider = document.getElementById('horizontal-divider');
const syncButton = document.getElementById('sync-button');
const resetButton = document.getElementById('reset-button');
const muteAllButton = document.getElementById('mute-all-button');

const videoElements = [
    document.getElementById('player1'),
    document.getElementById('player2'),
    document.getElementById('player3'),
    document.getElementById('player4')
];
let isMuted = true;


// =========================================================
// 1. VIDEO LOADING AND PLAYBACK
// =========================================================

function loadLocalVideo(inputElement, videoId) {
    const file = inputElement.files[0];

    if (file) {
        const videoURL = URL.createObjectURL(file);
        const videoElement = document.getElementById(videoId);
        const uploadButton = videoElement.parentElement.querySelector('.upload-button');

        videoElement.src = videoURL;
        videoElement.load();
        
        // Hide the upload button overlay
        if (uploadButton) {
            uploadButton.style.opacity = '0';
            setTimeout(() => {
                uploadButton.style.display = 'none';
            }, 300); // Wait for fade transition
        }

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
// 2. RESIZING LOGIC (Updated to respect header/footer)
// =========================================================

let isDraggingV = false;
let isDraggingH = false;
const headerHeight = 65; // Matches CSS header height

// --- Mouse Drag Logic ---
vDivider.addEventListener('mousedown', (e) => { e.preventDefault(); isDraggingV = true; vDivider.classList.add('dragging'); });
hDivider.addEventListener('mousedown', (e) => { e.preventDefault(); isDraggingH = true; hDivider.classList.add('dragging'); });

document.addEventListener('mousemove', (e) => {
    if (isDraggingV) {
        let newWidthPercent = (e.clientX / window.innerWidth) * 100;
        newWidthPercent = Math.min(90, Math.max(10, newWidthPercent));
        
        vDivider.style.left = newWidthPercent + 'vw';
        container.style.gridTemplateColumns = `${newWidthPercent}fr ${100 - newWidthPercent}fr`;
    }

    if (isDraggingH) {
        // e.clientY is relative to the top of the viewport
        let newHeightPx = e.clientY - headerHeight;
        let containerHeight = container.offsetHeight;

        let newHeightPercent = (newHeightPx / containerHeight) * 100;
        newHeightPercent = Math.min(90, Math.max(10, newHeightPercent));

        // Position divider relative to the entire viewport height
        hDivider.style.top = (newHeightPx + headerHeight) + 'px';
        container.style.gridTemplateRows = `${newHeightPercent}fr ${100 - newHeightPercent}fr`;
    }
});

document.addEventListener('mouseup', () => {
    isDraggingV = false;
    isDraggingH = false;
    vDivider.classList.remove('dragging');
    hDivider.classList.remove('dragging');
});


// --- Touch Drag Logic (Added for Mobile) ---

function getTouchCoords(e) {
    // If it's a mouse event, use clientX/Y. If it's a touch event, use the first touch.
    return (e.touches && e.touches.length) ? e.touches[0] : e;
}

function handleTouchStart(e, dividerType) {
    e.preventDefault();
    if (dividerType === 'vertical') {
        isDraggingV = true;
        vDivider.classList.add('dragging');
    } else {
        isDraggingH = true;
        hDivider.classList.add('dragging');
    }
    // Simulate mousedown for compatibility
    document.dispatchEvent(new MouseEvent('mousedown', getTouchCoords(e)));
}

function handleTouchMove(e) {
    if (isDraggingV || isDraggingH) {
        e.preventDefault();
        // Simulate mousemove
        document.dispatchEvent(new MouseEvent('mousemove', getTouchCoords(e)));
    }
}

function handleTouchEnd() {
    // Simulate mouseup
    document.dispatchEvent(new MouseEvent('mouseup'));
    isDraggingV = false;
    isDraggingH = false;
    vDivider.classList.remove('dragging');
    hDivider.classList.remove('dragging');
}

// Attach touch listeners
vDivider.addEventListener('touchstart', (e) => handleTouchStart(e, 'vertical'), { passive: false });
hDivider.addEventListener('touchstart', (e) => handleTouchStart(e, 'horizontal'), { passive: false });
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd);


// =========================================================
// 3. CONTROL PANEL LOGIC (SYNC, RESET, MUTE)
// =========================================================

syncButton.addEventListener('click', () => {
    let isAnyPlaying = videoElements.some(v => !v.paused);
    let playableVideos = videoElements.filter(v => v.readyState >= 3 && v.src);

    if (playableVideos.length === 0) {
        alert("Please load at least one video file before syncing.");
        return;
    }

    if (isAnyPlaying) {
        // PAUSE All
        playableVideos.forEach(video => video.pause());
        syncButton.textContent = 'PLAY All Videos';
    } else {
        // Find the latest current time to sync to
        let referenceTime = 0;
        playableVideos.forEach(video => {
            referenceTime = Math.max(referenceTime, video.currentTime);
        });
        
        // SYNC and PLAY
        playableVideos.forEach(video => {
            video.currentTime = referenceTime; 
            video.play().catch(e => console.error("Play failed after sync:", e));
        });
        syncButton.textContent = 'PAUSE All Videos';
    }
});

resetButton.addEventListener('click', () => {
    // Resetting the grid columns and rows to the initial 1fr 1fr
    container.style.gridTemplateColumns = `1fr 1fr`;
    container.style.gridTemplateRows = `1fr 1fr`;

    // Resetting divider positions
    vDivider.style.left = '50vw';
    // The top position needs to be reset to the centered value relative to the screen size
    // It's easier to remove the inline style and let CSS handle the center via the transform
    hDivider.style.top = '50%';
});

muteAllButton.addEventListener('click', () => {
    isMuted = !isMuted;
    videoElements.forEach(video => {
        // Only toggle muted state if a video source is present
        if (video.src) {
             video.muted = isMuted;
        }
    });

    muteAllButton.textContent = isMuted ? 'Unmute All' : 'Mute All';
    muteAllButton.style.backgroundColor = isMuted ? '#34495e' : '#e74c3c'; // Red when unmuted, for caution
});
