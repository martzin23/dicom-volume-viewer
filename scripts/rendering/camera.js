import * as Pointer from '../utility/pointer.js';
import Matrix from '../math/matrix.js';
import Vector from '../math/vector.js';
import Vector3D from '../math/vector3d.js';
import Vector2D from '../math/vector2d.js';

export default class Camera {

    constructor(
        canvas,
        position = new Vector3D(0.0), 
        rotation = new Vector2D(0.0, 0.0), 
        fov = 0.5, 
        sensitivity = 0.2,
        orbit_anchor = new Vector3D(0.0, 0.0, 0.0)
    ) {
        this.position = position;
        this.rotation = rotation;
        this.fov = fov;
        this.sensitivity = sensitivity;
        this.orbit_anchor = orbit_anchor;

        this.movable = false;
        this.scrollable = false;
        this.speed = new Vector3D(0.0, 0.0, 0.0);
        
        this.updateOrbit();

        canvas.addEventListener("mouseenter", (event) => {
            this.scrollable = true;
        });

        canvas.addEventListener("mouseleave", (event) => {
            this.scrollable = false;
        });

        canvas.addEventListener("mousedown", (event) => {
            this.movable = true;
        });
        
        document.addEventListener("mouseup", (event) => {
            this.movable = false;
        });
        
        document.addEventListener("mousemove", (event) => {
            if (!this.movable) return;
            // this.updateOrbit(event.movementX, event.movementY);
            this.speed.x = event.movementX;
            this.speed.y = event.movementY;
        });
        
        document.addEventListener('wheel', (event) => {
            if(this.scrollable)
                event.preventDefault();
        }, { passive: false });

        document.addEventListener('wheel', (event) => {
            if (this.scrollable) {
                const delta = (event.deltaY < 0) ? -1 : 1;
                this.speed.z = delta * 0.03;
            }
        });

        Pointer.addTouchListener(canvas, (event) => {
            this.updateOrbit(event.drag_x * this.sensitivity * 4.0, event.drag_y * this.sensitivity * 4.0);

            if (event.zoom != 0)
                this.position = Vector3D.add(this.position, Vector3D.mul(Matrix.rot2dir(this.rotation.x, -this.rotation.y), this.sensitivity * event.zoom));
        });
    }

    getRotationMatrix() {
        let temp = Matrix.rotationMatrix(new Vector3D(0.0, 0.0, 1.0), Matrix.deg2rad(this.rotation.x));
        temp = Matrix.rotate(temp, Matrix.deg2rad(this.rotation.y), new Vector3D(1.0, 0.0, 0.0));
        return temp;
    }

    updateRotation(dh = 0.0, dv = 0.0) {
        this.rotation.x += dh * this.sensitivity * Math.min(this.fov, 1.0);
        this.rotation.y += dv * this.sensitivity * Math.min(this.fov, 1.0);
        this.rotation.x = this.rotation.x % 360.0;
        this.rotation.y = Math.max(Math.min(this.rotation.y, 90), -90);
    }

    updateOrbit(dh = 0.0, dv = 0.0, dz = 1.0) {
        const radius = Vector3D.sub(this.position, this.orbit_anchor).len() * dz;
        this.updateRotation(dh / this.sensitivity, dv / this.sensitivity);
        this.position = Vector3D.add(Vector3D.mul(Matrix.rot2dir(this.rotation.x, -this.rotation.y), -radius), this.orbit_anchor);
    }

    update() {
        if (this.speed.len() < 0.001) {
            this.speed.x = 0.0;
            this.speed.y = 0.0;
            this.speed.z = 0.0;
            return;
        }
        this.updateOrbit(this.speed.x, this.speed.y / 5.0, 1.0 + this.speed.z);
        this.speed = Vector3D.mul(this.speed, 0.9);
    }
}
