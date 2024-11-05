"use strict";

var gl;
var program;
var t = 0.0;
var morphing = false;
var intervalId;
var direction = 1;
var angleY = 0;
var angleX = 0;
var angleZ = 0;

var isRotateX = false;
var isRotateY = false;
var isRotateZ = false;

var buffer1, buffer2;

init();

function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) {
        alert("WebGL isn't available");
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var cube1 = [
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4( 0.5, -0.5, -0.5, 1.0),
        vec4( 0.5, -0.5,  0.5, 1.0),
        vec4( 0.5,  0.5,  0.5, 1.0),
        vec4( 0.5,  0.5, -0.5, 1.0)
    ];

    var cube2 = [
        vec4(-0.25, -0.25, -0.25, 1.0),
        vec4(-0.25, -0.25,  0.25, 1.0),
        vec4(-0.25,  0.25,  0.25, 1.0),
        vec4(-0.25,  0.25, -0.25, 1.0),
        vec4( 0.25, -0.25, -0.25, 1.0),
        vec4( 0.25, -0.25,  0.25, 1.0),
        vec4( 0.25,  0.25,  0.25, 1.0),
        vec4( 0.25,  0.25, -0.25, 1.0)
    ];

    buffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cube1), gl.STATIC_DRAW);

    buffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cube2), gl.STATIC_DRAW);


    var colors1 = [
        vec4(1.0, 0.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        vec4(0.0, 0.0, 1.0, 1.0),
        vec4(1.0, 1.0, 0.0, 1.0),
        vec4(0.0, 1.0, 1.0, 1.0),
        vec4(1.0, 0.0, 1.0, 1.0),
        vec4(0.5, 0.5, 0.5, 1.0),
        vec4(1.0, 0.5, 0.0, 1.0)
    ];

    var colors2 = [
        vec4(0.5, 0.0, 0.0, 1.0),
        vec4(0.0, 0.5, 0.0, 1.0),
        vec4(0.0, 0.0, 0.5, 1.0),
        vec4(0.5, 0.5, 0.0, 1.0),
        vec4(0.0, 0.5, 0.5, 1.0),
        vec4(0.5, 0.0, 0.5, 1.0), 
        vec4(0.3, 0.3, 0.3, 1.0), 
        vec4(0.5, 0.5, 0.0, 1.0)
    ];

    buffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cube1), gl.STATIC_DRAW);

    buffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cube2), gl.STATIC_DRAW);

    var colorBuffer1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors1), gl.STATIC_DRAW);

    var colorBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors2), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer1);
    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer2);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    document.getElementById('rotateXButton').addEventListener("click", function () {
        isRotateX = !isRotateX;
        this.style.backgroundColor = isRotateX ? 'blue' : 'red';
    });
    
    document.getElementById('rotateYButton').addEventListener("click", function () {
        isRotateY = !isRotateY;
        this.style.backgroundColor = isRotateY ? 'blue' : 'red';
    });
    
    document.getElementById('rotateZButton').addEventListener("click", function () {
        isRotateZ = !isRotateZ;
        this.style.backgroundColor = isRotateZ ? 'blue' : 'red';
    });
    

    document.getElementById('toggle').addEventListener("click", function () {
        if (morphing) {
            clearInterval(intervalId);
        } else {
            intervalId = setInterval(() => {
                t += direction * 0.015;
                angleY += isRotateY ? 2 : 0; // rotation Y
                angleX += isRotateX ? 1 : 0; // rotation X
                angleZ += isRotateZ ? 1 : 0; // rotation Z
                if (t >= 1.0 || t <= 0.0) {
                    direction *= -1;
                }
                render();
            }, 100);
        }
        morphing = !morphing;
    });

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, rotateY(angleY)); // Rotate Y
    modelViewMatrix = mult(modelViewMatrix, rotateX(angleX)); // Rotate X
    modelViewMatrix = mult(modelViewMatrix, rotateZ(angleZ)); // Rotate Z

    var modelViewLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelViewMatrix));

    var morphLoc = gl.getUniformLocation(program, "uMorph");
    gl.uniform1f(morphLoc, t);

    var color = vec4(1.0 * t, 0.0, 1.0 * (1.0 - t), 1.0);
    var colorLoc = gl.getUniformLocation(program, "uColor");
    gl.uniform4fv(colorLoc, flatten(color));

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer1);
    var positionLoc1 = gl.getAttribLocation(program, "aPosition1");
    gl.vertexAttribPointer(positionLoc1, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2);
    var positionLoc2 = gl.getAttribLocation(program, "aPosition2");
    gl.vertexAttribPointer(positionLoc2, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc2);

    drawCube();
}

function drawCube() {
    const indices = [
        1, 0, 3, 1, 3, 2, // Front
        2, 3, 7, 2, 7, 6, // Top
        3, 0, 4, 3, 4, 7, // Left
        6, 5, 1, 6, 1, 2, // Right
        4, 5, 6, 4, 6, 7, // Back
        5, 4, 0, 5, 0, 1  // Bottom
    ];
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

