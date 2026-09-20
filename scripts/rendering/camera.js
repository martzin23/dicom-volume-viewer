import * as Pointer from '../utility/pointer.js';
import Matrix from '../math/matrix.js';
import Vector from '../math/vector.js';
import Vector3D from '../math/vector3d.js';
import Vector2D from '../math/vector2d.js';

export default class Camera {

    constructor(
        canvas,
        radius = 0.0, 
        rotation = new Vector2D(0.0, 0.0), 
        fov = 0.5, 
        rotation_sensitivity = 0.5,
        rotation_smoothness = 0.9,
        zoom_sensitivity = 0.02,
        zoom_smoothness = 0.95,
        orbit_anchor = new Vector3D(0.0, 0.0, 0.0)
    ) {
        this.position = Vector3D.add(orbit_anchor, new Vector3D(radius * 2.0, 0.0, 0.0));
        this.rotation = rotation;
        this.fov = fov;
        this.rotation_sensitivity = rotation_sensitivity,
        this.rotation_smoothness = rotation_smoothness,
        this.zoom_sensitivity = zoom_sensitivity,
        this.zoom_smoothness = zoom_smoothness,
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
            this.speed.x = event.movementX * this.rotation_sensitivity;
            this.speed.y = event.movementY * this.rotation_sensitivity;
        });
        
        document.addEventListener('wheel', (event) => {
            if(this.scrollable)
                event.preventDefault();
        }, { passive: false });

        document.addEventListener('wheel', (event) => {
            if (this.scrollable)
                this.speed.z = (event.deltaY < 0) ? -this.zoom_sensitivity : this.zoom_sensitivity;
        });

        Pointer.addTouchListener(canvas, (event) => {
            this.speed = new Vector3D(event.drag_x * this.rotation_sensitivity, event.drag_y * this.rotation_sensitivity, event.zoom * this.zoom_sensitivity);
        });
    }

    getRotationMatrix() {
        let temp = Matrix.rotationMatrix(new Vector3D(0.0, 0.0, 1.0), Matrix.deg2rad(this.rotation.x));
        temp = Matrix.rotate(temp, Matrix.deg2rad(this.rotation.y), new Vector3D(1.0, 0.0, 0.0));
        return temp;
    }

    updateRotation(dh = 0.0, dv = 0.0) {
        this.rotation.x += dh * Math.min(this.fov, 1.0);
        this.rotation.y += dv * Math.min(this.fov, 1.0);
        this.rotation.x = this.rotation.x % 360.0;
        this.rotation.y = Math.max(Math.min(this.rotation.y, 90), -90);
    }

    updateOrbit(dh = 0.0, dv = 0.0, dz = 0.0) {
        const radius = Vector3D.sub(this.position, this.orbit_anchor).len() * (1.0 + dz);
        this.updateRotation(dh, dv);
        this.position = Vector3D.add(Vector3D.mul(Matrix.rot2dir(this.rotation.x, -this.rotation.y), -radius), this.orbit_anchor);
    }

    update() {
        if (this.speed.len() < 0.001) {
            this.speed.x = 0.0;
            this.speed.y = 0.0;
            this.speed.z = 0.0;
            return;
        }
        this.updateOrbit(this.speed.x, this.speed.y, this.speed.z);
        this.speed = Vector3D.mul(this.speed, new Vector3D(this.rotation_smoothness, this.rotation_smoothness, this.zoom_smoothness));
    }
}
