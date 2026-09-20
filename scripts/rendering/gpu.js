import Matrix from "../math/matrix.js";
import Vector from "../math/vector.js";
import Vector2D from "../math/vector2d.js";
import Vector3D from "../math/vector3d.js";
import * as WebGL from "./webgl.js";

export default class WebGLManager {
    static async initialize(canvas) {
        const fragment_shader_code = await (await fetch('./scripts/shaders/fragment.glsl')).text();
        const width = 16, height = 16, depth = 16;
        const data = new Float32Array(width * height * depth);
        for (let i=0; i<width * height * depth; i++)
            data[i] = Math.random() * 2.0;
        const volume_texture = new WebGL.Texture(data, width, height, depth);

        return new WebGLManager(canvas, fragment_shader_code, volume_texture);
    }

    constructor(canvas, fragment_shader_code, volume_texture) {
        this.canvas = canvas;
        this.vertex_buffer;
        this.vertex_location;
        this.uniform_buffer;
        this.program;
        this.base_render_size = new Vector2D(2560, 1440);
        this.volume_texture = volume_texture;

        this.gl = this.canvas.getContext("webgl2");
        if (!this.gl)
            throw new ReferenceError("This device or browser does not support WebGL2.");

        const ext = this.gl.getExtension('OES_texture_float_linear');
        if (!ext)
            throw new Error('Failed to get extension: "OES_texture_float_linear"');

        window.addEventListener("resize", () => {this.synchronize();});
        this.canvas.addEventListener("resize", () => {this.synchronize();});

        this.uniforms = {
            canvas_size: new Vector2D(this.base_render_size.x, this.base_render_size.y),
            buffer_size: new Vector2D(this.base_render_size.x, this.base_render_size.y),

            grid_size: new Vector3D(this.volume_texture.width, this.volume_texture.height, this.volume_texture.depth),
            render_scale: 1,
            
            camera_rotation: new Matrix(1.0),
            camera_position: new Vector3D(0.0, -3.0, 0.0),
            fov: 1.0,
            
            grid_stretch: new Vector3D(1.0, this.volume_texture.width / this.volume_texture.height, this.volume_texture.width / this.volume_texture.depth),
            grid_scale: 1.0,

            gamma: 1.0,
            strength: 0.01,
            focus: 1.0,
            slope: 0.0,

            slice_width: new Vector3D(1.0, 1.0, 1.0),
            padding_a: 0.0,

            slice_offset: new Vector3D(0.5, 0.5, 0.5),
            padding_b: 0.0,
        };

        const vertices = new Float32Array([
            1.0, 1.0,
            1.0, -1.0,
            -1.0, -1.0,
            1.0, 1.0,
            -1.0, -1.0,
            -1.0, 1.0
        ]);

        this.vertex_buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        const vertex_shader_code = `#version 300 es
            precision mediump float;
            in vec2 vertex_position;
            out vec2 texture_coordinates;

            void main() {
                texture_coordinates = vertex_position * 0.5 + 0.5;
                gl_Position = vec4(vertex_position, 0.0, 1.0);
            }
        `;

        this.program = WebGL.createProgram(this.gl, vertex_shader_code, fragment_shader_code);

        const uniform_binding_number = 1;
        const uniform_array = new Float32Array(packUniforms(this.uniforms));
        this.gl.uniformBlockBinding(this.program, this.gl.getUniformBlockIndex(this.program, "UniformBlock"), uniform_binding_number);

        this.uniform_buffer = this.gl.createBuffer();
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, uniform_binding_number, this.uniform_buffer);
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, uniform_array.byteLength, this.gl.DYNAMIC_DRAW);

        this.vertex_location = this.gl.getAttribLocation(this.program, "vertex_position");
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffer);
        this.gl.vertexAttribPointer(this.vertex_location, 2, this.gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);

        this.volume_texture.setup(this.gl, "volume_texture", this.program, 0, "LINEAR", "CLAMP_TO_EDGE", "R32F");

        this.synchronize();
    }

    render() {
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.uniform_buffer);
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, new Float32Array(packUniforms(this.uniforms)), this.gl.DYNAMIC_DRAW);

        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.viewport(0, 0, this.uniforms.canvas_size.x / this.uniforms.render_scale, this.uniforms.canvas_size.y / this.uniforms.render_scale);

        this.gl.useProgram(this.program);
        this.gl.enableVertexAttribArray(this.vertex_location);
        this.volume_texture.bind(this.gl);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    synchronize() {
        const width = Math.min(this.canvas.clientWidth, this.base_render_size.x);
        const height = Math.min(this.canvas.clientHeight, this.base_render_size.y);
        this.uniforms.canvas_size = new Vector2D(width, height);
        this.canvas.width = width / this.uniforms.render_scale;
        this.canvas.height = height / this.uniforms.render_scale;
    }

    reloadImage(volume) {
        this.volume_texture.destroy(this.gl);
        this.volume_texture = new WebGL.Texture(volume.data, volume.rows, volume.columns, volume.depth);
        this.volume_texture.setup(this.gl, "volume_texture", this.program, 0, "NEAREST", "CLAMP_TO_EDGE", "R32F");
        this.uniforms.grid_size.x = this.volume_texture.width;
        this.uniforms.grid_size.y = this.volume_texture.height;
        this.uniforms.grid_size.z = this.volume_texture.depth;
        this.uniforms.grid_stretch = new Vector3D(1.0, this.volume_texture.width / this.volume_texture.height, this.volume_texture.width / this.volume_texture.depth);
    }
}

function packUniforms(data) {
    let array = [];
    for (const el in data) {
        const value = data[el]
        if (value instanceof Vector)
            array.push(value.array());
        else if (value instanceof Matrix)
            array.push(value.array());
        else
            array.push(value);
    }
    return array.flat();
}
