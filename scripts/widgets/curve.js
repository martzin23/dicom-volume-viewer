import Vector2D from "../math/vector2d.js";
import { mapRange } from "../utility/map_range.js";
import { addDoubleTapListener } from "../utility/pointer.js";

export function createCurve(name = "Curve", onInput = (data) => {}) {
    let points = [];
    const element_base = document.createElement("div");
    element_base.className = "curve";

    function createLabel(x, y, value) {
        const element_label = document.createElement("p");
        element_label.className = "label";
        element_label.innerText = value;
        element_label.style.left = (x * 100) + "%";
        element_label.style.top = (y * 100) + "%";
        return element_label;
    }

    function createPoint(x, y, value = "#ffffff", disabled = false) {
        const element_color = document.createElement("input");
        element_color.setAttribute("type", "color");
        if (disabled) element_color.setAttribute("disabled", true);
        element_color.value = value;
        element_color.parent = element_base;
        
        const move_handler = function(event) {
            const rect = element_base.getBoundingClientRect();
            element_color.style.left = (event.clientX - rect.left) + "px";
            element_color.style.top = (event.clientY - rect.top) + "px";
        }
        element_color.addEventListener("pointerdown", (event) => {
            if (element_color.disabled) return;
            element_color.addEventListener("pointermove", move_handler)
        });
        element_color.addEventListener("pointerup", (event) => {
            element_color.removeEventListener("pointermove", move_handler);
        })
        element_color.addEventListener("mouseleave", (event) => {
            element_color.removeEventListener("pointermove", move_handler);
        })
        element_color.addEventListener("input", (event) => {
            onInput(element_base.getData());
        })
        addDoubleTapListener(element_color, () => {
            if (element_color.disabled) return;
            element_base.removeChild(element_color);
            points.pop(element_color);
            onInput(element_base.getData());
        });
        element_color.setPosition = (x, y) => {
            element_color.style.left = (x * 100) + "%";
            element_color.style.top = (y * 100) + "%";
        }
        element_color.getPosition = () => {
            const rect = element_color.parent.getBoundingClientRect();
            return new Vector2D(element_color.offsetLeft / rect.width, element_color.offsetTop / rect.height);
        }

        element_color.setPosition(x, y);

        return element_color;
    }

    element_base.addEventListener("click", (event) => {
        if (event.target !== element_base) return;
        const rect = element_base.getBoundingClientRect();
        const element_color = createPoint((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
        element_base.appendChild(element_color);
        points.push(element_color);
        onInput(element_base.getData());
    })

    let temp = createPoint(0.0, 1.0, "#000000", true);
    element_base.appendChild(temp);
    points.push(temp);

    temp = createPoint(1.0, 1.0, "#000000", true);
    element_base.appendChild(temp);
    points.push(temp);

    [-512, 0, 512, 1024, 2048].forEach(x => {
        element_base.appendChild(createLabel(mapRange(x, -1024, 3071, 0, 1), 1.0, x));
    });

    element_base.getData = function() {
        points = points.toSorted((a, b) => {
            a = a.getPosition().x;
            b = b.getPosition().x;
            return ((a < b) ? -1 : ((a > b) ? 1 : 0))
        })
        return points.map((el) => {
            const color = hex2rgb(el.value);
            const position = el.getPosition();
            return [color.r * (1.0 - position.y), color.g * (1.0 - position.y), color.b * (1.0 - position.y), position.x];
        });
    }

    element_base.createPoint = (x, y, value, disabled) => {
        const element_color = createPoint(x, y, value, disabled);
        element_base.appendChild(element_color);
        points.push(element_color);
        onInput(points);
    };
    
    element_base.clearPoints = () => {
        points.forEach(element => {
            element_base.removeChild(element);
        });
        points = [];
    }

    return element_base;
}

function hex2rgb(hex) {
    if (typeof hex !== 'string')
        throw new Error("Hex color must be a string.");

    let cleanHex = hex.trim().replace(/^#/, '');

    if (/^[0-9A-Fa-f]{3}$/.test(cleanHex))
        cleanHex = cleanHex.split('').map(ch => ch + ch).join('');

    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex))
        throw new Error(`Invalid hex color format: "${hex}"`);

    const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
    const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
    const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
    return { r, g, b };
}