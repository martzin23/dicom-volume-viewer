import * as DICOM from "../utility/dicom_parser.js";
import Vector3D from '../math/vector3d.js';
import switchAttribute from '../utility/switch_attribute.js';
import { allDefined } from 'https://ka-f.webawesome.com/webawesome@3.14.0/webawesome.js';
import { createDrag } from '../widgets/drag.js';
import { switchSetIndex } from '../widgets/switch.js';
import { createToggle } from '../widgets/toggle.js';
import { setupAddTooltip } from '../widgets/tooltip.js';
import { createCollapse } from "../widgets/collapse.js";
import { createRange } from '../widgets/range.js';
import { createSlider } from '../widgets/slider.js';
import { createCurve } from '../widgets/curve.js';
import { createButton } from '../widgets/button.js';
import { createSliderRadio } from '../widgets/slider_radio.js';
import { createInfo } from "../widgets/info.js";

export default class GUIManager {
    constructor(canvas, gpu, camera) {
        this.current_tab = 0;
        this.update_event = new CustomEvent('updategui', {bubbles: true, cancelable: true });
        this.triggered = false;
        this.timeout;

        this.setupListeners(canvas);
        this.setupWidgets(gpu, camera);
        this.update_handler = setInterval(() => { this.updateValues(); }, 500);
    }

    isTriggered() {
        return this.triggered;
    }

