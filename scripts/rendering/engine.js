import WebGLManager from './gpu.js'
import GUIManager from './gui.js';
import Camera from './camera.js';
import FPSCounter from '../utility/fps.js';
import Vector2D from '../math/vector2d.js';
import Vector3D from '../math/vector3d.js';

class Engine {
    static async initialize() {
        window.addEventListener("error", (event) => {
            document.getElementById("popup-error").classList.remove("hidden");
            document.getElementById("output-fail").innerText = event.error;
        });
        const gpu = await WebGLManager.initialize(document.getElementById("canvas"));
        return new Engine(gpu);
    }

    constructor(gpu) {
        this.gpu = gpu;
        this.fps = new FPSCounter(document.getElementById("output-fps"), undefined, " fps");
        this.camera = new Camera(document.getElementById("canvas"), new Vector3D(this.gpu.volume_texture.width), new Vector2D(-135.0, 35.0), 0.3, 5.0, undefined, false, true);
        this.gui = new GUIManager(document.getElementById("canvas"), this.gpu, this.camera);
        this.fps_handler = setInterval(() => this.fps.set(), 1000);
    }

    update() {
        this.camera.update();
        this.fps.update();
        this.gpu.uniforms.camera_rotation = this.camera.getRotationMatrix();
        this.gpu.uniforms.camera_position = this.camera.position;
        this.gpu.uniforms.fov = this.camera.fov;
    }

    render() {
        this.gpu.render();
    }
}

const engine = await Engine.initialize();
let animation_id = requestAnimationFrame(animate);

async function animate() {
    engine.update();
    engine.render();
    animation_id = requestAnimationFrame(animate);
}
