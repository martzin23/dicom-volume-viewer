
export function createComment(comment) {
    const element_comment = document.createElement("em");
    element_comment.innerText = comment;

    return element_comment;
}