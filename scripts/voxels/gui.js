import * as Widgets from '../utility/widgets.js';
import * as GUIUtils from '../utility/gui_utils.js';

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
            Widgets.switchSetIndex(switch_element, value);
        }

        const element_menu = document.getElementById("menu");
        element_menu.classList.remove("hidden");
        this.current_tab = value;

        if (value === null) {
            if (this.isFullscreen())
                element_menu.classList.add("hidden");
            Widgets.switchAttribute(element_menu, 0, undefined, "hidden");
        } else {
            Widgets.switchAttribute(element_menu, value + 1, undefined, "hidden");
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
        Widgets.setupAddTooltip();

        GUIUtils.createControlsInfo(document.getElementById("group-controls"));

        Widgets.createSwitch(
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

        Widgets.createToggle(document.getElementById("group-display"), (value) => { this.toggleFullscreen(); }, () => this.isFullscreen(), "Fullscreen");
        Widgets.createIncrement(document.getElementById("group-display"), (value) => {gpu.uniforms.render_scale = value; gpu.synchronize();},() => gpu.uniforms.render_scale , "Resolution division", 1, 16).addTooltip("Higher number = lower resolution, improves performance");
        Widgets.createButton(document.getElementById("group-display"), () => {gpu.synchronize();}, "Fix aspect ratio").addTooltip("Click this if the image is stretched");
        Widgets.createButton(document.getElementById("group-display"), () => {
            var current_date = new Date(); 
            var date_time = "" + current_date.getFullYear() + (current_date.getMonth() + 1) + current_date.getDate() + current_date.getHours() + current_date.getMinutes() + current_date.getSeconds();
            gpu.screenshot(date_time);
        }, '<i class="fa fa-download"></i>Screenshot').addTooltip("Save and download current rendered image");

        GUIUtils.createCameraWidgets(camera, document.getElementById("group-camera"));
        
        Widgets.createToggle(document.getElementById("group-grid"), (value) => {gpu.uniforms.height_invert = value;}, () => gpu.uniforms.height_invert, "Invert height").addTooltip("The highest points become the lowest, the lowest become the highest");
        Widgets.createDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.grid_scale = value;}, () => gpu.uniforms.grid_scale, "Grid multiplier", 0, Infinity, 0.001).addTooltip("Change the resolution of the grid, performance heavy");
        Widgets.createDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.height_multiplier = value;}, () => gpu.uniforms.height_multiplier, "Height multiplier", 0, Infinity).addTooltip("Multiply the calculated height by this value");
        Widgets.createDrag(document.getElementById("group-grid"), (value) => {gpu.uniforms.height_offset = value;}, () => gpu.uniforms.height_offset, "Height offset", -Infinity, Infinity, 1.0).addTooltip("Add this value to the height calculation");

        Widgets.createSwitch(
            document.getElementById("group-shading-mode"),
            (value) => {
                Widgets.switchAttribute(document.getElementById("group-shading-shaded").parentNode, value, undefined, "hidden");
                gpu.uniforms.shading_mode = value;
            },
            ["Flat", "Shaded", "Normals", "Color"],
            "Flat"
        ).addTooltip("The visual style of the surface");
        Widgets.createSlider(document.getElementById("group-shading-flat"), (value) => {gpu.uniforms.fade_blend = value;}, () => gpu.uniforms.fade_blend, "Height fade", 0.0, 1.0).addTooltip("Adds a darkening effect the lower the height is");
        Widgets.createSlider(document.getElementById("group-shading-shaded"), (value) => {gpu.uniforms.fade_blend = value;}, () => gpu.uniforms.fade_blend, "Height fade", 0.0, 1.0).addTooltip("Adds a darkening effect the lower the height is");
        Widgets.createSlider(document.getElementById("group-shading-shaded"), (value) => {gpu.uniforms.normals_epsilon = value;}, () => gpu.uniforms.normals_epsilon, "Normals epsilon", 0.0, 25.0).addTooltip("Terrain surface direction approximation, doesn't display when at 0.0, highter numbers mean lower precision");
        Widgets.createSlider(document.getElementById("group-shading-normal"), (value) => {gpu.uniforms.normals_epsilon = value;}, () => gpu.uniforms.normals_epsilon, "Normals epsilon", 0.0, 25.0).addTooltip("Terrain surface direction approximation, doesn't display when at 0.0, highter numbers mean lower precision");
        Widgets.createSlider(document.getElementById("group-shading-color"), (value) => {gpu.uniforms.grayscale_blend = value;}, () => gpu.uniforms.grayscale_blend, "Grayscale", 0.0, 1.0).addTooltip("Level of desaturation");
        Widgets.createSlider(document.getElementById("group-shading"), (value) => {gpu.uniforms.voxel_blend = value;}, () => gpu.uniforms.voxel_blend, "Voxel shading", 0.0, 1.0).addTooltip("Adds shading to individual voxels (zoom in)");
    }
}