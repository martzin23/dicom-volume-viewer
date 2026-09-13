
export function createToggle(set = (bool) => {}, get = () => false, name = "Toggle") {
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
    
    return element_base;
}


export function addToggle(parent, set = (bool) => {}, get = () => false, name = "Toggle") {
    const toggle = createToggle(set, get, name);
    parent.appendChild(toggle);
    return toggle;
}