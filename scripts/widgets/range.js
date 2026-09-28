import Vector from "../math/vector.js";
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
	labels = undefined,
) {
	const default_value_min = resizeNumber(Math.max(Math.min(get().x, max), min));
	const default_value_max = resizeNumber(Math.max(Math.min(get().y, max), min));

	const RESOLUTION = 100;

	const element_range = document.createElement("div");
	element_range.className = "range row gap-medium align-center justify-start";

	const element_slider = document.createElement("wa-slider");
	element_slider.style.width = "100%";
	element_slider.setAttribute("min", 0);
	element_slider.setAttribute("max", RESOLUTION);
	element_slider.setAttribute("min-value", mapRange(default_value_min, min, max, 0, RESOLUTION));
	element_slider.setAttribute("max-value", mapRange(default_value_max, min, max, 0, RESOLUTION));
	element_slider.setAttribute("range", true);
	element_slider.oninput = (event) => {
		set(new Vector2D(
			mapRange(event.target.minValue, 0, RESOLUTION, min, max), 
			mapRange(event.target.maxValue, 0, RESOLUTION, min, max)
		))};
	element_range.appendChild(element_slider);
		
	element_range.addEventListener("updategui", function() {
		const value = get();
		element_range.minValue = mapRange(value.x, min, max, 0, RESOLUTION);
		element_range.maxValue = mapRange(value.y, min, max, 0, RESOLUTION);
	});

	if (!!labels) {
		for (const label of labels) {
			const span = document.createElement("span");
			span.setAttribute("slot", "reference");
			span.innerText = label;
			element_slider.appendChild(span);
		} 
	}

	const element_drag = document.createElement("button");
	element_drag.innerHTML = '<i class="fa fa-arrows-h"></i>';
	element_drag.addEventListener("mousedown", function(event) {
		if (event.button != 0) return;
		const mousemove_listener = (event) => {
			const new_min = element_slider.minValue + event.movementX;
			const new_max = element_slider.maxValue + event.movementX
			if (new_min < 0 || new_max > RESOLUTION) return;
			element_slider.minValue = new_min;
			element_slider.maxValue = new_max;
			set(new Vector2D(
				mapRange(new_min, 0, RESOLUTION, min, max), 
				mapRange(new_max, 0, RESOLUTION, min, max)
			));
		}
		const mouseup_listener = () => {
			document.removeEventListener("mousemove", mousemove_listener);
			document.removeEventListener("mouseup", mouseup_listener);
		}
		document.addEventListener("mouseup", mouseup_listener);
		document.addEventListener("mousemove", mousemove_listener);
	});
	element_range.appendChild(element_drag);

	const element_name = document.createElement("p");
	element_name.innerText = name;
	element_range.appendChild(element_name);

	return element_range;
}