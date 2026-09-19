import Vector3D from "../math/vector3d.js";
import Matrix from "../math/matrix.js";
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
    }

    setupWidgets(gpu, camera) {
        setupAddTooltip();

        addToggle(document.getElementById("group-display"), (value) => { this.toggleFullscreen(); }, () => this.isFullscreen(), "Fullscreen");
        addIncrement(document.getElementById("group-display"), (value) => {gpu.uniforms.render_scale = value; gpu.synchronize();},() => gpu.uniforms.render_scale , "Resolution division", 1, 16).addTooltip("Higher number = lower resolution, improves performance");
        addButton(document.getElementById("group-display"), () => {gpu.synchronize();}, "Fix aspect ratio").addTooltip("Click this if the image is stretched");
        addButton(document.getElementById("group-display"), () => {
            var current_date = new Date(); 
            var date_time = "" + current_date.getFullYear() + (current_date.getMonth() + 1) + current_date.getDate() + current_date.getHours() + current_date.getMinutes() + current_date.getSeconds();
            gpu.screenshot(date_time);
        }, '<i class="fa fa-download"></i>Screenshot').addTooltip("Save and download current rendered image");

        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.grid_scale = value;}, () => gpu.uniforms.grid_scale, "Grid multiplier", 0, Infinity, 0.001).addTooltip("Change the resolution of the grid, performance heavy");
        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.grid_stretch.x = value;}, () => gpu.uniforms.grid_stretch.x, "Grid stretch X", 0, Infinity, 0.001).addTooltip("Change the resolution of the grid, performance heavy");
        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.grid_stretch.y = value;}, () => gpu.uniforms.grid_stretch.y, "Grid stretch Y", 0, Infinity, 0.001).addTooltip("Change the resolution of the grid, performance heavy");
        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.grid_stretch.z = value;}, () => gpu.uniforms.grid_stretch.z, "Grid stretch Z", 0, Infinity, 0.001).addTooltip("Change the resolution of the grid, performance heavy");

        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.gamma = value;}, () => gpu.uniforms.gamma, "gamma", 0, Infinity, 0.001).addTooltip("test");
        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.strength = value;}, () => gpu.uniforms.strength, "strength", 0, Infinity, 0.001).addTooltip("test");
        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.focus = value;}, () => gpu.uniforms.focus, "focus", 0, Infinity, 0.001).addTooltip("test");
        addDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.slope = value;}, () => gpu.uniforms.slope, "slope", 0, Infinity, 0.001).addTooltip("test");
    }
}