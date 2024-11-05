"use strict";

let glContext;
let shaderProg;
let morphValue = 0.0;
let angleY = 0;
let angleX = 0;
let angleZ = 0;

let vertexBuffer1, vertexBuffer2;
let colorBuffer1, colorBuffer2;

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

    colorBuffer1 = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, colorBuffer1);
    glContext.bufferData(glContext.ARRAY_BUFFER, flatten(colorsForFirstShape), glContext.STATIC_DRAW);

    colorBuffer2 = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, colorBuffer2);
    glContext.bufferData(glContext.ARRAY_BUFFER, flatten(colorsForSecondShape), glContext.STATIC_DRAW);

    // Set up position attributes
    const positionAttributeLocationA = gl.getAttribLocation(shaderProg, "positionA");
    const positionAttributeLocationB = gl.getAttribLocation(shaderProg, "positionB");

    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer1);
    glContext.vertexAttribPointer(positionAttributeLocationA, 4, glContext.FLOAT, false, 0, 0);
    glContext.enableVertexAttribArray(positionAttributeLocationA);

    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer2);
    glContext.vertexAttribPointer(positionAttributeLocationB, 4, glContext.FLOAT, false, 0, 0);
    glContext.enableVertexAttribArray(positionAttributeLocationB);

    // Set up color attributes
    const colorAttributeLocation = gl.getAttribLocation(shaderProg, "vertexColor");
    glContext.bindBuffer(glContext.ARRAY_BUFFER, colorBuffer1);
    glContext.vertexAttribPointer(colorAttributeLocation, 4, glContext.FLOAT, false, 0, 0);
    glContext.enableVertexAttribArray(colorAttributeLocation);

    // Event listeners for buttons
    document.getElementById('morphButton').addEventListener("click", function () {
        morphValue = morphValue === 0.0 ? 1.0 : 0.0;
    });

    drawScene();
}

function drawScene() {
    glContext.clear(glContext.COLOR_BUFFER_BIT | glContext.DEPTH_BUFFER_BIT);
    const modelViewMatrix = mat4();
    
    // Create rotation matrices
    const rotationX = rotate(angleX, [1, 0, 0]);
    const rotationY = rotate(angleY, [0, 1, 0]);
    const rotationZ = rotate(angleZ, [0, 0, 1]);

    // Update model view matrix with rotations
    modelViewMatrix = mult(modelViewMatrix, rotationX);
    modelViewMatrix = mult(modelViewMatrix, rotationY);
    modelViewMatrix = mult(modelViewMatrix, rotationZ);

    const morphLocation = glContext.getUniformLocation(shaderProg, "morphFactor");
    glContext.uniform1f(morphLocation, morphValue);

    const modelViewMatrixLocation = glContext.getUniformLocation(shaderProg, "modelViewMatrix");
    glContext.uniformMatrix4fv(modelViewMatrixLocation, false, flatten(modelViewMatrix));

    // Draw the first shape
    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer1);
    glContext.drawArrays(glContext.TRIANGLES, 0, 36);

    // Draw the second shape
    glContext.bindBuffer(glContext.ARRAY_BUFFER, vertexBuffer2);
    glContext.drawArrays(glContext.TRIANGLES, 0, 36);

    requestAnimationFrame(drawScene);
}


