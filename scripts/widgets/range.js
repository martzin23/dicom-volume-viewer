import Vector2D from "../math/vector2d.js";
import { mapRange } from "../utility/map_range.js";
import { addMoveListener } from "../utility/pointer.js";
import resizeNumber from "../utility/resize_number.js";

export function createRange(
	set = (value) => { },
	get = () => new Vector2D(0.0, 0.0),
	name = "Range",
	min = 0,
	max = 1,
) {
	const default_value_min = resizeNumber(Math.max(Math.min(get().x, max), min));
	const default_value_max = resizeNumber(Math.max(Math.min(get().y, max), min));

	const MIN_GAP = 1;
	const RESOLUTION = 100;

	const element_text_min = document.createElement("input");
	element_text_min.setAttribute("type", "text");
	element_text_min.setAttribute("pattern", "-?([0-9]+)(.[0-9]+)?");
	element_text_min.setAttribute("required", "");
	element_text_min.setAttribute("value", default_value_min);

	const element_text_max = document.createElement("input");
	element_text_max.setAttribute("type", "text");
	element_text_max.setAttribute("pattern", "-?([0-9]+)(.[0-9]+)?");
	element_text_max.setAttribute("required", "");
	element_text_max.setAttribute("value", default_value_max);

	const element_min = document.createElement("input");
	element_min.setAttribute("type", "range");
	element_min.setAttribute("min", "0");
	element_min.setAttribute("max", RESOLUTION);
	element_min.setAttribute("step", "1");
	element_min.setAttribute("value", mapRange(default_value_min, min, max, 0.0, RESOLUTION));

	const element_mid = document.createElement("div");

	const element_max = document.createElement("input");
	element_max.setAttribute("type", "range");
	element_max.setAttribute("min", "0");
	element_max.setAttribute("max", RESOLUTION);
	element_max.setAttribute("step", "1");
	element_max.setAttribute("value", mapRange(default_value_max, min, max, 0.0, RESOLUTION));

	const element_range_container = document.createElement("div");
	element_range_container.className = "range-container";
	element_range_container.appendChild(element_min);
	element_range_container.appendChild(element_mid);
	element_range_container.appendChild(element_max);

	const element_name = document.createElement("p");
	element_name.innerText = name;

	const element_base = document.createElement("div");
	element_base.className = "range row gap-small align-center";
	element_base.appendChild(element_text_min);
	element_base.appendChild(element_range_container);
	element_base.appendChild(element_text_max);
	element_base.appendChild(element_name);

	// element_text_min.addEventListener("focusout", function () {
	// 	if (this.checkValidity()) {
	// 		const value = resizeNumber(
	// 			Math.min(Math.max(parseFloat(this.value), min), max),
	// 		);
	// 		this.value = value;
	// 		// element_range.value = val2fac(value) * resolution;
	// 		set(parseFloat(value));
	// 	} else {
	// 		const value = resizeNumber(get());
	// 		this.value = value;
	// 		// element_range.value = val2fac(value) * resolution;
	// 	}
	// });

	// element_text_min.addEventListener("updategui", function() {
	//     if (this.matches(":focus")) return;
	//     const value = resizeNumber(get());
	//     this.value = value;
	//     // element_range.value = val2fac(value) * resolution;
	// });

	// element_text_max.addEventListener("focusout", function () {
	// 	if (this.checkValidity()) {
	// 		const value = resizeNumber(
	// 			Math.min(Math.max(parseFloat(this.value), min), max),
	// 		);
	// 		this.value = value;
	// 		// element_range.value = val2fac(value) * resolution;
	// 		set(parseFloat(value));
	// 	} else {
	// 		const value = resizeNumber(get());
	// 		this.value = value;
	// 		// element_range.value = val2fac(value) * resolution;
	// 	}
	// });

	// element_text_max.addEventListener("updategui", function() {
	//     if (this.matches(":focus")) return;
	//     const value = resizeNumber(get());
	//     this.value = value;
	//     // element_range.value = val2fac(value) * resolution;
	// });

	function update() {
		let minVal = parseInt(element_min.value, 10);
		let maxVal = parseInt(element_max.value, 10);

		if (minVal > maxVal - MIN_GAP) {
			minVal = maxVal - MIN_GAP;
			element_min.value = minVal;
		}

		element_mid.style.left = mapRange(minVal, 0, RESOLUTION, 0, 100) + "%";
		element_mid.style.width = (mapRange(maxVal, 0, RESOLUTION, 0, 100) - mapRange(minVal, 0, RESOLUTION, 0, 100)) + "%";

		element_text_min.value = mapRange(minVal, 0, RESOLUTION, min, max);
		element_text_max.value = mapRange(maxVal, 0, RESOLUTION, min, max);

		element_text_min.style.zIndex = minVal > max - 10 ? 5 : 3;

		set(new Vector2D(mapRange(minVal, 0, RESOLUTION, min, max), mapRange(maxVal, 0, RESOLUTION, min, max)))
	}

	function clampMax() {
		let minVal = parseInt(element_min.value, 10);
		let maxVal = parseInt(element_max.value, 10);
		if (maxVal < minVal + MIN_GAP) {
			element_max.value = minVal + MIN_GAP;
		}
		update();
	}

	element_min.addEventListener("input", update);
	element_max.addEventListener("input", clampMax);
	// element_mid.addEventListener("mousedown", (event) => {
	// 	console.log("triggered");
	// 	function slide(event) {
	// 		const offset = event.movementX;
	// 		console.log("slide", offset);
	// 		element_min.value += offset;
	// 		element_max.value += offset;
	// 		update();			
	// 	}

	// 	element_min.addEventListener("mousemove", slide);
	// 	function cancel(event) {
	// 		element_mid.removeEventListener("mousemove", slide)
	// 	}

	// 	element_mid.addEventListener("mouseleave", cancel);
	// 	element_mid.addEventListener("mouseup", cancel);
	// });


	// --- Drag the whole range by dragging the fill bar ---
	const slider = element_range_container;
	let dragging = false;
	let dragStartX = 0;
	let dragStartMin = 0;
	let dragStartMax = 0;

	function valuePerPixel() {
		const min = parseInt(element_min.min, 10);
		const max = parseInt(element_min.max, 10);
		const width = slider.getBoundingClientRect().width;
		return (max - min) / width;
	}

	function onDragStart(clientX) {
		dragging = true;
		dragStartX = clientX;
		dragStartMin = parseInt(element_min.value, 10);
		dragStartMax = parseInt(element_max.value, 10);
		document.body.style.userSelect = 'none';
	}

	function onDragMove(clientX) {
		if (!dragging) return;

		const min = parseInt(element_min.min, 10);
		const max = parseInt(element_min.max, 10);
		const span = dragStartMax - dragStartMin;

		const deltaValue = (clientX - dragStartX) * valuePerPixel();
		let newMin = Math.round(dragStartMin + deltaValue);
		let newMax = newMin + span;

		// Clamp so the whole range stays within [min, max]
		if (newMin < min) {
			newMin = min;
			newMax = min + span;
		}
		if (newMax > max) {
			newMax = max;
			newMin = max - span;
		}

		element_min.value = newMin;
		element_max.value = newMax;
		update();
	}

	function onDragEnd() {
		dragging = false;
		document.body.style.userSelect = '';
	}

	// --- Middle-mouse-button drag on either handle moves the whole range ---
	function handleMiddleMouseDown(e) {
		if (e.button !== 2) return; // only the middle mouse button
		onDragStart(e.clientX);
		e.preventDefault();
	}

	element_min.addEventListener('mousedown', handleMiddleMouseDown);
	element_max.addEventListener('mousedown', handleMiddleMouseDown);
	// Some browsers fire 'auxclick' for the middle button on release; prevent its default (e.g. autoscroll icon / paste-from-selection on Linux).
	element_min.addEventListener('auxclick', (e) => e.preventDefault());
	element_max.addEventListener('auxclick', (e) => e.preventDefault());

	// element_min.addEventListener('contextmenu', (e) => e.preventDefault());
	// element_max.addEventListener('contextmenu', (e) => e.preventDefault());
	window.addEventListener('contextmenu', (e) => e.preventDefault());

	window.addEventListener('mousemove', (e) => onDragMove(e.clientX));
	window.addEventListener('mouseup', onDragEnd);

	update();

	return element_base;
}