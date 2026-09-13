import resizeNumber from "../utility/resize_number.js";

export function createIncrement(set = (value) => {}, get = () => 0.0, name = "Increment", min = -Infinity, max = Infinity, step = 1, multiply = false) {
    const default_value = resizeNumber(Math.max(Math.min(get(), max), min));

    const element_text = document.createElement("input");
    element_text.setAttribute("type", "text");
    element_text.setAttribute("pattern", '-?([0-9]+)(.[0-9]+)?');
    element_text.setAttribute("required", "");
    element_text.setAttribute("value", default_value);

    const element_plus = document.createElement("i");
    element_plus.className = "fa fa-plus";

    const element_increment = document.createElement("button");
    element_increment.className = "square";
    element_increment.appendChild(element_plus);

    const element_minus = document.createElement("i");
    element_minus.className = "fa fa-minus";

    const element_decrement = document.createElement("button");
    element_decrement.className = "square";
    element_decrement.appendChild(element_minus);

    const element_name = document.createElement("p");
    element_name.innerText = name;

    const element_base = document.createElement("div");
    element_base.appendChild(element_text);
    element_base.appendChild(element_increment);
    element_base.appendChild(element_decrement);
    element_base.appendChild(element_name);
    element_base.className = "incrementer";

    element_text.addEventListener("focusout", function() {
        if (this.checkValidity()) {
            const value = resizeNumber(Math.min(Math.max(parseFloat(this.value), min), max));
            this.value = value;
            set(parseFloat(value));
        } else {
            this.value = resizeNumber(get());
        }
    });
    
    element_text.addEventListener("updategui", function() {
        if (this.matches(":focus")) return;
        const value = resizeNumber(get());
        this.value = value;
    });

    element_increment.addEventListener("click", function() {
        const temp = multiply ? parseFloat(element_text.value) * step : parseFloat(element_text.value) + step;
        const value = resizeNumber(Math.min(Math.max(temp, min), max));
        element_text.value = value;
        set(parseFloat(value));
    });

    element_decrement.addEventListener("click", function() {
        const temp = multiply ? parseFloat(element_text.value) / step : parseFloat(element_text.value) - step;
        const value = resizeNumber(Math.min(Math.max(temp, min), max));
        element_text.value = value;
        set(parseFloat(value));
    });
    
    return element_base;
}

export function addIncrement(parent, set = (value) => {}, get = () => 0.0, name = "Increment", min = -Infinity, max = Infinity, step = 1, multiply = false) {
    const increment = createIncrement(set, get, name, min, max, step, multiply);
    parent.appendChild(increment);
    return increment;
}