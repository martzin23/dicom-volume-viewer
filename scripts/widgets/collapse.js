
export function createCollapse(name = "Collapse", default_state = false) {
    let state = default_state;
    const element_base = document.createElement("div");
    element_base.classList.add("collapse");
    if (!state)
        element_base.classList.add("closed");

    const element_icon = document.createElement("i");
    element_icon.className = state ? "fa fa-chevron-down" : "fa fa-chevron-right";

    const element_title = document.createElement("p");
    element_title.innerText = name;

    const element_button = document.createElement("div");
    element_button.appendChild(element_icon);
    element_button.appendChild(element_title);
    element_button.addEventListener("click", (event) => {
        if (state) {
            element_base.classList.add("closed");
            element_icon.className = "fa fa-chevron-right";
        } else {
            element_base.classList.remove("closed");
            element_icon.className = "fa fa-chevron-down";
        }
        state = !state;
    });
    
    element_base.appendChild(element_button);

    return element_base;
}