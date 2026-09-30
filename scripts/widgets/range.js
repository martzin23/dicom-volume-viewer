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
	inputs = true
) {
	const default_value_min = resizeNumber(Math.max(Math.min(get().x, max), min));
	const default_value_max = resizeNumber(Math.max(Math.min(get().y, max), min));

	const RESOLUTION = 100;

	const element_range = document.createElement("div");
	element_range.className = "range row gap-small align-center justify-start";

    let element_text_min;
    let element_text_max;
    if (inputs) {
        element_text_min = document.createElement("input");
        element_text_min.setAttribute("type", "text");
        element_text_min.setAttribute("pattern", '-?([0-9]+)(.[0-9]+)?');
        element_text_min.setAttribute("required", "");
        element_text_min.setAttribute("value", default_value_min);
		
        element_text_max = document.createElement("input");
        element_text_max.setAttribute("type", "text");
        element_text_max.setAttribute("pattern", '-?([0-9]+)(.[0-9]+)?');
        element_text_max.setAttribute("required", "");
        element_text_max.setAttribute("value", default_value_max);
    }

	const element_slider = document.createElement("wa-slider");
	element_slider.setAttribute("min", 0);
	element_slider.setAttribute("max", RESOLUTION);
	element_slider.setAttribute("min-value", mapRange(default_value_min, min, max, 0, RESOLUTION));
	element_slider.setAttribute("max-value", mapRange(default_value_max, min, max, 0, RESOLUTION));
	element_slider.setAttribute("range", true);
	element_slider.oninput = (event) => {
		const value = new Vector2D(
			mapRange(event.target.minValue, 0, RESOLUTION, min, max), 
			mapRange(event.target.maxValue, 0, RESOLUTION, min, max)
		)
		if (inputs) {
			if (!element_text_min.matches(":focus")) element_text_min.value = value.x;
			if (!element_text_max.matches(":focus")) element_text_max.value = value.y;
		}
		set(value)
	};
	if (inputs) element_range.appendChild(element_text_min);
	element_range.appendChild(element_slider);
	if (inputs) element_range.appendChild(element_text_max);
		
	element_range.addEventListener("updategui", function() {
		const value = get();
		element_range.minValue = mapRange(value.x, min, max, 0, RESOLUTION);
		element_range.maxValue = mapRange(value.y, min, max, 0, RESOLUTION);
		if (inputs) {
			if (!element_text_min.matches(":focus")) element_text_min.value = value.x;
			if (!element_text_max.matches(":focus")) element_text_max.value = value.y;
		}
	});

	const element_drag = document.createElement("button");
	element_drag.innerHTML = '<i class="fa fa-arrows-h"></i>';
	element_drag.addEventListener("pointerdown", function(event) {
		if (event.button != 0) return;
		const mousemove_listener = (event) => {
			const new_min = element_slider.minValue + event.movementX;
			const new_max = element_slider.maxValue + event.movementX
			if (new_min < 0 || new_max > RESOLUTION) return;
			element_slider.minValue = new_min;
			element_slider.maxValue = new_max;
			const new_value = new Vector2D(mapRange(new_min, 0, RESOLUTION, min, max), mapRange(new_max, 0, RESOLUTION, min, max))
			if (inputs) {
				element_text_min.value = new_value.x;
				element_text_max.value = new_value.y;
			}
			set(new_value);
		}
		const mouseup_listener = () => {
			document.removeEventListener("pointermove", mousemove_listener);
			document.removeEventListener("pointerup", mouseup_listener);
		}
		document.addEventListener("pointerup", mouseup_listener);
		document.addEventListener("pointermove", mousemove_listener);
	});
	element_range.appendChild(element_drag);

	if (inputs) {
		element_text_min.addEventListener("focusout", function() {
			if (this.checkValidity()) {
				const value = Math.min(Math.max(parseFloat(this.value), min), mapRange(element_slider.maxValue, 0, RESOLUTION, min, max));
				this.value = resizeNumber(value);
				element_slider.minValue = mapRange(value, min, max, 0, RESOLUTION);
				set(new Vector2D(value, mapRange(element_slider.maxValue, 0, RESOLUTION, min, max)));
			} else {
				this.value = resizeNumber(get().x);
			}
		});
		element_text_max.addEventListener("focusout", function() {
			if (this.checkValidity()) {
				const value = Math.min(Math.max(parseFloat(this.value), mapRange(element_slider.minValue, 0, RESOLUTION, min, max)), max);
				this.value = resizeNumber(value);
				element_slider.maxValue =  mapRange(value, min, max, 0, RESOLUTION);
				set(new Vector2D(mapRange(element_slider.minValue, 0, RESOLUTION, min, max), value));
			} else {
				this.value = resizeNumber(get().y);
			}
		});
	}

	const element_name = document.createElement("p");
	element_name.innerText = name;
	element_range.appendChild(element_name);

	return element_range;
}