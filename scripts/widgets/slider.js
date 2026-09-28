import resizeNumber from "../utility/resize_number.js";

export function createSlider(set = (value) => {}, get = () => 0.0, name = "Slider", min = 0, max = 1, labels, log = false, input = true) {
    if (log) min = Math.max(min, 0.000001);
    const default_value = resizeNumber(Math.max(Math.min(get(), max), min));
    const RESOLUTION = (labels?.length > 2) ? labels.length - 1 : 1000.0;

    const fac2val = function(fac) {
        if (!log)
            return min + fac * (max - min);
        else
            return min * Math.pow(max / min, fac);
    }

    const val2fac = function(val) {
        if (!log)
            return (val - min) / (max - min);
        else
            return (Math.log(val) - Math.log(min)) / (Math.log(max) - Math.log(min));
    }

    let element_text;
    if (!!input) {
        element_text = document.createElement("input");
        element_text.setAttribute("type", "text");
        element_text.setAttribute("pattern", '-?([0-9]+)(.[0-9]+)?');
        element_text.setAttribute("required", "");
        element_text.setAttribute("value", default_value);
    }

    const element_slider = document.createElement("wa-slider");
    element_slider.setAttribute("min", "0");
    element_slider.setAttribute("max", RESOLUTION);
    element_slider.setAttribute("value", val2fac(default_value) * RESOLUTION);
    if (labels?.length > 2) element_slider.setAttribute("with-markers", true);

    if (!!input) {
        element_text.addEventListener("focusout", function() {
            if (this.checkValidity()) {
                const value = resizeNumber(Math.min(Math.max(parseFloat(this.value), min), max));
                this.value = value;
                element_slider.value = val2fac(value) * RESOLUTION;
                set(parseFloat(value));
            } else {
                const value = resizeNumber(get());
                this.value = value;
                element_slider.value = val2fac(value) * RESOLUTION;
            }
        });
    
        element_slider.addEventListener("input", function() {
            const factor = parseInt(this.value) / RESOLUTION;
            const temp = resizeNumber(fac2val(factor));
            if (input) element_text.value = temp;
            set(parseFloat(temp));
        });
        
        element_text.addEventListener("updategui", function() {
            if (this.matches(":focus")) return;
            const value = resizeNumber(get());
            this.value = value;
            element_slider.value = val2fac(value) * RESOLUTION;
        });
    }

	if (!!labels) {
		for (const label of labels) {
			const span = document.createElement("span");
			span.setAttribute("slot", "reference");
			span.innerText = label;
			element_slider.appendChild(span);
		} 
	}

    const element_name = document.createElement("p");
    element_name.innerText = name;

    const element_base = document.createElement("div");
    element_base.className = "slider";
    if (input) element_base.appendChild(element_text);
    element_base.appendChild(element_slider);
    element_base.appendChild(element_name);
    
    return element_base;
}