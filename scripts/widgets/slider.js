import resizeNumber from "../utility/resize_number.js";

export function createSlider(set = (value) => {}, get = () => 0.0, name = "Slider", min = 0, max = 1, log = false) {
    if (log) min = Math.max(min, 0.000001);
    const default_value = resizeNumber(Math.max(Math.min(get(), max), min));
    const resolution = 1000.0;

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

    const element_text = document.createElement("input");
    element_text.setAttribute("type", "text");
    element_text.setAttribute("pattern", '-?([0-9]+)(.[0-9]+)?');
    element_text.setAttribute("required", "");
    element_text.setAttribute("value", default_value);

    const element_range = document.createElement("input");
    element_range.setAttribute("type", "range");
    element_range.setAttribute("value", "1");
    element_range.setAttribute("min", "0");
    element_range.setAttribute("max", resolution);
    element_range.setAttribute("step", "1");
    element_range.setAttribute("value", val2fac(default_value) * resolution);

    element_text.addEventListener("focusout", function() {
        if (this.checkValidity()) {
            const value = resizeNumber(Math.min(Math.max(parseFloat(this.value), min), max));
            this.value = value;
            element_range.value = val2fac(value) * resolution;
            set(parseFloat(value));
        } else {
            const value = resizeNumber(get());
            this.value = value;
            element_range.value = val2fac(value) * resolution;
        }
    });

    element_range.addEventListener("input", function() {
        const factor = parseInt(this.value) / resolution;
        const temp = resizeNumber(fac2val(factor));
        element_text.value = temp;
        set(parseFloat(temp));
    });
    
    element_text.addEventListener("updategui", function() {
        if (this.matches(":focus")) return;
        const value = resizeNumber(get());
        this.value = value;
        element_range.value = val2fac(value) * resolution;
    });

    const element_name = document.createElement("p");
    element_name.innerText = name;

    const element_base = document.createElement("div");
    element_base.className = "slider";
    element_base.appendChild(element_text);
    element_base.appendChild(element_range);
    element_base.appendChild(element_name);
    
    return element_base;
}

export function addSlider(parent, set = (value) => {}, get = () => 0.0, name = "Slider", min = 0, max = 1, log = false) {
    const slider = createSlider(set, get, name, min, max, log);
    parent.appendChild(slider);
    return slider;
}