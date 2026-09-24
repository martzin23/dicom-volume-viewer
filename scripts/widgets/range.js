import Vector2D from "../math/vector2d.js";
import { mapRange } from "../utility/map_range.js";
import { addMoveListener } from "../utility/pointer.js";
import resizeNumber from "../utility/resize_number.js";

export function createRange(set = (value) => {}, get = () => new Vector2D(0.0, 0.0), name = "Range", min = 0, max = 1) {
    const default_value_min = resizeNumber(Math.max(Math.min(get().x, max), min));
    const default_value_max = resizeNumber(Math.max(Math.min(get().y, max), min));

    const element_text_min = document.createElement("input");
    element_text_min.setAttribute("type", "text");
    element_text_min.setAttribute("pattern", '-?([0-9]+)(.[0-9]+)?');
    element_text_min.setAttribute("required", "");
    element_text_min.setAttribute("value", default_value_min);

    const element_text_max = document.createElement("input");
    element_text_max.setAttribute("type", "text");
    element_text_max.setAttribute("pattern", '-?([0-9]+)(.[0-9]+)?');
    element_text_max.setAttribute("required", "");
    element_text_max.setAttribute("value", default_value_max);

    const element_range_handle_min = document.createElement("div");
    const element_range_handle_mid = document.createElement("div");
    const element_range_handle_max = document.createElement("div");

    const element_range_container = document.createElement("div");
    element_range_container.className = "range-container";
    element_range_container.appendChild(element_range_handle_min);
    element_range_container.appendChild(element_range_handle_mid);
    element_range_container.appendChild(element_range_handle_max);

    const ele2val = function(element) {
        const total = element_range_container.clientWidth;
        const offset = element.offsetLeft;
        const width = element.clientWidth;
        const value = mapRange(offset, 0.0, total - width, min, max);
        return value;
    }

    const val2ele = function(value, element) {
        const total = element_range_container.clientWidth;
        const width = element.clientWidth;
        const offset = mapRange(value, min, max, 0.0, total - width);
        element.offsetLeft = offset;
    }

    const off2ele = function(offset, element) {
        const total = element_range_container.clientWidth;
        const width = element.clientWidth;
        const current = element.offsetLeft;
        const result = Math.min(Math.max(current + offset, 0.0), total - width);
        console.log(`${result}px`, total, width, current, offset);
        element.style.left = `${result}px`;
    }

    element_text_min.addEventListener("focusout", function() {
        if (this.checkValidity()) {
            const value = resizeNumber(Math.min(Math.max(parseFloat(this.value), min), max));
            this.value = value;
            // element_range.value = val2fac(value) * resolution;
            set(parseFloat(value));
        } else {
            const value = resizeNumber(get());
            this.value = value;
            // element_range.value = val2fac(value) * resolution;
        }
    });
    // element_text_min.addEventListener("updategui", function() {
    //     if (this.matches(":focus")) return;
    //     const value = resizeNumber(get());
    //     this.value = value;
    //     // element_range.value = val2fac(value) * resolution;
    // });

    element_text_max.addEventListener("focusout", function() {
        if (this.checkValidity()) {
            const value = resizeNumber(Math.min(Math.max(parseFloat(this.value), min), max));
            this.value = value;
            // element_range.value = val2fac(value) * resolution;
            set(parseFloat(value));
        } else {
            const value = resizeNumber(get());
            this.value = value;
            // element_range.value = val2fac(value) * resolution;
        }
    });
    // element_text_max.addEventListener("updategui", function() {
    //     if (this.matches(":focus")) return;
    //     const value = resizeNumber(get());
    //     this.value = value;
    //     // element_range.value = val2fac(value) * resolution;
    // });

    element_range_handle_min.addEventListener("mousedown", (event) => {
        const move_handler = (event) => {
            console.log(event);
            off2ele(event.movementX * 0.6, element_range_handle_min);
        }

        // const remove_listener = addMoveListener(element_range_handle_min, move_handler);
        element_range_handle_min.addEventListener("mousemove", move_handler);

        ["mouseup", "mouseleave"].forEach(type => {
            element_range_handle_min.addEventListener(type, (event) => {
                // remove_listener();
                element_range_handle_min.removeEventListener("mousemove", move_handler)
            })
        });
    });

    const element_name = document.createElement("p");
    element_name.innerText = name;

    const element_base = document.createElement("div");
    element_base.className = "range row gap-medium align-center";
    element_base.appendChild(element_text_min);
    element_base.appendChild(element_range_container);
    element_base.appendChild(element_text_max);
    element_base.appendChild(element_name);
    
    return element_base;
}