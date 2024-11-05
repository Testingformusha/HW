"use strict";

var gl;
var program;
var t = 0.0;
var morphing = false;
var intervalId;
var direction = 1;
var angleX = 0, angleY = 0, angleZ = 0;

var isRotateX = false, isRotateY = false, isRotateZ = false;
var buffer1, buffer2, colorBuffer1, colorBuffer2;

init();

function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Define vertices for two shapes (cubes)
    var cube1 = [
        vec4(-0.5, -0.5, -0.5, 1.0), vec4(-0.5, -0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0), vec4(-0.5,  0.5, -0.5, 1.0),
        vec4( 0.5, -0.5, -0.5, 1.0), vec4( 0.5, -0.5,  0.5, 1.0),
        vec4( 0.5,  0.5,  0.5, 1.0), vec4( 0.5,  0.5, -0.5, 1.0)
    ];
    var cube2 = [
        vec4(-0.25, -0.25, -0.25, 1.0), vec4(-0.25, -0.25,  0.25, 1.0),
        vec4(-0.25,  0.25,  0.25, 1.0), vec4(-0.25,  0.25, -0.25, 1.0),
        vec4( 0.25, -0.25, -0.25, 1.0), vec4( 0.25, -0.25,  0.25, 1.0),
        vec4( 0.25,  0.25,  0.25, 1.0), vec4( 0.25,  0.25, -0.25, 1.0)
    ];

    // Color data for each vertex
    var colors1 = [
        vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 1.0, 0.0, 1.0),
        vec4(0.0, 0.0, 1.0, 1.0), vec4(1.0, 1.0, 0.0, 1.0),
        vec4(0.0, 1.0, 1.0, 1.0), vec4(1.0, 0.0, 1.0, 1.0),
        vec4(0.5, 0.5, 0.5, 1.0), vec4(1.0, 0.5, 0.0, 1.0)
    ];
    var colors2 = [
        vec4(0.5, 0.0, 0.0, 1.0), vec4(0.0, 0.5, 0.0, 1.0),
        vec4(0.0, 0.0, 0.5, 1.0), vec4(0.5, 0.5, 0.0, 1.0),
        vec4(0.0, 0.5, 0.5, 1.0), vec4(0.5, 0.0, 0.5, 1.0),
        vec4(0.3, 0.3, 0.3, 1.0), vec4(0.5, 0.5, 0.0, 1.0)
    ];

    // Load cube vertices into buffers
    buffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cube1), gl.STATIC_DRAW);

    buffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cube2), gl.STATIC_DRAW);

    // Load color data into buffers
    colorBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors1), gl.STATIC_DRAW);

    colorBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors2), gl.STATIC_DRAW);

    // Set up rotation toggle buttons
    setupRotationButtons();
    setupToggleMorphButton();

    render();
}

function setupRotationButtons() {
    document.getElementById('rotateXButton').onclick = function () {
        isRotateX = !isRotateX;
        toggleButtonColor(this, isRotateX);
    };
    document.getElementById('rotateYButton').onclick = function () {
        isRotateY = !isRotateY;
        toggleButtonColor(this, isRotateY);
    };
    document.getElementById('rotateZButton').onclick = function () {
        isRotateZ = !isRotateZ;
        toggleButtonColor(this, isRotateZ);
    };
}

function setupToggleMorphButton() {
    document.getElementById('toggle').onclick = function () {
        morphing = !morphing;
        if (morphing) {
            intervalId = setInterval(() => {
                t += direction * 0.01;
                if (t >= 1.0 || t <= 0.0) direction *= -1;
                render();
            }, 100);
        } else {
            clearInterval(intervalId);
        }
    };
}

function toggleButtonColor(button, isActive) {
    button.style.backgroundColor = isActive ? 'green' : 'red';
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Apply rotation based on angle parameters
    if (isRotateX) angleX += 1;
    if (isRotateY) angleY += 1;
    if (isRotateZ) angleZ += 1;

    var modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, rotateX(angleX));
    modelViewMatrix = mult(modelViewMatrix, rotateY(angleY));
    modelViewMatrix = mult(modelViewMatrix, rotateZ(angleZ));

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniform1f(gl.getUniformLocation(program, "uMorph"), t);

    // Bind vertices and colors for morphing shapes
    bindShapeBuffers(buffer1, colorBuffer1, "aPosition1");
    bindShapeBuffers(buffer2, colorBuffer2, "aPosition2");

    drawCube();
}

function bindShapeBuffers(positionBuffer, colorBuffer, positionAttribute) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    var positionLoc = gl.getAttribLocation(program, positionAttribute);
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);
}

function drawCube() {
    const indices = [
        1, 0, 3, 1, 3, 2, // Front
        2, 3, 7, 2, 7, 6, // Top
        3, 0, 4, 3, 4, 7, // Left
        6, 5, 1, 6, 1, 2, // Right
        4, 5, 6, 4, 6, 7, // Back
         5, 4, 0, 5, 0, 1 // Bottom
    ];
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
}


// Start animation loop
animate();

