import { mapRange } from "../utility/map_range.js";
import resizeNumber from "../utility/resize_number.js";

export function createSlider(set = (value) => {}, get = () => 0.0, name = "Slider", min = 0, max = 1, inputs = true) {
    const default_value = Math.max(Math.min(get(), max), min);
    const RESOLUTION = 1000;

    let element_text;
    if (inputs) {
        element_text = document.createElement("input");
        element_text.setAttribute("type", "text");
        element_text.setAttribute("pattern", '-?([0-9]+)(.[0-9]+)?');
        element_text.setAttribute("required", "");
        element_text.setAttribute("value", resizeNumber(default_value));
    }

    const element_slider = document.createElement("wa-slider");
    element_slider.setAttribute("min", "0");
    element_slider.setAttribute("max", RESOLUTION);
    element_slider.setAttribute("value", mapRange(default_value, min, max, 0, RESOLUTION));
    element_slider.addEventListener("input", function() {
        const value = mapRange(this.value, 0, RESOLUTION, min, max);
        if (inputs) element_text.value = resizeNumber(value);
        set(value);
    });

    if (inputs) {
        element_text.addEventListener("focusout", function() {
            if (this.checkValidity()) {
                const value = Math.min(Math.max(parseFloat(this.value), min), max);
                this.value = resizeNumber(value);
                element_slider.value = mapRange(value, min, max, 0, RESOLUTION);
                set(value);
            } else {
                this.value = resizeNumber(get());
            }
        });
        
        element_text.addEventListener("updategui", function() {
            if (this.matches(":focus")) return;
            const value = get();
            this.value = resizeNumber(value);
            element_slider.value = mapRange(value, min, max, 0, RESOLUTION);
        });
    }

    const element_name = document.createElement("p");
    element_name.innerText = name;

    const element_base = document.createElement("div");
    element_base.className = "slider";
    if (inputs) element_base.appendChild(element_text);
    element_base.appendChild(element_slider);
    element_base.appendChild(element_name);
    
    return element_base;
}