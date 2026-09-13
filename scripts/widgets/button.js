
export function createButton(set = () => {}, name = "Button") {
    const element_base = document.createElement("button");
    element_base.innerHTML = name;
    element_base.addEventListener("click", set);
    return element_base;
}

export function addButton(parent, set = () => {}, name = "Button") {
    const button = createButton(set, name);
    parent.appendChild(button);
    return button;
}