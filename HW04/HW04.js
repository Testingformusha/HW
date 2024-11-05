"use strict";

let gl;
let shaderProgram;
let morphFactor = 0.0;
let isMorphing = false;
let morphInterval;
let rotationDirection = 1;
let rotateY = 0;
let rotateX = 0;
let rotateZ = 0;

let rotateXEnabled = false;
let rotateYEnabled = false;
let rotateZEnabled = false;

let vertexBufferA, vertexBufferB;

initialize();

function initialize() {
    const canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);

    shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(shaderProgram);

    const shapeA = [
        vec4(-0.6, -0.6, -0.6, 1.0),
        vec4(-0.6, -0.6,  0.6, 1.0),
        vec4(-0.6,  0.6,  0.6, 1.0),
        vec4(-0.6,  0.6, -0.6, 1.0),
        vec4( 0.6, -0.6, -0.6, 1.0),
        vec4( 0.6, -0.6,  0.6, 1.0),
        vec4( 0.6,  0.6,  0.6, 1.0),
        vec4( 0.6,  0.6, -0.6, 1.0)
    ];

    const shapeB = [
        vec4(-0.3, -0.3, -0.3, 1.0),
        vec4(-0.3, -0.3,  0.3, 1.0),
        vec4(-0.3,  0.3,  0.3, 1.0),
        vec4(-0.3,  0.3, -0.3, 1.0),
        vec4( 0.3, -0.3, -0.3, 1.0),
        vec4( 0.3, -0.3,  0.3, 1.0),
        vec4( 0.3,  0.3,  0.3, 1.0),
        vec4( 0.3,  0.3, -0.3, 1.0)
    ];

    vertexBufferA = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferA);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(shapeA), gl.STATIC_DRAW);

    vertexBufferB = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferB);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(shapeB), gl.STATIC_DRAW);

    const colorArrayA = [
        vec4(0.9, 0.1, 0.1, 1.0),
        vec4(0.1, 0.9, 0.1, 1.0),
        vec4(0.1, 0.1, 0.9, 1.0),
        vec4(0.9, 0.9, 0.1, 1.0),
        vec4(0.1, 0.9, 0.9, 1.0),
        vec4(0.9, 0.1, 0.9, 1.0),
        vec4(0.7, 0.7, 0.7, 1.0),
        vec4(0.9, 0.5, 0.0, 1.0)
    ];

    const colorArrayB = [
        vec4(0.3, 0.0, 0.0, 1.0),
        vec4(0.0, 0.3, 0.0, 1.0),
        vec4(0.0, 0.0, 0.3, 1.0),
        vec4(0.3, 0.3, 0.0, 1.0),
        vec4(0.0, 0.3, 0.3, 1.0),
        vec4(0.3, 0.0, 0.3, 1.0),
        vec4(0.2, 0.2, 0.2, 1.0),
        vec4(0.3, 0.3, 0.0, 1.0)
    ];

    const colorBufferA = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferA);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorArrayA), gl.STATIC_DRAW);

    const colorBufferB = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferB);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorArrayB), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferA);
    const colorLocation = gl.getAttribLocation(shaderProgram, "aColor");
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferB);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLocation);

    initializeButtonHandlers();

    render();
}

function initializeButtonHandlers() {
    document.getElementById('rotateXButton').style.backgroundColor = 'orange';
    document.getElementById('rotateYButton').style.backgroundColor = 'orange';
    document.getElementById('rotateZButton').style.backgroundColor = 'orange';

    document.getElementById('rotateXButton').addEventListener("click", function () {
        rotateXEnabled = !rotateXEnabled;
        this.style.backgroundColor = rotateXEnabled ? 'lightgreen' : 'orange';
    });

    document.getElementById('rotateYButton').addEventListener("click", function () {
        rotateYEnabled = !rotateYEnabled;
        this.style.backgroundColor = rotateYEnabled ? 'lightgreen' : 'orange';
    });

    document.getElementById('rotateZButton').addEventListener("click", function () {
        rotateZEnabled = !rotateZEnabled;
        this.style.backgroundColor = rotateZEnabled ? 'lightgreen' : 'orange';
    });

    document.getElementById('toggle').addEventListener("click", function () {
        if (isMorphing) {
            clearInterval(morphInterval);
        } else {
            morphInterval = setInterval(() => {
                morphFactor += rotationDirection * 0.02;
                rotateY += rotateYEnabled ? 2 : 0; // rotation Y
                rotateX += rotateXEnabled ? 1 : 0; // rotation X
                rotateZ += rotateZEnabled ? 1 : 0; // rotation Z

                if (morphFactor >= 1.0 || morphFactor <= 0.0) {
                    rotationDirection *= -1;
                }
                render();
            }, 100);
        }
        isMorphing = !isMorphing;
    });
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, rotateY(rotateY)); // Rotate Y
    modelViewMatrix = mult(modelViewMatrix, rotateX(rotateX)); // Rotate X
    modelViewMatrix = mult(modelViewMatrix, rotateZ(rotateZ)); // Rotate Z

    const modelViewLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    gl.uniformMatrix4fv(modelViewLocation, false, flatten(modelViewMatrix));

    const morphLocation = gl.getUniformLocation(shaderProgram, "uMorph");
    gl.uniform1f(morphLocation, morphFactor);

    const colorBlend = vec4(1.0 * morphFactor, 0.0, 1.0 * (1.0 - morphFactor), 1.0);
    const colorUniformLocation = gl.getUniformLocation(shaderProgram, "uColor");
    gl.uniform4fv(colorUniformLocation, flatten(colorBlend));

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferA);
    const positionLocationA = gl.getAttribLocation(shaderProgram, "aPosition1");
    gl.vertexAttribPointer(positionLocationA, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocationA);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferB);
    const positionLocationB = gl.getAttribLocation(shaderProgram, "aPosition2");
    gl.vertexAttribPointer(positionLocationB, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocationB);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
    requestAnimationFrame(render);
}
