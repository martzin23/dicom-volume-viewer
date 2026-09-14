#version 300 es
precision highp float;
precision highp sampler3D;

layout(std140) uniform UniformBlock {
    vec2 canvas_size;
    vec2 buffer_size;

    vec3 grid_size;
    float render_scale;

    mat4 camera_rotation;
    vec3 camera_position;
    float fov;

    vec3 grid_scale;
    float shading_mode;

    float height_offset;
    float height_multiplier;
    float height_gamma;
    float height_invert;

    float fade_blend;
    float voxel_blend;
    float grayscale_blend;
    float normals_epsilon;
} uniforms;

struct Ray {
    vec3 origin;
    vec3 direction;
    vec3 inverse;
};
struct Data {
    vec3 position;
    bool collided;
    int marches;
};

uniform sampler3D volume_texture;
in vec2 texture_coordinates;
out vec4 output_color;

vec3 traverse(Ray ray, out vec3 normal, inout vec3 density);
vec2 intersect(Ray ray, vec3 p_min, vec3 p_max);
vec3 getNormal(vec3 position, float epsilon);
float getHeight(vec3 position);
bool isFilled(vec3 position);
float getAverageValue(vec3 position);

void main() {
    float aspect_ratio = uniforms.canvas_size.y / uniforms.canvas_size.x;
    vec2 centered_coordinates = (texture_coordinates - 0.5) * 2.0 * vec2(1.0, aspect_ratio);
    
    Ray camera_ray;
    camera_ray.origin = uniforms.camera_position;
    camera_ray.origin *= uniforms.grid_scale;
    camera_ray.origin += uniforms.grid_size * vec3(0.5, 0.5, 0.0) * uniforms.grid_scale;
    camera_ray.direction = (uniforms.camera_rotation * vec4(normalize(vec3(centered_coordinates.x * uniforms.fov, 1.0, centered_coordinates.y * uniforms.fov)), 1.0)).xyz;
    camera_ray.inverse = 1.0 / camera_ray.direction;

    vec3 density = vec3(0.0);
    vec3 voxel_normal;
    vec3 position = traverse(camera_ray, voxel_normal, density);
    vec3 sun = normalize(vec3(1.0, 0.5, 0.0));
    float voxel = mix(1.0, abs(dot(voxel_normal, normalize(vec3(1.0, 0.5, 0.75)))), uniforms.voxel_blend);
    // if (position.x != -1.0) {
    //     // if (uniforms.shading_mode == 1.0) {
    //     //     float height = position.z;
    //     //     vec3 normal = getNormal(position, uniforms.normals_epsilon);
    //     //     float diffuse = dot(normal, sun) * 0.5 + 0.5;
    //     //     output_color = vec4(vec3(diffuse * height * voxel), 1.0);
    //     // } else if (uniforms.shading_mode == 2.0) {
    //     //     vec3 normal = getNormal(position, uniforms.normals_epsilon) * 0.5 + 0.5;
    //     //     output_color = vec4(normal * voxel, 1.0);
    //     // } else if (uniforms.shading_mode == 3.0) {
    //     //     vec3 color = vec3(position.z);
    //     //     float value = (color.r + color.g + color.b) / 3.0;
    //     //     output_color = vec4(mix(color, vec3(value), uniforms.grayscale_blend) * voxel, 1.0);
    //     // } else {
    //     //     float height = position.z;
    //     //     output_color = vec4(vec3(voxel * height), 1.0);
    //     // }
    //     vec3 coordinate = position / (uniforms.grid_size * uniforms.grid_scale);
    //     float value = texture(volume_texture, coordinate).r;
    //     output_color = vec4(coordinate, 1.0);
    //     output_color = vec4(vec3(value), 1.0);
    //     // output_color = vec4(position, 1.0);
    // } else {
    //     output_color = vec4(1.0 - pow(2.71828 ,-density.x), 1.0 - pow(2.71828 ,-density.y), 1.0 - pow(2.71828 ,-density.z), 1.0);
    // }
        output_color = vec4(1.0 - pow(2.71828 ,-density.x), 1.0 - pow(2.71828 ,-density.y), 1.0 - pow(2.71828 ,-density.z), 1.0);
}