    trigger(delay = 500) {
        const indicator = document.getElementById("time");
        clearTimeout(this.timeout);
        this.triggered = true;
        indicator.classList.add("fa-play");
        indicator.classList.remove("fa-pause");
        this.timeout = setTimeout(() => {
            this.triggered = false;
            indicator.classList.remove("fa-play");
            indicator.classList.add("fa-pause");
        }, delay);
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

    setupListeners(canvas) {
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach((eventType) => {
            document.addEventListener(eventType, () => {
                const menu = document.getElementById("menu");

                if (!this.isFullscreen() && this.current_tab === null)
                    menu.classList.remove("hidden");
                else if (this.isFullscreen() && this.current_tab === null)
                    menu.classList.add("hidden");
            })
        });

        window.addEventListener('pointerdown', (event) => {
            this.trigger(50);
        });

        window.addEventListener("pointermove", (event) => {
            if (event.pressure !== 0)
                this.trigger();
            // console.log(event);
        })
        
        canvas.addEventListener("wheel", (event) => {
            this.trigger();
        });
    }

    async setupWidgets(gpu, camera) {
        setupAddTooltip();
        await allDefined();
        document.documentElement.classList.toggle('wa-dark');
        const menu = document.getElementById("menu");

        const group_general = createCollapse("General", "fa-gear", true);
        group_general.appendChild(createToggle((value) => { this.toggleFullscreen(); }, () => this.isFullscreen(), "Fullscreen"));
        group_general.appendChild(createSliderRadio((value) => {gpu.uniforms.render_scale = value; gpu.synchronize();},() => gpu.uniforms.render_scale , "Resolution", [0.1, 0.25, 0.5, 1.0], ["Low", "Quarter", "Half", "Full"]));
        menu.appendChild(group_general);
        
        const group_file = createCollapse("File", "fa-file", true);
        const element_info = createInfo("File(s) info", ["Modality", "RescaleType", "Value Range", "Volume Size", "Physical Size"], []);
        const element_input = document.createElement("input");
        element_input.type = "file";
        element_input.setAttribute("webkitdirectory", true);
        element_input.setAttribute("multiple", true);
        element_input.addEventListener("change", async (event) => {
            const files = event.target.files;
            const volume = await DICOM.dicomToVolume(files);
            // const volume = await DICOM.dicomdirToVolume(files);
            gpu.reloadImage(volume);
            camera.position = new Vector3D(volume.size.x, volume.size.x, volume.size.x);
            camera.updateOrbit();
            element_info.updateValues([volume.modality, volume.rescale, `(${volume.range.x}, ${volume.range.y})`, `${volume.size.x} x ${volume.size.y} x ${volume.size.z}`, `${Math.round(volume.dimensions.x)}mm x ${Math.round(volume.dimensions.y)}mm x ${Math.round(volume.dimensions.z)}mm`])
            this.trigger(2000);
        });
        group_file.appendChild(element_input);
        group_file.appendChild(element_info);
        menu.appendChild(group_file);
        
        const group_grid = createCollapse("Grid", "fa-cubes", true);
        group_grid.appendChild(createSliderRadio((value) => {gpu.uniforms.grid_scale = value;}, () => gpu.uniforms.grid_scale, "Voxel multiplier", [0.5, 1.0, 2.0, 4.0, 8.0], ["0.5x", "1x", "2x", "4x", "8x"]));
        group_grid.appendChild(createDrag((value) => {gpu.uniforms.grid_stretch.x = value;}, () => gpu.uniforms.grid_stretch.x, "Grid stretch X", 0, Infinity, 0.01));
        group_grid.appendChild(createDrag((value) => {gpu.uniforms.grid_stretch.y = value;}, () => gpu.uniforms.grid_stretch.y, "Grid stretch Y", 0, Infinity, 0.01));
        group_grid.appendChild(createDrag((value) => {gpu.uniforms.grid_stretch.z = value;}, () => gpu.uniforms.grid_stretch.z, "Grid stretch Z", 0, Infinity, 0.01));
        menu.appendChild(group_grid);
        
        const group_density = createCollapse("Density", "fa-area-chart", true);
            const element_curve = createCurve("test", (data) => {
                data.forEach((element, index) => {
                    gpu.uniforms.map[index] = element;
                });
                gpu.uniforms.map_size = data.length;
                this.trigger(50);
            })
            group_density.appendChild(element_curve);
            element_curve.setPower(gpu.uniforms.power);
            group_density.appendChild(createSlider((value) => {gpu.uniforms.strength = value;}, () => gpu.uniforms.strength, "Strength", 0.001, 0.1));
            group_density.appendChild(createSlider((value) => {gpu.uniforms.power = value; element_curve.setPower(value);}, () => gpu.uniforms.power, "Power", 1, 10));
            group_density.appendChild(createDrag((value) => {gpu.uniforms.range_min = value;}, () => gpu.uniforms.range_min, "Range Min", -Infinity, Infinity, 1));
            group_density.appendChild(createDrag((value) => {gpu.uniforms.range_max = value;}, () => gpu.uniforms.range_max, "Range Max", -Infinity, Infinity, 1));
            group_density.appendChild(document.createElement("hr"));
            const button_row = document.createElement("div");
                button_row.className = "row gap-medium align-center";
                // button_row.appendChild(document.createElementc);
                const presets_text = document.createElement("p");
                presets_text.innerText = "Presets";
                presets_text.addEventListener("click", (event) => {element_curve.printPreset(gpu);})
                button_row.appendChild(presets_text);
                button_row.appendChild(createButton(() => {element_curve.setPreset(0, gpu);}, "Bones"));
                button_row.appendChild(createButton(() => {element_curve.setPreset(1, gpu);}, "Lungs"));
                button_row.appendChild(createButton(() => {element_curve.setPreset(2, gpu);}, "Heart"));
                button_row.appendChild(createButton(() => {element_curve.setPreset(4, gpu);}, "Vein"));
                button_row.appendChild(createButton(() => {element_curve.setPreset(3, gpu);}, "All"));
            group_density.appendChild(button_row);
        menu.appendChild(group_density);

        const group_slice = createCollapse("Slice", "fa-cube", true);
        group_slice.appendChild(createRange((value) => {gpu.uniforms.slice_x = value;}, () => gpu.uniforms.slice_x, "Slice X", 0, 1));
        group_slice.appendChild(createRange((value) => {gpu.uniforms.slice_y = value;}, () => gpu.uniforms.slice_y, "Slice Y", 0, 1));
        group_slice.appendChild(createRange((value) => {gpu.uniforms.slice_z = value;}, () => gpu.uniforms.slice_z, "Slice Z", 0, 1));
        menu.appendChild(group_slice);
    }
}