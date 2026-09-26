#version 300 es
precision highp float;
precision highp sampler3D;

struct Point {
    vec3 value;
    float factor;
};

layout(std140) uniform UniformBlock {
    vec2 canvas_size;
    vec2 buffer_size;

    vec3 grid_size;
    float render_scale;

    mat4 camera_rotation;
    vec3 camera_position;
    float fov;

    vec3 grid_stretch;
    float grid_scale;

    float gamma;
    float strength;
    float focus;
    float slope;

    vec2 slice_forward;
    vec2 slice_side;

    vec2 slice_up;
    float padding_a;
    float map_size;

    Point map[16];
} uniforms;

struct Ray {
    vec3 origin;
    vec3 direction;
    vec3 inverse;
};

uniform sampler3D volume_texture;
in vec2 texture_coordinates;
out vec4 output_color;

vec3 traverse(Ray ray);
vec2 intersect(Ray ray, vec3 p_min, vec3 p_max);
vec3 getDensity(vec3 position);
vec3 sampleGradient(float factor);

void main() {
    float aspect_ratio = uniforms.canvas_size.y / uniforms.canvas_size.x;
    vec2 centered_coordinates = (texture_coordinates - 0.5) * 2.0 * vec2(1.0, aspect_ratio);
    
    Ray camera_ray;
    camera_ray.origin = uniforms.camera_position;
    camera_ray.origin *= uniforms.grid_scale;
    camera_ray.origin += (vec3(uniforms.slice_side.y, uniforms.slice_forward.y, uniforms.slice_up.y) + vec3(uniforms.slice_side.x, uniforms.slice_forward.x, uniforms.slice_up.x)) * (uniforms.grid_size * uniforms.grid_scale * uniforms.grid_stretch * vec3(0.5));
    camera_ray.direction = (uniforms.camera_rotation * vec4(normalize(vec3(centered_coordinates.x * uniforms.fov, 1.0, centered_coordinates.y * uniforms.fov)), 1.0)).xyz;
    camera_ray.inverse = 1.0 / camera_ray.direction;

    vec3 density = traverse(camera_ray);
    vec3 color = vec3(1.0 - pow(2.71828 ,-density.x), 1.0 - pow(2.71828 ,-density.y), 1.0 - pow(2.71828 ,-density.z));
    output_color = vec4(color, (color.x + color.y + color.z) / 3.0);
}

vec3 traverse(Ray ray) {
    vec3 density = vec3(0.0);
    vec3 slice_start = floor(vec3(vec3(uniforms.slice_side.x, uniforms.slice_forward.x, uniforms.slice_up.x) * uniforms.grid_size * uniforms.grid_scale * uniforms.grid_stretch));
    vec3 slice_end = floor(vec3(vec3(uniforms.slice_side.y, uniforms.slice_forward.y, uniforms.slice_up.y) * uniforms.grid_size * uniforms.grid_scale * uniforms.grid_stretch));
    vec2 bbox_t = intersect(ray, slice_start, slice_end);
    if (bbox_t.x > bbox_t.y)
        return vec3(0.0);

    vec3 position = floor(ray.origin + ray.direction * (bbox_t.x + 0.01));
    vec3 march = sign(ray.inverse);
    vec3 delta = (ray.inverse) * march;
    vec3 select = march * 0.5 + 0.5;
    vec3 planes = position + select;
    vec3 t = (planes - ray.origin) * ray.inverse;

    density += getDensity(position);
    int counter = 10000;
    while (counter > 0) {
        counter--;

        if (t.x < t.y) {
            if (t.x < t.z) {
                position.x += march.x;
                t.x += delta.x;
            } else {
                position.z += march.z;
                t.z += delta.z;
            }
        } else {
            if (t.y < t.z) {
                position.y += march.y;
                t.y += delta.y;
            } else {
                position.z += march.z;
                t.z += delta.z;
            }
        }
        density += getDensity(position);

        if (position.x > slice_end.x || position.x < slice_start.x || position.y > slice_end.y || position.y < slice_start.y || position.z > slice_end.z || position.z < slice_start.z)
            return density;
    }

    return density;
}

vec2 intersect(Ray ray, vec3 p_min, vec3 p_max) {
    vec2 t = vec2(0.0, 1.0 / 0.0);
    for (int i = 0; i < 3; i++) {
        float t1 = (p_min[i] - ray.origin[i]) * ray.inverse[i];
        float t2 = (p_max[i] - ray.origin[i]) * ray.inverse[i];
        t.x = max(t.x, min(t1, t2));
        t.y = min(t.y, max(t1, t2));
    }
    return t;
}

vec3 getDensity(vec3 position) {
    vec3 coordinate = position / (uniforms.grid_size * uniforms.grid_scale * uniforms.grid_stretch);
    float value = texture(volume_texture, coordinate).r;
    // return vec3(uniforms.strength * pow(value, uniforms.gamma));

    float normalized = clamp((value + 1024.0) / (1024.0 + 3071.0), 0.0, 1.0);

    return sampleGradient(normalized) * uniforms.strength;
    // return uniforms.map[1].value;
    // return vec3(1.0, 1.0, 1.0);

    float smoothness = max(uniforms.slope, 0.0001);
    float e = 2.71828;
    float diff = normalized - uniforms.focus;
    float focused = pow(e, -(diff * diff) / (smoothness * smoothness * smoothness));
    vec3 color = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 1.0, 1.0), focused * 2.0 - 1.0);
    return vec3(uniforms.strength * pow(focused, uniforms.gamma)) * color;
}

vec3 sampleGradient(float factor) {
    if (factor < uniforms.map[0].factor || factor > uniforms.map[int(uniforms.map_size) - 1].factor || uniforms.map_size < 2.0) return vec3(0.0);
    int index = 0;
    for (int i=0; i<int(uniforms.map_size); i++) {
        if (factor < uniforms.map[i].factor) {
            index = i - 1;
            break;
        }
    }
    float blend = (factor - uniforms.map[index].factor) / (uniforms.map[index + 1].factor - uniforms.map[index].factor);
    vec3 first = uniforms.map[index].value;
    vec3 second = uniforms.map[index + 1].value;
    return mix(first, second, clamp(blend, 0.0, 1.0));
}