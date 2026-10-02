
export function createInfo(name = "Info", labels = [], values = []) {
    const element_info = document.createElement("div");
    element_info.className = "info column";

    const element_title = document.createElement("p");
    element_title.innerText = name;
    element_title.className = "wide row align-center justify-center";
    element_info.appendChild(element_title);

    let element_labels = [];
    let element_values = [];
    for (let i=0; i<labels.length; i++) {
        const element_container = document.createElement("div");
        element_container.className = "row"

        const element_label = document.createElement("p");
        element_labels.push(element_label);
        element_label.innerText = labels[i];
        element_container.appendChild(element_label);

        const element_value = document.createElement("p");
        element_values.push(element_value);
        element_value.innerText = values[i];
        element_container.appendChild(element_value);

        element_info.appendChild(element_container);
    }

    element_info.updateValues = function(values = []) {
        element_values.forEach((element, index) => {
            element.innerText = values[index];
        })
    }

    return element_info;
}