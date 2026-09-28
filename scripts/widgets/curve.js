import Vector2D from "../math/vector2d.js";
import { mapRange } from "../utility/map_range.js";
import { addDoubleTapListener } from "../utility/pointer.js";

export function createCurve(name = "Curve", onInput = (data) => {}) {
    let points = [];
    let previous_top;
    let power = 1.0;

    const element_base = document.createElement("div");
    element_base.className = "curve";

    const element_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    element_base.appendChild(element_svg);
    element_svg.setAttribute('viewBox', '0 0 1 1');
    element_svg.setAttribute('preserveAspectRatio', 'none');

    function update() {
        connectPoints(element_svg, points, power);
        onInput(element_base.getData());
    }

    // ---

    function createPoint(x, y, value = "#ffffff", disabled = false) {
        const element_color = document.createElement("input");
        element_color.setAttribute("type", "color");
        if (disabled) element_color.setAttribute("disabled", true);
        element_color.value = value;
        element_color.parent = element_base;
        previous_top = element_color;
        element_color.style.zIndex = 2;
        element_color.style.left = (x * 100) + "%";
        element_color.style.top = (y * 100) + "%";
        element_color.position = new Vector2D(x, y);
        
        const move_handler = function(event) {
            const rect = element_base.getBoundingClientRect();
            // element_color.style.left = (event.clientX - rect.left) + "px";
            // element_color.style.top = (event.clientY - rect.top) + "px";
            element_color.setPosition((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
            update();
            previous_top.style.zIndex = 1;
            element_color.style.zIndex = 2;
            previous_top = element_color;
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
            onInput(points2data(points));
            update();
        })

        addDoubleTapListener(element_color, () => {
            if (element_color.disabled) return;
            element_base.removeChild(element_color);
            points.splice(points.indexOf(element_color), 1);
            update();
        });

        element_color.setPosition = (x, y) => {
            element_color.style.left = (x * 100) + "%";
            element_color.style.top = (y * 100) + "%";
            element_color.position = new Vector2D(x, y);
        }

        element_color.getPosition = () => {
            // const rect = element_color.parent.getBoundingClientRect();
            // return new Vector2D(element_color.offsetLeft / rect.width, element_color.offsetTop / rect.height);
            return element_color.position;
        }

        return element_color;
    }

    function addPoint(x, y, value = "#ffffff", disabled = false) {
        const element_point = createPoint(x, y, value, disabled);
        element_base.appendChild(element_point);
        points.push(element_point);
    }

    function addLabel(x, y, value) {
        const element_label = document.createElement("p");
        element_label.className = "label";
        element_label.innerText = value;
        element_label.style.left = (x * 100) + "%";
        element_label.style.top = (y * 100) + "%";
        element_base.appendChild(element_label);
    }

    // ---

    element_svg.addEventListener("pointerdown", (event) => {
        if (event.target !== element_svg) return;
        const rect = element_base.getBoundingClientRect();
        addPoint((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
        update();
    })

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

    element_base.addPoint = (x, y, value, disabled) => {
        addPoint(x, y, value, disabled);
        update();
    };
    
    element_base.clearPoints = () => {
        points.forEach(element => {
            element_base.removeChild(element);
        });
        points = [];
        update();
    }

    element_base.setPower = (x) => {
        power = x;
        update();
    }

    element_base.setPreset = (preset, gpu) => {
        element_base.clearPoints();
        switch (preset) {
            case 1:
                addPoint(0, 0.9999999364217163, "#000000", true);
                addPoint(0.06844106075412791, 0.9530506163882817, "#000000", false);
                addPoint(0.10076045460891196, 0.03876488757038831, "#57fcff", false);
                addPoint(0.12927756907339485, 0.9578125026822089, "#000000", false);
                addPoint(1.0014258119376087, 0.9999999364217163, "#000000", true);
                gpu.uniforms.strength = 0.05248;
                gpu.uniforms.power = 1;
                break;
            case 2:
                addPoint(0, 0.9999999364217163, "#000000", true);
                addPoint(0.2243345919053723, 0.8816220676662402, "#000000", false);
                addPoint(0.25475285241074713, 0.08638394124451057, "#eebebe", false);
                addPoint(0.31558934803853134, 0.8911458402540944, "#000000", false);
                addPoint(1.0014258119376087, 0.9999999364217163, "#000000", true);
                gpu.uniforms.strength = 0.023572;
                gpu.uniforms.power = 4.771;
                break;
            case 3:
                addPoint(0, 0.9999999364217163, "#000000", true);
                addPoint(0.1178707182110086, 0.0625744461965913, "#65eaec", false);
                addPoint(0.17680608048938357, 0.9197172851742246, "#000000", false);
                addPoint(0.2205323252065539, 0.2197172661007394, "#f0c1c1", false);
                addPoint(0.2832699541837473, 0.9006696128419487, "#000000", false);
                addPoint(0.34220531646212227, 0.16257443983876294, "#ffffff", false);
                addPoint(1.0014258119376087, 0.9999999364217163, "#000000", true);
                gpu.uniforms.strength = 0.1;
                gpu.uniforms.power = 8.2;
                break;
            case 4:
                addPoint(0, 0.9999999364217163, "#000000", true);
                addPoint(0.24953787608363834, 0.8673364723627426, "#000000", false);
                addPoint(0.2791127455258118, 0.053050737187020795, "#f0d6d6", false);
                addPoint(0.31558934803853134, 0.8911458402540944, "#000000", false);
                addPoint(1.0014258119376087, 0.9999999364217163, "#000000", true);
                gpu.uniforms.strength = 0.1;
                gpu.uniforms.power = 10;
                break;
            default:
                addPoint(0, 0.9999999364217163, "#000000", true);
                addPoint(0.31939162108309116, 0.9416666067971161, "#000000", false);
                addPoint(0.3659695658243753, 0.07499999523162872, "#ffffff", false);
                addPoint(1.0014258119376087, 0.9999999364217163, "#000000", true);
                gpu.uniforms.strength = 0.01;
                gpu.uniforms.power = 1.0;
            break;
        }
        update();
    }

    element_base.printPreset = (gpu) => {
        let commands = "";
        for (const point of points) {
            const position = point.getPosition();
            commands += `addPoint(${position.x}, ${position.y}, "${point.value}", ${point.disabled});\n`;
        }
        commands += `gpu.uniforms.strength = ${gpu.uniforms.strength};\n`;
        commands += `gpu.uniforms.power = ${gpu.uniforms.power};`;
        console.log(commands);
    }

    // ---

    addPoint(0.0, 1.0, "#000000", true);
    addPoint(1.0, 1.0, "#000000", true);
    addPoint(0.26, 0.81, "#ffffff", false);
    addPoint(0.39, 0.05, "#ffffff", false);
    update();

    [-512, 0, 512, 1024, 2048].forEach(x => {
        addLabel(mapRange(x, -1024, 3071, 0, 1), 1.0, x);
    });

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

function rgb2hex(rgb) {
    return "#" + [Math.floor(rgb.r * 255), Math.floor(rgb.g * 255), Math.floor(rgb.b * 255)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

function sortPoints(points) {
    return points.toSorted((a, b) => {
        a = a.getPosition().x;
        b = b.getPosition().x;
        return ((a < b) ? -1 : ((a > b) ? 1 : 0))
    })
}

function points2data(points) {
    points = sortPoints(points);
    return points.map((el) => {
        const color = hex2rgb(el.value);
        const position = el.getPosition();
        return [color.r * (1.0 - position.y), color.g * (1.0 - position.y), color.b * (1.0 - position.y), position.x];
    });
}

function drawLine(svg, x1, y1, x2, y2, color1 = "#ffffff", color2) {
    if (!color2) color2 = color1;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'white');
    line.setAttribute('stroke-width', 0.01);
    svg.appendChild(line);

    let defs = svg.querySelector('defs');
    if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
    }

    const gradientId = 'line-gradient-' + Math.random().toString(36).slice(2, 9);
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
    gradient.setAttribute('x1', x1);
    gradient.setAttribute('y1', y1);
    gradient.setAttribute('x2', x2);
    gradient.setAttribute('y2', y2);

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', color1);

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', color2);

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);

    line.setAttribute('stroke', `url(#${gradientId})`);
}

function connectPoints(svg, points, power = 1.0, resolution = 4) {
    points = sortPoints(points);
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
    for (let i=0; i<points.length - 1; i++) {
        const first = points[i];
        const second = points[i + 1];
        const first_position = first.getPosition();
        const second_position = second.getPosition();
        for (let j=0; j<resolution; j++) {
            const first_factor = j / resolution;
            const second_factor = (j + 1) / resolution;
            drawLine(
                svg,
                mix(first_position.x, second_position.x, first_factor),
                1 - Math.pow(1 - mix(first_position.y, second_position.y, first_factor), power),
                mix(first_position.x, second_position.x, second_factor),
                1 - Math.pow(1 - mix(first_position.y, second_position.y, second_factor), power),
                rgb2hex(mixColor(hex2rgb(first.value), hex2rgb(second.value), first_factor)), 
                rgb2hex(mixColor(hex2rgb(first.value), hex2rgb(second.value), second_factor))
            );
        }
        // drawLine(svg, first_position.x, first_position.y, second_position.x, second_position.y, first.value, second.value);
    }
}

function mix(a, b, f) {
    return a * (1 - f) + b * f;
}

function mixColor(a, b, f) {
    return {
        r: mix(a.r, b.r, f),
        g: mix(a.g, b.g, f),
        b: mix(a.b, b.b, f)
    }
}