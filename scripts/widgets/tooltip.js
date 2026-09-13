
export function setupAddTooltip() {
    if (HTMLElement.prototype.addTooltip !== undefined)
        return;

    HTMLElement.prototype.addTooltip = function(tooltip, symbol) {
        if (symbol === undefined) {
            this.setAttribute("tooltip", tooltip)
        } else {
            const element_symbol = document.createElement("i");
            element_symbol.className = "fa " + symbol;

            const element_button = document.createElement("button");
            element_button.className = "square";
            element_button.appendChild(element_symbol);
            element_button.setAttribute("tooltip", tooltip);

            this.appendChild(element_button);
        }
    }
}