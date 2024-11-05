const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
    alert('WebGL not supported');
}

// Vertex and fragment shader sources
const vertexShaderSource = `
    attribute vec3 position;
    uniform float morphFactor;
    uniform mat3 rotationMatrix;
    void main() {
        vec3 shape1 = vec3(0.5, 0.5, 0.0);
        vec3 shape2 = vec3(-0.5, -0.5, 0.0);
        vec3 morphedPosition = mix(shape1, shape2, morphFactor);
        gl_Position = vec4(rotationMatrix * morphedPosition, 1.0);
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(0.5, 0.7, 1.0, 1.0); // light blue color
    }
`;

// Compile shaders and create program
function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
}

// Use the program and get locations
gl.useProgram(program);
const positionLocation = gl.getAttribLocation(program, 'position');
const morphFactorLoc = gl.getUniformLocation(program, 'morphFactor');
const rotationMatrixLoc = gl.getUniformLocation(program, 'rotationMatrix');

// Define vertex positions for a basic shape (e.g., two triangles forming a square)
const vertices = new Float32Array([
    -0.5, -0.5, 0.0,
     0.5, -0.5, 0.0,
     0.5,  0.5, 0.0,
    -0.5,  0.5, 0.0
]);

// Set up the buffer
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

// Control variables
let isRotating = false;
let isMorphing = false;
let rotationAxis = [0, 0, 1]; // Default rotation around z-axis
let t = 0.0; // Morph factor
let direction = 0.01; // Morphing speed

// Event listeners for buttons
document.getElementById('toggle-rotation').addEventListener('click', () => {
    isRotating = !isRotating;
});
document.getElementById('toggle-morph').addEventListener('click', () => {
    isMorphing = !isMorphing;
});
document.getElementById('rotate-x').addEventListener('click', () => {
    rotationAxis = [1, 0, 0];
});
document.getElementById('rotate-y').addEventListener('click', () => {
    rotationAxis = [0, 1, 0];
});
document.getElementById('rotate-z').addEventListener('click', () => {
    rotationAxis = [0, 0, 1];
});

// Utility function to create a rotation matrix around x, y, or z axis
function createRotationMatrix(axis, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    if (axis[0] === 1) return [1, 0, 0, 0, c, -s, 0, s, c];
    if (axis[1] === 1) return [c, 0, s, 0, 1, 0, -s, 0, c];
    if (axis[2] === 1) return [c, -s, 0, s, c, 0, 0, 0, 1];
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

// Main animation loop
function animate() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Handle morphing
    if (isMorphing) {
        t += direction;
        if (t > 1.0 || t < 0.0) direction *= -1; // Reverse direction at boundaries
    }
    gl.uniform1f(morphFactorLoc, t);

    // Handle rotation
    let angle = performance.now() / 1000;
    if (isRotating && rotationAxis.some(a => a !== 0)) {
        const rotationMatrix = createRotationMatrix(rotationAxis, angle * 0.01);
        gl.uniformMatrix3fv(rotationMatrixLoc, false, rotationMatrix);
    } else {
        gl.uniformMatrix3fv(rotationMatrixLoc, false, createRotationMatrix([0, 0, 1], 0));
    }

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); // Draw the morphed shape as a square

    requestAnimationFrame(animate);
}

// Start animation loop
animate();

