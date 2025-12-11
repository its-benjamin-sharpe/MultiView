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
const headerHeight = 65; // Must match the CSS var(--header-height)


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
        
        // Hide the upload button overlay with a fade transition
        if (uploadButton) {
            uploadButton.style.opacity = '0';
            setTimeout(() => {
                uploadButton.style.display = 'none';
            }, 300); // Matches CSS transition time
        }

        // Attempt to play (required to be unmuted/muted based on current state)
        videoElement.muted = isMuted;
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
// 2. RESIZING LOGIC (Corrected for Container Bounds)
// =========================================================

let isDraggingV = false;
let isDraggingH = false;

// --- Mouse Drag Logic ---
vDivider.addEventListener('mousedown', (e) => { e.preventDefault(); isDraggingV = true; vDivider.classList.add('dragging'); });
hDivider.addEventListener('mousedown', (e) => { e.preventDefault(); isDraggingH = true; hDivider.classList.add('dragging'); });

document.addEventListener('mousemove', (e) => {
    if (isDraggingV) {
        // Vertical Divider (Column Resizing)
        let newWidthPercent = (e.clientX / window.innerWidth) * 100;
        newWidthPercent = Math.min(90, Math.max(10, newWidthPercent));
        
        vDivider.style.left = newWidthPercent + 'vw';
        container.style.gridTemplateColumns = `${newWidthPercent}fr ${100 - newWidthPercent}fr`;
    }

    if (isDraggingH) {
        // Horizontal Divider (Row Resizing) - Fixed logic
        const containerRect = container.getBoundingClientRect();
        
        // Calculate the position of the cursor relative to the container's top edge
        let newPosInContainer = e.clientY - containerRect.top;

        // Calculate the new height as a percentage of the container's total height
        let newHeightPercent = (newPosInContainer / containerRect.height) * 100;
        
        // Clamp the percentage between 10% and 90%
        newHeightPercent = Math.min(90, Math.max(10, newHeightPercent));

        // Update the horizontal divider's position relative to the document
        hDivider.style.top = containerRect.top + newPosInContainer + 'px';

        // Update the grid rows template
        container.style.gridTemplateRows = `${newHeightPercent}fr ${100 - newHeightPercent}fr`;
    }
});

document.addEventListener('mouseup', () => {
    isDraggingV = false;
    isDraggingH = false;
    vDivider.classList.remove('dragging');
    hDivider.classList.remove('dragging');
});


// =========================================================
// 3. TOUCH SUPPORT FOR RESIZING
// =========================================================

function getTouchCoords(e) {
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
    // Simulate mousedown for compatibility with existing mousemove logic
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
// 4. CONTROL PANEL LOGIC (SYNC, RESET, MUTE)
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
    // Resetting the vertical position to the center (50% of the container's height + header height)
    const containerHeight = container.offsetHeight;
    const verticalCenterPx = (containerHeight / 2) + headerHeight;
    hDivider.style.top = verticalCenterPx + 'px';
});

muteAllButton.addEventListener('click', () => {
    isMuted = !isMuted;
    videoElements.forEach(video => {
        if (video.src) {
             video.muted = isMuted;
        }
    });

    muteAllButton.textContent = isMuted ? 'Mute All' : 'Unmute All';
    muteAllButton.style.backgroundColor = isMuted ? '#34495e' : '#e74c3c';
});
