"use strict";

var canvasElement;
var glContext;

var numPositions = 36;

var positions = [];
var colors = [];

var xaxis = 0;
var yaxis = 1;
var zaxis = 2;

var axis = 0;
var theta = [0, 0, 0];
var isRotating = true;

var angleLocation;

initialize();

function initialize() {
    canvasElement = document.getElementById("gl-canvas");

    glContext = canvasElement.getContext('webgl2');
    if (!glContext) alert("WebGL 2.0 isn't available");

    createCubeColors();
    constructAxes();

    glContext.viewport(0, 0, canvasElement.width, canvasElement.height);
    glContext.clearColor(1.0, 1.0, 1.0, 1.0);

    glContext.enable(glContext.DEPTH_TEST);

    // Load shaders and initialize attribute buffers
    var shaderProgram = initShaders(glContext, "vertex-shader", "fragment-shader");
    glContext.useProgram(shaderProgram);

    var colorBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, colorBuffer);
    glContext.bufferData(glContext.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);

    var colorAttributeLocation = glContext.getAttribLocation(shaderProgram, "aColor");
    glContext.vertexAttribPointer(colorAttributeLocation, 4, glContext.FLOAT, false, 0, 0);
    glContext.enableVertexAttribArray(colorAttributeLocation);

    var vertexBuffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer);
    glContext.bufferData(glContext.ARRAY_BUFFER, flatten(vertexPositions), gl.STATIC_DRAW);

    var positionAttributeLocation = glContext.getAttribLocation(shaderProgram, "aPosition");
    glContext.vertexAttribPointer(positionAttributeLocation, 4, glContext.FLOAT, false, 0, 0);
    glContext.enableVertexAttribArray(positionAttributeLocation);

    angleLocation = glContext.getUniformLocation(shaderProgram, "uTheta");

    // Event listeners for buttons
    document.getElementById("xButton").onclick = function () {
        currentAxis = axisX;
    };
    document.getElementById("yButton").onclick = function () {
        currentAxis = axisY;
    };
    document.getElementById("zButton").onclick = function () {
        currentAxis = axisZ;
    };
    document.getElementById("toggleButton").onclick = function () {
        isRotating = !isRotating;
    };

    draw();
}

function createCubeColors() {
    generateQuad(1, 0, 3, 2);
    generateQuad(2, 3, 7, 6);
    generateQuad(3, 0, 4, 7);
    generateQuad(6, 5, 1, 2);
    generateQuad(4, 5, 6, 7);
    generateQuad(5, 4, 0, 1);
}

function generateQuad(a, b, c, d) {
    var cubeVertices = [
        vec4(-0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, 0.5, 0.5, 1.0),
        vec4(0.5, 0.5, 0.5, 1.0),
        vec4(0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5, 0.5, -0.5, 1.0),
        vec4(0.5, 0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];

    var colorPalette = [
        vec4(0.0, 0.0, 0.0, 1.0),  // black
        vec4(0.8, 0.1, 0.1, 1.0),  // dark red
        vec4(1.0, 0.8, 0.0, 1.0),  // bright yellow
        vec4(0.0, 0.8, 0.0, 1.0),  // bright green
        vec4(0.1, 0.1, 0.8, 1.0),  // dark blue
        vec4(0.8, 0.1, 0.8, 1.0),  // dark magenta
        vec4(0.8, 0.8, 0.8, 1.0),  // light gray
        vec4(0.0, 0.8, 0.8, 1.0)   // bright cyan
    ];

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        vertexPositions.push(cubeVertices[indices[i]]);
        vertexColors.push(colorPalette[indices[i]]);
    }
}

function constructAxes() {
    var axisVertices = [
        // X axis
        vec4(-1.0, 0.0, 0.0, 1.0),
        vec4(1.0, 0.0, 0.0, 1.0),
        // Y axis
        vec4(0.0, -1.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        // Z axis
        vec4(0.0, 0.0, -1.0, 1.0),
        vec4(0.0, 0.0, 1.0, 1.0)
    ];

    var axisColors = [
        vec4(1.0, 0.0, 0.0, 1.0),  // X axis - red
        vec4(1.0, 0.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),  // Y axis - green
        vec4(0.0, 1.0, 0.0, 1.0),
        vec4(0.0, 0.0, 1.0, 1.0),  // Z axis - blue
        vec4(0.0, 0.0, 1.0, 1.0)
    ];

    for (var i = 0; i < axisVertices.length; i++) {
        vertexPositions.push(axisVertices[i]);
        vertexColors.push(axisColors[i]);
    }
}

function draw() {
    glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);

    if (isRotating) {
        rotationAngles[currentAxis] += 2.0;
    }
    glContext.uniform3fv(angleLocation, rotationAngles);

    // Render the cube
    glContext.drawArrays(glContext.TRIANGLES, 0, totalVertices);
    // Now render the axes
    glContext.drawArrays(glContext.LINES, totalVertices, 6);

    requestAnimationFrame(draw);
}
