
export function addDoubleTapListener(element, callback) {
    let lastTapTime = 0;
    let tapTimeout = null;
    const DOUBLE_TAP_DELAY = 300;

    function handleTouchEnd(event) {
        const currentTime = Date.now();
        const timeSinceLastTap = currentTime - lastTapTime;

        if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
            clearTimeout(tapTimeout);
            lastTapTime = 0;
            callback(event.clientX, event.clientY);
            event.preventDefault();
        } else {
            lastTapTime = currentTime;
            clearTimeout(tapTimeout);
            tapTimeout = setTimeout(() => {
            lastTapTime = 0;
            }, DOUBLE_TAP_DELAY);
        }
    }

    element.addEventListener('pointerup', handleTouchEnd);

    return function removeDoubleTapListener() {
        element.removeEventListener('pointerup', handleTouchEnd);
        clearTimeout(tapTimeout);
    };
}

export function addTouchListener(element, callback) {
    let last_pos_x = 0;
    let last_pos_y = 0;
    let last_distance = 0;
    let last_center_x = 0;
    let last_center_y = 0;

    function getTouchDistance(t1, t2) {
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getTouchCenter(t1, t2) {
        return {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2
        };
    }

    function handleTouchStart(event) {
        event.preventDefault();
        const touches = event.touches;

        if (touches.length === 1) {
            last_pos_x = touches[0].clientX;
            last_pos_y = touches[0].clientY;
        } else if (touches.length === 2) {
            const touch1 = touches[0];
            const touch2 = touches[1];

            last_distance = getTouchDistance(touch1, touch2);

            const center = getTouchCenter(touch1, touch2);
            last_center_x = center.x;
            last_center_y = center.y;
        }
    }

    function handleTouchMove(event) {
        event.preventDefault();
        const touches = event.touches;

        let delta_x = 0;
        let delta_y = 0;
        let delta_zoom = 0;
        let pan_x = 0;
        let pan_y = 0;

        if (touches.length === 1) {
            const currentX = touches[0].clientX;
            const currentY = touches[0].clientY;

            delta_x = currentX - last_pos_x;
            delta_y = currentY - last_pos_y;

            last_pos_x = currentX;
            last_pos_y = currentY;
        } else if (touches.length === 2) {
            const touch1 = touches[0];
            const touch2 = touches[1];

            const current_distance = getTouchDistance(touch1, touch2);
            const current_center = getTouchCenter(touch1, touch2);

            delta_zoom = current_distance - last_distance;
            last_distance = current_distance;

            pan_x = current_center.x - last_center_x;
            pan_y = current_center.y - last_center_y;
            last_center_x = current_center.x;
            last_center_y = current_center.y;
        }

        if (delta_x !== 0 || delta_y !== 0 || delta_zoom !== 0 || pan_x !== 0 || pan_y !== 0) {
            callback({
                drag_x: delta_x,
                drag_y: delta_y,
                zoom: delta_zoom,
                pan_x: pan_x,
                pan_y: pan_y
            });
        }
    }

    function handleTouchEnd(event) {
        if (event.touches.length === 1) {
            last_pos_x = event.touches[0].clientX;
            last_pos_y = event.touches[0].clientY;
        }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return function removeTouchListener() {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchcancel', handleTouchEnd);
    };
}