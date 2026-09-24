import switchAttribute from '../utility/switch_attribute.js';
import { createDrag } from '../widgets/drag.js';
import { createIncrement } from '../widgets/increment.js';
import { switchSetIndex } from '../widgets/switch.js';
import { createToggle } from '../widgets/toggle.js';
import { setupAddTooltip } from '../widgets/tooltip.js';
import { createCollapse } from "../widgets/collapse.js";
import * as DICOM from "../utility/dicom_parser.js";
import Vector3D from '../math/vector3d.js';
import { createRange } from '../widgets/range.js';
import { createSlider } from '../widgets/slider.js';

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
    }

    setupWidgets(gpu, camera) {
        setupAddTooltip();

        const menu = document.getElementById("menu");

        const group_general = createCollapse("General", true);
        const element_input = document.createElement("input");
        element_input.type = "file";
        element_input.setAttribute("webkitdirectory", true);
        element_input.setAttribute("multiple", true);
        element_input.addEventListener("change", async (event) => {
            const files = event.target.files;
            const volume = await DICOM.dicomToVolume(files);
            // const volume = await DICOM.dicomdirToVolume(files);
            gpu.reloadImage(volume);
            camera.position = new Vector3D(volume.columns, volume.columns, volume.columns);
            camera.updateOrbit();
        });
        group_general.appendChild(element_input);
        
        group_general.appendChild(createToggle((value) => { this.toggleFullscreen(); }, () => this.isFullscreen(), "Fullscreen"));
        group_general.appendChild(createSlider((value) => {gpu.uniforms.render_scale = value; gpu.synchronize();},() => gpu.uniforms.render_scale , "Resolution", 0.1, 1));
        
        group_general.appendChild(createDrag((value) => {gpu.uniforms.grid_scale = value;}, () => gpu.uniforms.grid_scale, "Grid multiplier", 0, Infinity, 0.001));
        // group_general.appendChild(createDrag((value) => {gpu.uniforms.grid_stretch.x = value;}, () => gpu.uniforms.grid_stretch.x, "Grid stretch X", 0, Infinity, 0.001));
        // group_general.appendChild(createDrag((value) => {gpu.uniforms.grid_stretch.y = value;}, () => gpu.uniforms.grid_stretch.y, "Grid stretch Y", 0, Infinity, 0.001));
        // group_general.appendChild(createDrag((value) => {gpu.uniforms.grid_stretch.z = value;}, () => gpu.uniforms.grid_stretch.z, "Grid stretch Z", 0, Infinity, 0.001));
        menu.appendChild(group_general);
        
        const group_transform = createCollapse("Transform");
        group_transform.appendChild(createDrag((value) => {gpu.uniforms.gamma = value;}, () => gpu.uniforms.gamma, "gamma", 0, Infinity, 0.001));
        group_transform.appendChild(createDrag((value) => {gpu.uniforms.strength = value;}, () => gpu.uniforms.strength, "strength", 0, Infinity, 0.001));
        group_transform.appendChild(createDrag((value) => {gpu.uniforms.focus = value;}, () => gpu.uniforms.focus, "focus", 0, Infinity, 0.001));
        group_transform.appendChild(createDrag((value) => {gpu.uniforms.slope = value;}, () => gpu.uniforms.slope, "slope", 0, Infinity, 0.001));
        menu.appendChild(group_transform);

        const group_slice = createCollapse("Slice");
        group_slice.appendChild(createRange((value) => {gpu.uniforms.slice_up = value;}, () => gpu.uniforms.slice_up, "Slice Up", 0, 1));
        group_slice.appendChild(createRange((value) => {gpu.uniforms.slice_forward = value;}, () => gpu.uniforms.slice_forward, "Slice Forward", 0, 1));
        group_slice.appendChild(createRange((value) => {gpu.uniforms.slice_side = value;}, () => gpu.uniforms.slice_side, "Slice Side", 0, 1));
        menu.appendChild(group_slice);
    }
}