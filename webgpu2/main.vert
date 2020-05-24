#version 450
layout(set = 0, binding = 0) uniform Uniforms {
    mat4 modelViewProjectionMatrix;
    float xzAngle;
    float xwAngle;
    float ywAngle;
} uniforms;

layout(location = 0) in vec2 triangle;
layout(location = 1) in vec4 position;
layout(location = 2) in vec4 color;

layout(location = 0) out vec4 fragColor;

void main() {
    float a1 = uniforms.xzAngle;
    float a2 = uniforms.xwAngle;
    float a3 = uniforms.ywAngle;

    float tx = position.x * cos(a1) - position.z * sin(a1);
    float ty = position.y;
    float tz = position.x * sin(a1) + position.z * cos(a1);
    float tw = position.w;

    float t = tx * cos(a2) - tw * sin(a2);
    tw = tx * sin(a2) + tw * cos(a2);
    tx = t;

    t =  ty * cos(a3) - tw * sin(a3);
    tw = ty * sin(a3) + tw * cos(a3);
    ty = t;

    gl_Position = uniforms.modelViewProjectionMatrix *
        vec4(tx, ty, tz, 1.0);
    gl_Position.xy += triangle * 0.003;
    fragColor = color;
}
