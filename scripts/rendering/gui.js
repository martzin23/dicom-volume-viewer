import Vector3D from "../math/vector3d.js";
import switchAttribute from '../utility/switch_attribute.js';
import { addButton } from '../widgets/button.js';
import { addComment } from '../widgets/comment.js';
import { addDrag } from '../widgets/drag.js';
import { addIncrement } from '../widgets/increment.js';
import { addSlider } from '../widgets/slider.js';
import { addSwitch, switchSetIndex } from '../widgets/switch.js';
import { addToggle } from '../widgets/toggle.js';
import { setupAddTooltip } from '../widgets/tooltip.js';

export default class GUIManager {
    constructor(canvas, gpu, camera) {
        this.current_tab = 0;
        this.key_states = {};
        this.mouse_states = [false, false, false, false, false];
        this.update_event = new CustomEvent('updategui', {bubbles: true, cancelable: true });

        this.setupListeners(gpu);
        this.setupWidgets(gpu, camera);
        this.update_handler = setInterval(() => { this.updateValues(); }, 500);
    }

    toggleFullscreen() {
        if (this.isFullscreen()) {
            if (document.exitFullscreen)
                document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen)
                document.webkitExitFullscreen().catch(() => {});
            else if (document.msExitFullscreen)
                document.msExitFullscreen().catch(() => {});

        } else {
            if (document.documentElement.requestFullscreen)
                document.documentElement.requestFullscreen();
            else if (document.documentElement.webkitRequestFullscreen)
                document.documentElement.webkitRequestFullscreen();
            else if (eldocument.documentElementem.msRequestFullscreen)
                document.documentElement.msRequestFullscreen();
        }
    }

    isFullscreen() {
        return (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) !== undefined;
    }

    isTyping() {
        return (document.activeElement.type === 'text') || (document.activeElement.nodeName === 'TEXTAREA');
    }

    isKeyPressed() {
        let pressed = false;
        for (const key in this.key_states)
            if (this.key_states[key] === true)
                pressed = true;
        return pressed;
    }

    isMousePressed() {
        let pressed = false;
        this.mouse_states.forEach(button => {
            if (button) pressed = true;
        });
        return pressed;
    }

    updateValues() {
        document.querySelectorAll("menu *").forEach(element => {element.dispatchEvent(this.update_event);});
    }
    
    switchTab(value, update_buttons = true) {
        if (update_buttons) {
            const switch_element = document.getElementById("group-tabs").firstChild;
            switchSetIndex(switch_element, value);
        }

        const element_menu = document.getElementById("menu");
        element_menu.classList.remove("hidden");
        this.current_tab = value;

        if (value === null) {
            if (this.isFullscreen())
                element_menu.classList.add("hidden");
            switchAttribute(element_menu, 0, undefined, "hidden");
        } else {
            switchAttribute(element_menu, value + 1, undefined, "hidden");
        }
    }

    setupListeners(gpu) {
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach((eventType) => {
            document.addEventListener(eventType, () => {
                const menu = document.getElementById("menu");

                if (!this.isFullscreen() && this.current_tab === null)
                    menu.classList.remove("hidden");
                else if (this.isFullscreen() && this.current_tab === null)
                    menu.classList.add("hidden");
            })
        });
        
        document.addEventListener('keydown', (event) => {
            this.key_states[event.key] = true;
            switch (event.key) {
                case "ArrowUp":
                    if (this.isTyping()) return;
                    gpu.uniforms.render_scale = Math.max(gpu.uniforms.render_scale - 1, 1);
                    gpu.synchronize();
                    break;
                case "ArrowDown":
                    if (this.isTyping()) return;
                    gpu.uniforms.render_scale = Math.min(gpu.uniforms.render_scale + 1, 16);
                    gpu.synchronize();
                    break;
                case "F11":
                    event.preventDefault();
                    this.toggleFullscreen();
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            this.key_states[event.key] = false;
        });

        document.addEventListener('mousedown', (event) => {
            this.mouse_states[event.button] = true;
        });

        document.addEventListener('mouseup', (event) => {
            this.mouse_states[event.button] = false;
        });

        document.getElementById("input-file").addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file || !file.type.startsWith('image/'))
                return;

            const reader = new FileReader();
            
            reader.onload = function(event) {
                const url = event.target.result;
                
                document.getElementById("output-preview").src = url;

                const image = new Image();
                image.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = image.width;
                    canvas.height = image.height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0);
                    
                    const image_data = ctx.getImageData(0, 0, image.width, image.height);

                    gpu.reloadImage(image_data);
                };
                image.src = url;
            };
            
            reader.readAsDataURL(file);
        });
    }

    setupWidgets(gpu, camera) {
        setupAddTooltip();

        addSwitch(
            document.getElementById("group-tabs"), 
            (value) => { this.switchTab(value, false); }, 
            [
                '<i class="fa fa-cog"></i>General', 
                '<i class="fa fa-compass"></i>Traversal', 
                '<i class="fa fa-area-chart"></i>Heightmap', 
                '<i class="fa fa-info"></i>Controls', 
            ], 
            '<i class="fa fa-cog"></i>General',
            undefined,
            true
        );

        addToggle(document.getElementById("group-display"), (value) => { this.toggleFullscreen(); }, () => this.isFullscreen(), "Fullscreen");
        addIncrement(document.getElementById("group-display"), (value) => {gpu.uniforms.render_scale = value; gpu.synchronize();},() => gpu.uniforms.render_scale , "Resolution division", 1, 16).addTooltip("Higher number = lower resolution, improves performance");
        addButton(document.getElementById("group-display"), () => {gpu.synchronize();}, "Fix aspect ratio").addTooltip("Click this if the image is stretched");
        addButton(document.getElementById("group-display"), () => {
            var current_date = new Date(); 
            var date_time = "" + current_date.getFullYear() + (current_date.getMonth() + 1) + current_date.getDate() + current_date.getHours() + current_date.getMinutes() + current_date.getSeconds();
            gpu.screenshot(date_time);
        }, '<i class="fa fa-download"></i>Screenshot').addTooltip("Save and download current rendered image");


        addSwitch(
            document.getElementById("group-camera-mode"),
            (value) => {
                switchAttribute(document.getElementById("group-camera-firstperson").parentNode, value, undefined, "hidden");
                camera.orbit_mode = value;
            },
            ["First person", "Orbit"],
            (camera.orbit_mode) ? "Orbit" : "First person",
            "Camera mode"
        );
    
        addDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.rotation.x = value;}, () => camera.rotation.x, "Horizontal rotation", -Infinity, Infinity, 0.1).addTooltip("Rotation of the camera around the Z axis");
        addDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.rotation.y = value;}, () => camera.rotation.y, "Vertical rotation", -90, 90, 0.1).addTooltip("Rotation of the camera around the local X axis");
        addSlider(document.getElementById("group-camera-firstperson"), (value) => {camera.speed = value;}, () => camera.speed, "Speed", 0, 10, true).addTooltip("Translation speed of the camera");
        addSlider(document.getElementById("group-camera-firstperson"), (value) => {camera.sensitivity = value;}, () => camera.sensitivity, "Sensitivity", 0.01, 0.5, true).addTooltip("Rotation speed of the camera");
        addDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.fov = value;}, () => camera.fov, "Field of view", 0, Infinity, 0.005).addTooltip("Angular extent of the observable scene");
        addDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.position.x = value;}, () => camera.position.x, "X", -Infinity, Infinity, 0.1).addTooltip("Position of the camera along the X axis");
        addDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.position.y = value;}, () => camera.position.y, "Y Position", -Infinity, Infinity, 0.1).addTooltip("Position of the camera along the Y axis");
        addDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.position.z = value;}, () => camera.position.z, "Z", -Infinity, Infinity, 0.1).addTooltip("Position of the camera along the Z axis");
        
        addDrag(document.getElementById("group-camera-orbit"), (value) => {camera.position = Vector3D.add(Vector3D.mul(Matrix.rot2dir(camera.rotation.x, -camera.rotation.y), -value), camera.orbit_anchor)}, () => (Vector3D.add(camera.position, camera.orbit_anchor)).len(), "Distance", 0, Infinity, 0.1).addTooltip("Distance of the camera from the orbit anchor point");
        addDrag(document.getElementById("group-camera-orbit"), (value) => {camera.rotation.x = value; camera.updateOrbit();}, () => camera.rotation.x, "Horizontal angle", -Infinity, Infinity, 0.1).addTooltip("Horizontal angle around the camera orbit anchor");
        addDrag(document.getElementById("group-camera-orbit"), (value) => {camera.rotation.y = value; camera.updateOrbit();}, () => camera.rotation.y, "Vertical angle", -90, 90, 0.1).addTooltip("Vertical angle around the camera orbit anchor");
        addSlider(document.getElementById("group-camera-orbit"), (value) => {camera.speed = value;}, () => camera.speed, "Speed", 0, 10, true).addTooltip("Translation speed of the camera");
        addSlider(document.getElementById("group-camera-orbit"), (value) => {camera.sensitivity = value;}, () => camera.sensitivity, "Sensitivity", 0.01, 0.5, true).addTooltip("Rotation speed of the camera");
        addDrag(document.getElementById("group-camera-orbit"), (value) => {camera.fov = value;}, () => camera.fov, "Field of view", 0, Infinity, 0.005).addTooltip("Angular extent of the observable scene");
        addDrag(document.getElementById("group-camera-orbit"), (value) => {camera.orbit_anchor.x = value; camera.updateOrbit();}, () => camera.orbit_anchor.x, "X", -Infinity, Infinity, 0.1).addTooltip("Position of the orbit anchor along the X axis");
        addDrag(document.getElementById("group-camera-orbit"), (value) => {camera.orbit_anchor.y = value; camera.updateOrbit();}, () => camera.orbit_anchor.y, "Y Orbit anchor", -Infinity, Infinity, 0.1).addTooltip("Position of the orbit anchor along the Y axis");
        addDrag(document.getElementById("group-camera-orbit"), (value) => {camera.orbit_anchor.z = value; camera.updateOrbit();}, () => camera.orbit_anchor.z, "Z", -Infinity, Infinity, 0.1).addTooltip("Position of the orbit anchor along the Z axis");


        addToggle(document.getElementById("group-grid"), (value) => {gpu.uniforms.height_invert = value;}, () => gpu.uniforms.height_invert, "Invert height").addTooltip("The highest points become the lowest, the lowest become the highest");
        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.grid_scale.x = value;}, () => gpu.uniforms.grid_scale.x, "Grid multiplier X", 0, Infinity, 0.001).addTooltip("Change the resolution of the grid, performance heavy");
        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.grid_scale.y = value;}, () => gpu.uniforms.grid_scale.y, "Grid multiplier Y", 0, Infinity, 0.001).addTooltip("Change the resolution of the grid, performance heavy");
        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.grid_scale.z = value;}, () => gpu.uniforms.grid_scale.z, "Grid multiplier Z", 0, Infinity, 0.001).addTooltip("Change the resolution of the grid, performance heavy");
        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.height_multiplier = value;}, () => gpu.uniforms.height_multiplier, "Height multiplier", 0, Infinity).addTooltip("Multiply the calculated height by this value");
        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.height_offset = value;}, () => gpu.uniforms.height_offset, "Height offset", -Infinity, Infinity, 1.0).addTooltip("Add this value to the height calculation");

        addSwitch(
            document.getElementById("group-shading-mode"),
            (value) => {
                switchAttribute(document.getElementById("group-shading-shaded").parentNode, value, undefined, "hidden");
                gpu.uniforms.shading_mode = value;
            },
            ["Flat", "Shaded", "Normals", "Color"],
            "Flat"
        ).addTooltip("The visual style of the surface");
        addSlider(document.getElementById("group-shading-flat"), (value) => {gpu.uniforms.fade_blend = value;}, () => gpu.uniforms.fade_blend, "Height fade", 0.0, 1.0).addTooltip("Adds a darkening effect the lower the height is");
        addSlider(document.getElementById("group-shading-shaded"), (value) => {gpu.uniforms.fade_blend = value;}, () => gpu.uniforms.fade_blend, "Height fade", 0.0, 1.0).addTooltip("Adds a darkening effect the lower the height is");
        addSlider(document.getElementById("group-shading-shaded"), (value) => {gpu.uniforms.normals_epsilon = value;}, () => gpu.uniforms.normals_epsilon, "Normals epsilon", 0.0, 25.0).addTooltip("Terrain surface direction approximation, doesn't display when at 0.0, highter numbers mean lower precision");
        addSlider(document.getElementById("group-shading-normal"), (value) => {gpu.uniforms.normals_epsilon = value;}, () => gpu.uniforms.normals_epsilon, "Normals epsilon", 0.0, 25.0).addTooltip("Terrain surface direction approximation, doesn't display when at 0.0, highter numbers mean lower precision");
        addSlider(document.getElementById("group-shading-color"), (value) => {gpu.uniforms.grayscale_blend = value;}, () => gpu.uniforms.grayscale_blend, "Grayscale", 0.0, 1.0).addTooltip("Level of desaturation");
        addSlider(document.getElementById("group-shading"), (value) => {gpu.uniforms.voxel_blend = value;}, () => gpu.uniforms.voxel_blend, "Voxel shading", 0.0, 1.0).addTooltip("Adds shading to individual voxels (zoom in)");
    }
}