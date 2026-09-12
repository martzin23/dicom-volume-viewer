import * as Widgets from './widgets.js';
import * as Vector from './vector.js';
import * as Matrix from './matrix.js';

export function createCameraWidgets(camera, parent) {
    Widgets.setupAddTooltip();

    parent.innerHTML += `
        <div id="group-camera-mode" class="column"></div>
        <div>
            <div id="group-camera-firstperson" class="column"></div>
            <div id="group-camera-orbit" class="column"></div>
        </div>
    `;
    
    Widgets.createSwitch(
        document.getElementById("group-camera-mode"),
        (value) => {
            Widgets.switchAttribute(document.getElementById("group-camera-firstperson").parentNode, value, undefined, "hidden");
            camera.orbit_mode = value;
        },
        ["First person", "Orbit"],
        (camera.orbit_mode) ? "Orbit" : "First person",
        "Camera mode"
    );

    Widgets.createDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.rotation.x = value;}, () => camera.rotation.x, "Horizontal rotation", -Infinity, Infinity, 0.1).addTooltip("Rotation of the camera around the Z axis");
    Widgets.createDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.rotation.y = value;}, () => camera.rotation.y, "Vertical rotation", -90, 90, 0.1).addTooltip("Rotation of the camera around the local X axis");
    Widgets.createSlider(document.getElementById("group-camera-firstperson"), (value) => {camera.speed = value;}, () => camera.speed, "Speed", 0, 10, true).addTooltip("Translation speed of the camera");
    Widgets.createSlider(document.getElementById("group-camera-firstperson"), (value) => {camera.sensitivity = value;}, () => camera.sensitivity, "Sensitivity", 0.01, 0.5, true).addTooltip("Rotation speed of the camera");
    Widgets.createDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.fov = value;}, () => camera.fov, "Field of view", 0, Infinity, 0.005).addTooltip("Angular extent of the observable scene");
    Widgets.createDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.position.x = value;}, () => camera.position.x, "X", -Infinity, Infinity, 0.1).addTooltip("Position of the camera along the X axis");
    Widgets.createDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.position.y = value;}, () => camera.position.y, "Y Position", -Infinity, Infinity, 0.1).addTooltip("Position of the camera along the Y axis");
    Widgets.createDrag(document.getElementById("group-camera-firstperson"), (value) => {camera.position.z = value;}, () => camera.position.z, "Z", -Infinity, Infinity, 0.1).addTooltip("Position of the camera along the Z axis");
    
    Widgets.createDrag(document.getElementById("group-camera-orbit"), (value) => {camera.position = Vector.add(Vector.mul(Matrix.rot2dir(camera.rotation.x, -camera.rotation.y), -value), camera.orbit_anchor)}, () => Vector.len(Vector.add(camera.position, camera.orbit_anchor)), "Distance", 0, Infinity, 0.1).addTooltip("Distance of the camera from the orbit anchor point");
    Widgets.createDrag(document.getElementById("group-camera-orbit"), (value) => {camera.rotation.x = value; camera.updateOrbit();}, () => camera.rotation.x, "Horizontal angle", -Infinity, Infinity, 0.1).addTooltip("Horizontal angle around the camera orbit anchor");
    Widgets.createDrag(document.getElementById("group-camera-orbit"), (value) => {camera.rotation.y = value; camera.updateOrbit();}, () => camera.rotation.y, "Vertical angle", -90, 90, 0.1).addTooltip("Vertical angle around the camera orbit anchor");
    Widgets.createSlider(document.getElementById("group-camera-orbit"), (value) => {camera.speed = value;}, () => camera.speed, "Speed", 0, 10, true).addTooltip("Translation speed of the camera");
    Widgets.createSlider(document.getElementById("group-camera-orbit"), (value) => {camera.sensitivity = value;}, () => camera.sensitivity, "Sensitivity", 0.01, 0.5, true).addTooltip("Rotation speed of the camera");
    Widgets.createDrag(document.getElementById("group-camera-orbit"), (value) => {camera.fov = value;}, () => camera.fov, "Field of view", 0, Infinity, 0.005).addTooltip("Angular extent of the observable scene");
    Widgets.createDrag(document.getElementById("group-camera-orbit"), (value) => {camera.orbit_anchor.x = value; camera.updateOrbit();}, () => camera.orbit_anchor.x, "X", -Infinity, Infinity, 0.1).addTooltip("Position of the orbit anchor along the X axis");
    Widgets.createDrag(document.getElementById("group-camera-orbit"), (value) => {camera.orbit_anchor.y = value; camera.updateOrbit();}, () => camera.orbit_anchor.y, "Y Orbit anchor", -Infinity, Infinity, 0.1).addTooltip("Position of the orbit anchor along the Y axis");
    Widgets.createDrag(document.getElementById("group-camera-orbit"), (value) => {camera.orbit_anchor.z = value; camera.updateOrbit();}, () => camera.orbit_anchor.z, "Z", -Infinity, Infinity, 0.1).addTooltip("Position of the orbit anchor along the Z axis");
}

export function createControlsInfo(parent) {
    parent.innerHTML += `
        <figure>
            <figcaption>
                <hr>
                <p>Controls (PC)</p>
            </figcaption>
            <div class="row">
                <p class="value">Hold mouse</p>
                <p class="comment">Activate camera control</p>
            </div>
            <div class="row">
                <p class="value">F11</p>
                <p class="comment">Toggle fullscreen</p>
            </div>
            <div class="row">
                <p class="value">Up/Down arrow</p>
                <p class="comment">Change resolution</p>
            </div>
        </figure>
        <figure>
            <figcaption>
                <hr>
                <p>Controls (PC) (Orbit mode)</p>
            </figcaption>
            <div class="row">
                <p class="value">ADQE</p>
                <p class="comment">Rotate</p>
            </div>
            <div class="row">
                <p class="value">WS</p>
                <p class="comment">Zoom</p>
            </div>
            <div class="row">
                <p class="value">Mouse</p>
                <p class="comment">Rotate</p>
            </div>
            <div class="row">
                <p class="value">Scroll</p>
                <p class="comment">Zoom</p>
            </div>
        </figure>
        <figure>
            <figcaption>
                <hr>
                <p>Controls (PC) (First person mode)</p>
            </figcaption>
            <div class="row">
                <p class="value">WASDQE</p>
                <p class="comment">Movement</p>
            </div>
            <div class="row">
                <p class="value">Mouse</p>
                <p class="comment">Rotate</p>
            </div>
            <div class="row">
                <p class="value">Scroll</p>
                <p class="comment">Change camera speed</p>
            </div>
        </figure>
        <figure>
            <figcaption>
                <hr>
                <p>Controls (Mobile)</p>
            </figcaption>
            <div class="row">
                <p class="value">Drag</p>
                <p class="comment">Rotate camera</p>
            </div>
            <div class="row">
                <p class="value">Zoom</p>
                <p class="comment">Move foward/backward</p>
            </div>
        </figure>
    `;
}