// =========================================================
// GLOBAL SETUP
// =========================================================

const container = document.querySelector('.video-container');
const vDivider = document.getElementById('vertical-divider');
const hDivider = document.getElementById('horizontal-divider');
const syncButton = document.getElementById('sync-button');
const resetButton = document.getElementById('reset-button');
const muteAllButton = document.getElementById('mute-all-button');
const layoutSelector = document.getElementById('layout-selector');
const applyLayoutButton = document.getElementById('apply-layout');

const allSlotElements = Array.from({length: 8}, (_, i) => document.getElementById(`slot-${i + 1}`));
const videoElements = Array.from({length: 8}, (_, i) => document.getElementById(`player${i + 1}`));

let isMuted = true;
const headerHeight = 60; // Must match CSS var(--header-height)
const topControlsHeight = 40; // Must match CSS var(--top-controls-height)


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
        
        if (uploadButton) {
            uploadButton.style.opacity = '0';
            setTimeout(() => {
                uploadButton.style.display = 'none';
            }, 300);
        }

        videoElement.muted = isMuted;
        videoElement.play().catch(error => {
            console.warn("Autoplay blocked. User must click the play button:", error);
            videoElement.setAttribute('controls', 'true');
        });
    }
}


// =========================================================
// 2. DYNAMIC LAYOUT & TEMPLATE LOGIC (New)
// =========================================================

const LAYOUT_DEFINITIONS = {
    1: { rows: 1, cols: 1, resizable: false },
    2: { rows: 1, cols: 2, resizable: true, vertical: true, horizontal: false },
    3: { rows: 2, cols: 2, resizable: true, vertical: true, horizontal: true, span: [1] }, // 1st slot spans 2 columns
    4: { rows: 2, cols: 2, resizable: true, vertical: true, horizontal: true },
    5: { rows: 2, cols: 3, resizable: true, vertical: true, horizontal: true, span: [1, 2] }, // 1st & 2nd slots span 3 columns
    6: { rows: 2, cols: 3, resizable: true, vertical: true, horizontal: true },
    7: { rows: 2, cols: 4, resizable: true, vertical: true, horizontal: true, span: [1] }, // Top row has 4 videos, bottom has 3. Need complex spanning for optimal layout. Simplified to 4x2 grid with 7 active slots.
    8: { rows: 2, cols: 4, resizable: true, vertical: true, horizontal: true }
};

function applyLayout() {
    const layoutId = layoutSelector.value;
    const def = LAYOUT_DEFINITIONS[layoutId];
    const numSlots = parseInt(layoutId);

    // 1. Reset and Apply Grid Template
    container.className = 'video-container';
    container.classList.add(`layout-${layoutId}`);
    
    // Set explicit grid structure for complex layouts (e.g., 3 and 5)
    if (layoutId == 3) {
        container.style.gridTemplateColumns = '1fr 1fr'; // 2 columns
        container.style.gridTemplateRows = '1fr 1fr'; // 2 rows
        allSlotElements[0].style.gridColumn = 'span 2'; // Slot 1 spans both columns
        allSlotElements[0].style.gridRow = 'span 1';
    } else if (layoutId == 5) {
        container.style.gridTemplateColumns = '1fr 1fr 1fr'; // 3 columns
        container.style.gridTemplateRows = '1fr 1fr'; // 2 rows
        allSlotElements[0].style.gridColumn = 'span 3'; // Slot 1 spans all 3 columns
        allSlotElements[0].style.gridRow = 'span 1';
        // Need to shift the remaining slots visually, but keep slots 2-5
        // We will activate slots 1, 2, 3, 4, 5
    } else {
        // Clear any specific spanning
        allSlotElements.forEach(slot => {
            slot.style.gridColumn = '';
            slot.style.gridRow = '';
        });
    }

    // 2. Control Slot Visibility
    allSlotElements.forEach((slot, index) => {
        // Show only the slots needed for this layout
        if (index < numSlots) {
            slot.classList.remove('hidden');
        } else {
            slot.classList.add('hidden');
        }
    });

    // 3. Control Divider Visibility (Only for layouts that support 2 dimensions)
    vDivider.classList.toggle('hidden', !(def.resizable && def.vertical));
    hDivider.classList.toggle('hidden', !(def.resizable && def.horizontal));
    
    // 4. Set initial 50/50 split for a clean start
    resetSplit();
}

