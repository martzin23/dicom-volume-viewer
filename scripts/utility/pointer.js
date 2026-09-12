import * as Vector from "./vector.js";

// TODO finish
export function addPointerListener(element, callback) {
    let rect = element.getBoundingClientRect();

    element.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        console.log(event);
        rect = element.getBoundingClientRect();
        let move_a = Vector.vec(0.0);
        let move_b = Vector.vec(0.0);

        const move_handler = (event) => {
            let zoom = 0.0;
            let pan = Vector.vec(0.0);
            if (event.isPrimary) {
                move_a = Vector.vec(event.movementX, event.movementY, 0.0);
            } else {
                move_b = Vector.vec(event.movementX, event.movementY, 0.0);
                zoom = Vector.len(Vector.sub(move_a, move_b));
                pan = Vector.add(move_a, move_b);
            }


            callback({
                pos: {
                    x: Math.min(Math.max((event.clientX - rect.x) / rect.width, 0.0), 1.0), 
                    y: Math.min(Math.max((event.clientY - rect.y) / rect.height, 0.0), 1.0)
                },
                move: {x: 0.0, y: 0.0},
                drag: {x: event.movementX, y: event.movementY},
                pan: {x: pan.x, y: pan.y},
                zoom: zoom,
            });
        };

        const exit_handler = (event) => {
            element.removeEventListener("pointermove", move_handler);
            ["pointerup", "pointercancel", "pointerleave"].forEach(el => {element.removeEventListener(el, exit_handler)});
        };

        element.addEventListener("pointermove", move_handler);
        ["pointerup", "pointercancel", "pointerleave"].forEach(el => {element.addEventListener(el, exit_handler)});

    });

    // element.addEventListener("pointermove", (event) => {
    //     callback({
    //         pos: {
    //             x: Math.min(Math.max((event.clientX - rect.x) / rect.width, 0.0), 1.0), 
    //             y: Math.min(Math.max((event.clientY - rect.y) / rect.height, 0.0), 1.0)
    //         },
    //         move: {x: event.movementX, y: event.movementY},
    //         drag: {x: 0.0, y: 0.0},
    //         pan: {x: 0.0, y: 0.0},
    //         zoom: 0.0,
    //     });
    // });
}