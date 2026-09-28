
export function createCollapse(name = "Collapse", icon = "", default_state = false) {
    let state = default_state;
    const element_base = document.createElement("div");
    element_base.classList.add("collapse");
    if (!state)
        element_base.classList.add("closed");
    else
        element_base.classList.toggle("open");

    const element_indicator = document.createElement("i");
    element_indicator.className = "fa fa-chevron-right";

    const element_title = document.createElement("p");
    element_title.innerText = name;

    const element_hr_1 = document.createElement("hr");
    const element_hr_2 = document.createElement("hr");

    const element_button = document.createElement("div");
    if (!!icon) {
        const element_icon = document.createElement("i");
        element_icon.className = "fa " + icon;
        element_button.appendChild(element_icon);
    }
    element_button.appendChild(element_hr_1);
    element_button.appendChild(element_title);
    element_button.appendChild(element_hr_2);
    element_button.appendChild(element_indicator);
    element_button.addEventListener("click", (event) => {
        element_base.classList.toggle("closed");
        element_base.classList.toggle("open");
        state = !state;
    });
    
    element_base.appendChild(element_button);

    return element_base;
}