applyLayoutButton.addEventListener('click', applyLayout);
// Apply default 4-video layout on load
document.addEventListener('DOMContentLoaded', applyLayout);


// =========================================================
// 3. RESIZING LOGIC (Corrected for Container Bounds)
// =========================================================

let isDraggingV = false;
let isDraggingH = false;

// --- Mouse Drag Logic ---
vDivider.addEventListener('mousedown', (e) => { e.preventDefault(); isDraggingV = true; vDivider.classList.add('dragging'); });
hDivider.addEventListener('mousedown', (e) => { e.preventDefault(); isDraggingH = true; hDivider.classList.add('dragging'); });

document.addEventListener('mousemove', (e) => {
    if (isDraggingV) {
        const containerRect = container.getBoundingClientRect();
        let newPosInContainer = e.clientX - containerRect.left;
        let newWidthPercent = (newPosInContainer / containerRect.width) * 100;
        
        newWidthPercent = Math.min(90, Math.max(10, newWidthPercent));
        
        vDivider.style.left = newWidthPercent + '%';
        // Note: The grid template columns definition in CSS must be generic (e.g., 1fr 1fr) for this to work
        container.style.gridTemplateColumns = `${newWidthPercent}fr ${100 - newWidthPercent}fr`;
    }

    if (isDraggingH) {
        const containerRect = container.getBoundingClientRect();
        let newPosInContainer = e.clientY - containerRect.top;
        let newHeightPercent = (newPosInContainer / containerRect.height) * 100;
        
        newHeightPercent = Math.min(90, Math.max(10, newHeightPercent));

        // Update divider position relative to container
        hDivider.style.top = newHeightPercent + '%';

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
// 4. TOUCH SUPPORT FOR RESIZING
// =========================================================

function getTouchCoords(e) {
    return (e.touches && e.touches.length) ? e.touches[0] : e;
}

function handleTouchStart(e, dividerType) {
    // Only allow drag if divider is visible
    if(vDivider.classList.contains('hidden') && dividerType === 'vertical') return;
    if(hDivider.classList.contains('hidden') && dividerType === 'horizontal') return;

    e.preventDefault();
    if (dividerType === 'vertical') {
        isDraggingV = true;
        vDivider.classList.add('dragging');
    } else {
        isDraggingH = true;
        hDivider.classList.add('dragging');
    }
    document.dispatchEvent(new MouseEvent('mousedown', getTouchCoords(e)));
}

function handleTouchMove(e) {
    if (isDraggingV || isDraggingH) {
        e.preventDefault();
        document.dispatchEvent(new MouseEvent('mousemove', getTouchCoords(e)));
    }
}

function handleTouchEnd() {
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
// 5. CONTROL PANEL LOGIC (SYNC, RESET, MUTE)
// =========================================================

function resetSplit() {
    // Resetting the grid columns and rows to the initial 1fr 1fr for the *current* layout
    container.style.gridTemplateColumns = `repeat(${LAYOUT_DEFINITIONS[layoutSelector.value].cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${LAYOUT_DEFINITIONS[layoutSelector.value].rows}, 1fr)`;

    // Resetting divider positions to 50%
    vDivider.style.left = '50%';
    hDivider.style.top = '50%';
}

resetButton.addEventListener('click', resetSplit);

syncButton.addEventListener('click', () => {
    let isAnyPlaying = videoElements.some(v => !v.paused);
    let playableVideos = videoElements.filter(v => v.readyState >= 3 && v.src && !v.parentElement.classList.contains('hidden'));

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
