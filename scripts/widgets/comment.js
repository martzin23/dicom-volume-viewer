
export function createComment(comment) {
    const element_comment = document.createElement("em");
    element_comment.innerText = comment;

    return element_comment;
}

export function addComment(parent, comment) {
    const element_comment = createComment(comment);
    parent.appendChild(element_comment);
    return element_comment;
}