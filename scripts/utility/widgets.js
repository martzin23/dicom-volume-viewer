import * as TouchListener from './touch.js';

export function createButton(parent, set = () => {}, name = "Button") {
    const element_base = document.createElement("div");
    element_base.className = "button";
    element_base.innerHTML = name;
    element_base.addEventListener("click", set);

    parent.appendChild(element_base);
    return element_base;
}

export function createToggle(parent, set = (bool) => {}, get = () => false, name = "Toggle") {
    const default_value = get();

    const element_bool = document.createElement("div");
    element_bool.className = "boolean";
    if (default_value)
        element_bool.setAttribute("value", "true");
    else
        element_bool.setAttribute("value", "false");
    element_bool.appendChild(document.createElement("div"));

    element_bool.addEventListener("click", function() {
        if (this.getAttribute("value") == "false") {
            set(true);
            this.setAttribute("value", "true");
        }
        else {
            set(false);
            this.setAttribute("value", "false");
        }
    });   

    element_bool.addEventListener("updategui", function() {
        const value = get();
        if (value)
            this.setAttribute("value", "true");
        else
            this.setAttribute("value", "false");
    });

    const element_text = document.createElement("p");
    element_text.innerText = name;

    const element_base = document.createElement("div");
    element_base.className = "toggle";
    element_base.appendChild(element_bool);
    element_base.appendChild(element_text);
    
    parent.appendChild(element_base);
    return element_base;
}

export function createSlider(parent, set = (value) => {}, get = () => 0.0, name = "Slider", min = 0, max = 1, log = false) {
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
    
    parent.appendChild(element_base);
    return element_base;
}

export function createIncrement(parent, set = (value) => {}, get = () => 0.0, name = "Increment", min = -Infinity, max = Infinity, step = 1, multiply = false) {
    const default_value = resizeNumber(Math.max(Math.min(get(), max), min));

    const element_text = document.createElement("input");
    element_text.setAttribute("type", "text");
    element_text.setAttribute("pattern", '-?([0-9]+)(.[0-9]+)?');
    element_text.setAttribute("required", "");
    element_text.setAttribute("value", default_value);

    const element_plus = document.createElement("i");
    element_plus.className = "fa fa-plus";

    const element_increment = document.createElement("div");
    element_increment.className = "button round";
    element_increment.appendChild(element_plus);

    const element_minus = document.createElement("i");
    element_minus.className = "fa fa-minus";

    const element_decrement = document.createElement("div");
    element_decrement.className = "button round";
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
    
    parent.appendChild(element_base);
    return element_base;
}

export function createDrag(parent, set = (value) => {}, get = () => 0.0, name = "Drag", min = -Infinity, max = Infinity, sen = 0.01) {
    const default_value = resizeNumber(Math.max(Math.min(get(),  max), min));

    const element_text = document.createElement("input");
    element_text.setAttribute("type", "text");
    element_text.setAttribute("pattern", '-?([0-9]+)(.[0-9]+)?');
    element_text.setAttribute("required", "");
    element_text.setAttribute("value", default_value);

    const element_symbol = document.createElement("i");
    element_symbol.className = "fa fa-arrows-h";

    const element_button = document.createElement("div");
    element_button.className = "button";
    element_button.appendChild(element_symbol);

    const element_name = document.createElement("p");
    element_name.innerText = name;

    const element_base = document.createElement("div");
    element_base.appendChild(element_text);
    element_base.appendChild(element_button);
    element_base.appendChild(element_name);
    element_base.className = "drag";

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
        this.value = resizeNumber(get());
    });

    element_button.addEventListener("mousedown", function(event) {
        if (event.button != 0) return;
        const mousemove_listener = (event) => {
            const value = resizeNumber(Math.max(Math.min(parseFloat(element_text.value) + event.movementX * sen, max), min));
            element_text.value = value;
            set(parseFloat(value));
        }
        const mouseup_listener = () => {
            document.removeEventListener("mousemove", mousemove_listener);
            document.removeEventListener("mouseup", mouseup_listener);
        }
        document.addEventListener("mouseup", mouseup_listener);
        document.addEventListener("mousemove", mousemove_listener);
    });

    TouchListener.addTouchListener(element_button, function(event) {
        const value = resizeNumber(Math.max(Math.min(parseFloat(element_text.value) + event.drag_x * sen, max), min));
        element_text.value = value;
        set(parseFloat(value));
    });

    parent.appendChild(element_base);
    return element_base;
}

export function createSwitch(parent, set = (value) => {}, options = ['a', 'b', 'c', 'd'], def = 'a', name, unselectable = false) {
    const element_base = document.createElement("div");
    element_base.className = "switch";

    options.forEach((name, index) => {
        const element_button = createButton(element_base, function() {
            if (this.classList.contains('active') && unselectable) {
                element_base.childNodes.forEach((el) => {el.classList.remove("active")});
                set(null);
            } else {
                element_base.childNodes.forEach((el) => {el.classList.remove("active")});
                this.classList.toggle("active");
                set(index);
            }
        }, name);
        if (name === def)
            element_button.classList.add("active");
    });

    if (name) {
        const element_name = document.createElement("p");
        element_name.innerText = name;
        element_base.appendChild(element_name);
    }

    parent.appendChild(element_base);
    set(options.indexOf(def));
    return element_base;
}

export function createComment(parent, comment) {
    const element_comment = document.createElement("p");
    element_comment.className = "comment";
    element_comment.innerText = comment;

    parent.appendChild(element_comment);
    return element_comment;
}

export function switchGetIndex(element_switch) {
    let active_index = null;
    element_switch.childNodes.forEach((element, index) => {
        if (element.classList.contains("active"))
            active_index = index;
    });
    return active_index;
}

export function switchSetIndex(element_switch, active_index) {
    element_switch.childNodes.forEach((element, index) => {
        if (index == active_index)
            element.classList.add("active");
        else
            element.classList.remove("active");
    });
}

export function setupAddTooltip() {
    if (HTMLElement.prototype.addTooltip !== undefined)
        return;

    HTMLElement.prototype.addTooltip = function(tooltip, symbol) {
        if (symbol === undefined) {
            this.setAttribute("tooltip", tooltip)
        } else {
            const element_symbol = document.createElement("i");
            element_symbol.className = "fa " + symbol;

            const element_button = document.createElement("div");
            element_button.className = "button round";
            element_button.appendChild(element_symbol);
            element_button.setAttribute("tooltip", tooltip);

            this.appendChild(element_button);
        }
    }
}

export function switchAttribute(element_parent, index_true, attribute_true, attribute_false) {
    Array.from(element_parent.childNodes).filter((el) => (el.nodeType !== Node.TEXT_NODE)).forEach((element, index) => {
        if (index == index_true) {
            if (attribute_true !== undefined)
                element.classList.add(attribute_true);
            if (attribute_false !== undefined)
                element.classList.remove(attribute_false);
        } else {
            if (attribute_true !== undefined)
                element.classList.remove(attribute_true);
            if (attribute_false !== undefined)
                element.classList.add(attribute_false);
        }
    });
}

function resizeNumber(number, size = 7) {
    const digits = number.toString().replace(".","").length;
    const decimals = number.toString().split(".")[1] ? number.toString().split(".")[1].length : 0;
    const delta = digits > size ? decimals - (digits - size) : decimals;
    return number.toFixed(delta); 
}

