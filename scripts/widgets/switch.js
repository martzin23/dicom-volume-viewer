import { addButton } from "./button.js";

export function createSwitch(set = (value) => {}, options = ['a', 'b', 'c', 'd'], def = 'a', name, unselectable = false) {
    const element_base = document.createElement("div");
    element_base.className = "switch";

    options.forEach((name, index) => {
        const element_button = addButton(element_base, function() {
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

    set(options.indexOf(def));
    return element_base;
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

export function addSwitch(parent, set = (value) => {}, options = ['a', 'b', 'c', 'd'], def = 'a', name, unselectable = false) {
    const switch_element = createSwitch(set, options, def, name, unselectable);
    parent.appendChild(switch_element);
    return switch_element;
}