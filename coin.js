/// <reference path="webgl.d.ts" />

let coin = class {
    constructor(gl, pos, w,h,l) {
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

        this.width=w;
        this.height=h;
        this.length=l;

        this.positions = [
             // Front face
             -this.width/2.0, -this.height/2.0,  this.length/2.0,
              this.width/2.0, -this.height/2.0,  this.length/2.0,
              this.width/2.0,  this.height/2.0,  this.length/2.0,
             -this.width/2.0,  this.height/2.0,  this.length/2.0,
            //  Back facelength/2
             -this.width/2.0, -this.height/2.0, -this.length/2.0,
              this.width/2.0, -this.height/2.0, -this.length/2.0,
              this.width/2.0,  this.height/2.0, -this.length/2.0,
             -this.width/2.0,  this.height/2.0, -this.length/2.0,
            // Top Fheight/2.0         this.length/2
             -this.width/2.0,  this.height/2.0, -this.length/2.0,
              this.width/2.0,  this.height/2.0, -this.length/2.0,
              this.width/2.0,  this.height/2.0,  this.length/2.0,
             -this.width/2.0,  this.height/2.0,  this.length/2.0,
            //  this.width/2Bottoheight/2.0alength/2e
             -this.width/2.0, -this.height/2.0, -this.length/2.0,
              this.width/2.0, -this.height/2.0, -this.length/2.0,
              this.width/2.0, -this.height/2.0,  this.length/2.0,
             -this.width/2.0, -this.height/2.0,  this.length/2.0,
            //  /this.width/2Left this.height/2.0length/2
             -this.width/2.0, -this.height/2.0, -this.length/2.0,
             -this.width/2.0,  this.height/2.0, -this.length/2.0,
             -this.width/2.0,  this.height/2.0,  this.length/2.0,
             -this.width/2.0, -this.height/2.0,  this.length/2.0,
            //  /this.width/2Rightheight/2.0length/2e
              this.width/2.0, -this.height/2.0, -this.length/2.0,
              this.width/2.0,  this.height/2.0, -this.length/2.0,
              this.width/2.0,  this.height/2.0,  this.length/2.0,
              this.width/2.0, -this.height/2.0,  this.length/2.0,
        ];

        this.rotation = 45;

        this.pos = pos;

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.STATIC_DRAW);
        
        this.faceColors = [
            [ Math.random(),  Math.random(),  Math.random(),  Math.random()],    // Left face: purple
            [ Math.random(), Math.random(), Math.random(), Math.random()], // Left face: purple
            [ Math.random(), Math.random(), Math.random(), Math.random()], // Left face: purple
            [ Math.random(), Math.random(), Math.random(), Math.random()], // Left face: purple
            [ Math.random(), Math.random(), Math.random(), Math.random()], // Left face: purple
            [ Math.random(), Math.random(), Math.random(), Math.random()], // Left face: purple

        ];

        var colors = [];



        for (var j = 0; j < this.faceColors.length; ++j) {
            const c = this.faceColors[j];

            // Repeat each color four times for the four vertices of the face
            colors = colors.concat(c, c, c, c);
        }

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        // Build the element array buffer; this specifies the indices
        // into the vertex arrays for each face's vertices.

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // This array defines each face as two triangles, using the
        // indices into the vertex array to specify each triangle's
        // position.

        const indices = [
            0, 1, 2,    0, 2, 3, // front
            4, 5, 6,    4, 6, 7,
            8, 9, 10,   8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23, 
        ];

        // Now send the element array to GL

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices), gl.STATIC_DRAW);

        this.buffer = {
            position: this.positionBuffer,
            color: colorBuffer,
            indices: indexBuffer,
        }

    }

    bd_box()
    {
        var bbdb = new bounding_box(this.pos[0],this.pos[1],this.pos[2],this.width,this.height,this.length);
        return bbdb;
    }

    drawCoin(gl, projectionMatrix, programInfo, deltaTime) {
        const modelViewMatrix = mat4.create();
        mat4.translate(
            modelViewMatrix,
            modelViewMatrix,
            this.pos
        );
        
        //this.rotation += Math.PI / (((Math.random()) % 100) + 50);

        mat4.rotate(modelViewMatrix,
            modelViewMatrix,
            this.rotation,
            [0, 0, 1]);

        {
            const numComponents = 3;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }

        // Tell WebGL how to pull out the colors from the color buffer
        // into the vertexColor attribute.
        {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.color);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexColor);
        }

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.indices);

        // Tell WebGL to use our program when drawing

        gl.useProgram(programInfo.program);

        // Set the shader uniforms

        gl.uniformMatrix4fv(
            programInfo.uniformLocations.projectionMatrix,
            false,
            projectionMatrix);
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);

        {
            const vertexCount = 36;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }

    }
};