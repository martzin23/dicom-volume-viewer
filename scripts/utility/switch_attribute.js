
export default function switchAttribute(element_parent, index_true, attribute_true, attribute_false) {
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