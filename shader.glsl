// Vertex Shader
attribute vec2 aVertexPosition;
uniform vec2 iResolution; // Uniform for resolution


void main(void) {
    gl_Position = vec4(aVertexPosition, 0, 1.0);
}

// Fragment Shader
precision highp float;
uniform vec2 iResolution; // Uniform for resolution
uniform float iTime; // Uniform for time
uniform vec2 iMouse; // Uniform for mouse position

#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURF_DIST 0.001
#define TAU 6.283185
#define PI 3.14
#define S smoothstep

mat2 Rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}


float sdSphere(vec3 p, float r) {
    return length(p) - r;
}
float sdBoxWithWaves(vec3 p, vec3 s, float wavelength, float amplitude) {
    p = abs(p) - s;

    // Apply waviness to the edges
    p.x += amplitude * sin(p.y * 2.0 * PI / wavelength + iTime * 0.5);
    p.y += amplitude * sin(p.z * 2.0 * PI / wavelength + iTime * 0.5);
    p.z += amplitude * cos(p.x * 2.0 * PI / wavelength + iTime * 0.5);

    return length(max(p, 0.0)) + min(max(p.x, max(p.y, p.z)), 0.0);
}
float GetDist(vec3 p) {
    float box = sdBoxWithWaves(p, vec3(1.0), 1.0, 0.1);
    float sphere = sdSphere(p, 1.0);
    //create a gyroid
    float gyroid = dot(sin(p), cos(p)) + dot(cos(p), sin(p)) + dot(sin(p), cos(p));
    gyroid = gyroid / 9.0+sin(0.01-(PI*0.01));
    float modulation = sin(iTime*0.1)*0.5;
    //modulate the gyroid to the constraints of the sphere and box
    float d = smoothstep(tan(box), gyroid, .5);

    return d;
}

float RayMarch(vec3 ro, vec3 rd) {
    float dO = 0.0;
    
    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * dO;
        float dS = GetDist(p);
        dO += dS;
        if (dO > MAX_DIST || abs(dS) < SURF_DIST) break;
    }
    
    return dO;
}

vec3 GetNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    vec3 n = GetDist(p) - 
        vec3(GetDist(p - e.xyy), GetDist(p - e.yxy), GetDist(p - e.yyx));
    
    return normalize(n);
}

vec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 f = normalize(p - l);  // Invert the direction vector
    vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
    vec3 u = cross(f, r);
    vec3 c = f * z;
    vec3 i = c + uv.x * r + uv.y * u;
    return normalize(i);
}

void main(void) {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    vec2 m = iMouse.xy / iResolution.xy;

    vec3 ro = vec3(0.1, 0.1, 0.1);  // Adjust the position as needed
    ro.yz *= Rot(-m.y * PI + 1.0);
    ro.xz *= Rot(-m.x * TAU);
    
    vec3 rd = GetRayDir(uv, ro, vec3(0.0, 0.0, 0.0), 1.0);
    vec3 col = vec3(sin(0.2), cos(0.2), sin(0.2));
   
    float d = RayMarch(ro, rd);

    if (d < MAX_DIST) {
        vec3 p = ro + rd * d;
        vec3 n = GetNormal(p);
        vec3 r = reflect(rd, n);

        // Calculate gyroid value
        float gyroid = dot(sin(p / PI), cos(p - iTime)) + dot(cos(p), sin(p)) + dot(sin(p), cos(p / PI));
        gyroid = gyroid / 30.0;

        // Modulate the color based on the gyroid value
        col *= mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), smoothstep(-0.5, 0.5, gyroid));

        // Lighting calculation based on the gyroid value
        float dif = dot(n, normalize(vec3(1.0, 2.0, 3.0))) * 0.5 + 0.5;
        col *= dif;
    }
    
    col = pow(col, vec3(0.4545)); // gamma correction
    
    gl_FragColor = vec4(col, 1.0);
}