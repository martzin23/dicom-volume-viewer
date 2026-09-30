export function createElement(name, text, attributes = {}, children = []) {
    const element = document.createElement(name);
    if (text) element.innerText = text;

    for (const attribute in attributes)
        element.setAttribute("attribute", attributes[attribute]);

    for (const child of children)
        element.appendChild(child)

    return element;
}