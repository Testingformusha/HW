"use strict";

let glContext;
let shaderProg;
let morphValue = 0.0;
let isAnimating = false;
let animationInterval;
let rotationSign = 1;
let angleY = 0;
let angleX = 0;
let angleZ = 0;

let isXRotating = false;
let isYRotating = false;
let isZRotating = false;

let vertexBuffer1, vertexBuffer2;

init();

function init() {
    const canvasElement = document.getElementById("gl-canvas");
    glContext = canvasElement.getContext('webgl2');
    if (!glContext) {
        alert("Unable to initialize WebGL");
        return;
    }
    glContext.viewport(0, 0, canvasElement.width, canvasElement.height);
    glContext.clearColor(0.8, 0.8, 0.8, 1.0);
    glContext.enable(glContext.DEPTH_TEST);

    shaderProg = initShaders(glContext, "vertex-shader", "fragment-shader");
    glContext.useProgram(shaderProg);

    const cubeVertices = [
        vec4(-0.6, -0.6, -0.6, 1.0),
        vec4(-0.6, -0.6,  0.6, 1.0),
        vec4(-0.6,  0.6,  0.6, 1.0),
        vec4(-0.6,  0.6, -0.6, 1.0),
        vec4( 0.6, -0.6, -0.6, 1.0),
        vec4( 0.6, -0.6,  0.6, 1.0),
        vec4( 0.6,  0.6,  0.6, 1.0),
        vec4( 0.6,  0.6, -0.6, 1.0)
    ];

    const otherVertices = [
        vec4(-0.3, -0.3, -0.3, 1.0),
        vec4(-0.3, -0.3,  0.3, 1.0),
        vec4(-0.3,  0.3,  0.3, 1.0),
        vec4(-0.3,  0.3, -0.3, 1.0),
        vec4( 0.3, -0.3, -0.3, 1.0),
        vec4( 0.3, -0.3,  0.3, 1.0),
        vec4( 0.3,  0.3,  0.3, 1.0),
        vec4( 0.3,  0.3, -0.3, 1.0)
    ];

    vertexBuffer1 = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer1);
    glContext.bufferData(glContext.ARRAY_BUFFER, flatten(cubeVertices), glContext.STATIC_DRAW);

    vertexBuffer2 = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer2);
    glContext.bufferData(glContext.ARRAY_BUFFER, flatten(otherVertices), glContext.STATIC_DRAW);

    const colorsForFirstShape = [
        vec4(0.9, 0.1, 0.1, 1.0),
        vec4(0.1, 0.9, 0.1, 1.0),
        vec4(0.1, 0.1, 0.9, 1.0),
        vec4(0.9, 0.9, 0.1, 1.0),
        vec4(0.1, 0.9, 0.9, 1.0),
        vec4(0.9, 0.1, 0.9, 1.0),
        vec4(0.7, 0.7, 0.7, 1.0),
        vec4(0.9, 0.5, 0.0, 1.0)
    ];

    const colorsForSecondShape = [
        vec4(0.3, 0.0, 0.0, 1.0),
        vec4(0.0, 0.3, 0.0, 1.0),
        vec4(0.0, 0.0, 0.3, 1.0),
        vec4(0.3, 0.3, 0.0, 1.0),
        vec4(0.0, 0.3, 0.3, 1.0),
        vec4(0.3, 0.0, 0.3, 1.0),
        vec4(0.2, 0.2, 0.2, 1.0),
        vec4(0.3, 0.3, 0.0, 1.0)
    ];

    const colorBuffer1 = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, colorBuffer1);
    glContext.bufferData(glContext.ARRAY_BUFFER, flatten(colorsForFirstShape), glContext.STATIC_DRAW);

    const colorBuffer2 = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, colorBuffer2);
    glContext.bufferData(glContext.ARRAY_BUFFER, flatten(colorsForSecondShape), glContext.STATIC_DRAW);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, colorBuffer1);
    const colorAttributeLocation = gl.getAttribLocation(shaderProg, "vertexColor");
    glContext.vertexAttribPointer(colorAttributeLocation, 4, glContext.FLOAT, false, 0, 0);
    glContext.enableVertexAttribArray(colorAttributeLocation);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, colorBuffer2);
    glContext.vertexAttribPointer(colorAttributeLocation, 4, glContext.FLOAT, false, 0, 0);
    glContext.enableVertexAttribArray(colorAttributeLocation);

    setupButtonEvents();

    drawScene();
}

function setupButtonEvents() {
    document.getElementById('xRotateButton').style.backgroundColor = 'orange';
    document.getElementById('yRotateButton').style.backgroundColor = 'orange';
    document.getElementById('zRotateButton').style.backgroundColor = 'orange';

    document.getElementById('xRotateButton').addEventListener("click", function () {
        isXRotating = !isXRotating;
        this.style.backgroundColor = isXRotating ? 'lightgreen' : 'orange';
    });

    document.getElementById('yRotateButton').addEventListener("click", function () {
        isYRotating = !isYRotating;
        this.style.backgroundColor = isYRotating ? 'lightgreen' : 'orange';
    });

    document.getElementById('zRotateButton').addEventListener("click", function () {
        isZRotating = !isZRotating;
        this.style.backgroundColor = isZRotating ? 'lightgreen' : 'orange';
    });

    document.getElementById('morphButton').addEventListener("click", function () {
        morphValue = morphValue === 0.0 ? 1.0 : 0.0;
    });
}

function drawScene() {
    glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
    glContext.enable(glContext.DEPTH_TEST);

    const modelViewMatrix = mat4();

    if (isXRotating) angleX += 0.01 * rotationSign;
    if (isYRotating) angleY += 0.01 * rotationSign;
    if (isZRotating) angleZ += 0.01 * rotationSign;

    modelViewMatrix = mult(modelViewMatrix, rotate(angleX, [1, 0, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(angleY, [0, 1, 0]));
    modelViewMatrix = mult(modelViewMatrix, rotate(angleZ, [0, 0, 1]));

    const morphLocation = glContext.getUniformLocation(shaderProg, "morphFactor");
    glContext.uniform1f(morphLocation, morphValue);
    const modelViewMatrixLocation = glContext.getUniformLocation(shaderProg, "modelViewMatrix");
    glContext.uniformMatrix4fv(modelViewMatrixLocation, false, flatten(modelViewMatrix));

    // Draw the shapes
    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer1);
    glContext.drawArrays(glContext.TRIANGLES, 0, 36);
    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer2);
    glContext.drawArrays(glContext.TRIANGLES, 0, 36);

    requestAnimationFrame(drawScene);
}

