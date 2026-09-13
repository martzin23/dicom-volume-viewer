import * as TouchListener from '../utility/pointer.js';
import resizeNumber from '../utility/resize_number.js';

export function createDrag(set = (value) => {}, get = () => 0.0, name = "Drag", min = -Infinity, max = Infinity, sen = 0.01) {
    const default_value = resizeNumber(Math.max(Math.min(get(),  max), min));

    const element_text = document.createElement("input");
    element_text.setAttribute("type", "text");
    element_text.setAttribute("pattern", '-?([0-9]+)(.[0-9]+)?');
    element_text.setAttribute("required", "");
    element_text.setAttribute("value", default_value);

    const element_symbol = document.createElement("i");
    element_symbol.className = "fa fa-arrows-h";

    const element_button = document.createElement("button");
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

    return element_base;
}


export function addDrag(parent, set = (value) => {}, get = () => 0.0, name = "Drag", min = -Infinity, max = Infinity, sen = 0.01) {
    const drag = createDrag(set, get, name, min, max, sen);
    parent.appendChild(drag);
    return drag;
}