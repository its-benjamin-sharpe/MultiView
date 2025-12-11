// =========================================================
// 4. TOUCH SUPPORT FOR RESIZING (New)
// =========================================================

// Convert touch events to mouse events for compatibility with existing logic
function handleTouchStart(e, dividerType) {
    if (e.touches.length === 1) {
        e.preventDefault();
        if (dividerType === 'vertical') {
            isDraggingV = true;
        } else {
            isDraggingH = true;
        }
        // Simulate a mousedown event with touch data
        document.dispatchEvent(new MouseEvent('mousedown', {
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY,
            bubbles: true,
            cancelable: true
        }));
    }
}

function handleTouchMove(e) {
    if (isDraggingV || isDraggingH) {
        e.preventDefault();
        // Simulate a mousemove event with touch data
        document.dispatchEvent(new MouseEvent('mousemove', {
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY,
            bubbles: true,
            cancelable: true
        }));
    }
}

function handleTouchEnd() {
    if (isDraggingV || isDraggingH) {
        // Simulate a mouseup event
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        isDraggingV = false;
        isDraggingH = false;
    }
}

// Attach listeners to the dividers
vDivider.addEventListener('touchstart', (e) => handleTouchStart(e, 'vertical'), { passive: false });
hDivider.addEventListener('touchstart', (e) => handleTouchStart(e, 'horizontal'), { passive: false });

// Attach global touch move/end listeners
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd);