vec3 traverse(Ray ray, out vec3 normal, inout vec3 density) {
    normal = vec3(0.0, 0.0, 1.0);

    vec2 bbox_t = intersect(ray, vec3(0.0), uniforms.grid_size * uniforms.grid_scale);
    if (bbox_t.x > bbox_t.y)
        return vec3(-1.0);

    vec3 position = floor(ray.origin + ray.direction * (bbox_t.x + 0.01));
    vec3 march = sign(ray.inverse);
    vec3 delta = (ray.inverse) * march;
    vec3 select = march * 0.5 + 0.5;
    vec3 planes = position + select;
    vec3 limit = floor(uniforms.grid_size * uniforms.grid_scale);
    vec3 t = (planes - ray.origin) * ray.inverse;

    int axis;
    int counter = 10000;
    while (counter > 0) {
        counter--;

        if (t.x < t.y) {
            if (t.x < t.z) {
                position.x += march.x;
                t.x += delta.x;
                axis = 0;
            } else {
                position.z += march.z;
                t.z += delta.z;
                axis = 2;
            }
        } else {
            if (t.y < t.z) {
                position.y += march.y;
                t.y += delta.y;
                axis = 1;
            } else {
                position.z += march.z;
                t.z += delta.z;
                axis = 2;
            }
        }

        // if (isFilled(position)) {
        //     vec3 mask = vec3(0.0);
        //     mask[axis] = 1.0;
        //     normal = mask;
        //     // vec3 position = ray.origin + ray.direction * (dot(t, mask) - dot(delta, mask) + 0.01);
        //     // vec3 normal = getNormal(position, uniforms.normals_epsilon);
        //     // bool top = position.z > getHeight(position) - 1.0;
        //     // if (!(dot(ray.direction, normal) < -0.5)) {
        //         // density += (top ? 0.1 : 0.01) * ((normal + 1.0) * 0.5);
        //     // }
            
        //     vec3 coordinate = position / (uniforms.grid_size * uniforms.grid_scale);
        //     float value = texture(volume_texture, coordinate).r;
        //     density += 0.01;
        //     // return ray.origin + ray.direction * (dot(t, mask) - dot(delta, mask) + 0.01);
        // }
        vec3 coordinate = position / (uniforms.grid_size * uniforms.grid_scale);
        float value = texture(volume_texture, coordinate).r;
        // float value = getAverageValue(position);
        float normalized = clamp((value + 1024.0) / (1024.0 + 3071.0), 0.0, 1.0);
        // density += 0.03 * value;
        // density += 0.01 * clamp(pow(value, 0.5) - 1.0, 0.0, 1.0);
        density += 0.01 * pow(normalized, 5.0) * 25.0;

        if (position.x > limit.x || position.x < 0.0 || position.y > limit.y || position.y < 0.0 || position.z > limit.z || position.z < 0.0)
            return vec3(-1.0);
    }
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

float getHeight(vec3 position) {
    return position.z;
}

float getAverageValue(vec3 position) {
    int radius = 1;
    float value = 0.0;
    for (int x=-1; x<radius+1; x++) {
        for (int y=-1; y<radius+1; y++) {
            for (int z=-1; z<radius+1; z++) {
                vec3 coordinate = (position + vec3(x, y, z)) / (uniforms.grid_size * uniforms.grid_scale);
                value += texture(volume_texture, coordinate).r;
            }
        }
    }
    return value / pow(float(radius) * 2.0 + 1.0, 3.0);
}

bool isFilled(vec3 position) {
    vec3 coordinate = position / (uniforms.grid_size * uniforms.grid_scale);
    float value = texture(volume_texture, coordinate).r;
    return value >= 1.0;
}

vec3 getNormal(vec3 position, float epsilon) {
    vec3 normal;
	normal.x = getHeight(position + vec3(epsilon, 0.0, 0.0)) - getHeight(position - vec3(epsilon, 0.0, 0.0));
	normal.y = getHeight(position + vec3(0.0, epsilon, 0.0)) - getHeight(position - vec3(0.0, epsilon, 0.0));
	normal.z = 2.0 * epsilon;
    return normalize(normal / vec3(2.0 * epsilon));
}
