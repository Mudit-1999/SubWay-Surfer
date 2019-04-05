/// <reference path="webgl.d.ts" />

let body = class {
    constructor(gl, pos, w,h,l) {

        this.height=h;
        this.width=w;
        this.length=l;
        this.pos = pos;


        this.head_pos = [
            this.pos[0],
            this.pos[1]+0.3,
            this.pos[2],
            ];

        this.body_pos = [
            this.pos[0],
            this.pos[1]-0.1,
            this.pos[2],
        ];

        this.leg1_pos =[
            this.pos[0]-0.5,   
            this.pos[1]-0.4,
            this.pos[2],
        ];

        this.leg2_pos =[
            this.pos[0]+0.5,   
            this.pos[1]-0.4,
            this.pos[2],
        ];
         
        this.head = new cube(gl, this.head_pos,0.4,0.4,0.4,1);
        this.body = new cube(gl, this.body_pos,0.8,0.4,0.8,1);
        this.leg1 = new cube(gl, this.leg1_pos,0.3,0.2,0.4,1);
        this.leg2 = new cube(gl, this.leg2_pos,0.3,0.2,0.4,1);
    }

    bd_box()
    {
        var bbdb = new bounding_box(this.pos[0],this.pos[1],this.pos[2],this.width,this.height,this.length);
        return bbdb;
    }

    drawBody(gl, projectionMatrix, programInfo, deltaTime) 
    {

        this.head.pos = [
            this.pos[0],
            this.pos[1]+0.3,
            this.pos[2],
            ];

        this.body.pos = [
            this.pos[0],
            this.pos[1]-0.1,
            this.pos[2],
        ];

        this.leg1.pos =[
            this.pos[0]-0.25,   
            this.pos[1]-0.4,
            this.pos[2],
        ];

        this.leg2.pos =[
            this.pos[0]+0.25,   
            this.pos[1]-0.4,
            this.pos[2],
        ];
        this.head.drawCube(gl, projectionMatrix, programInfo, deltaTime);
        this.body.drawCube(gl, projectionMatrix, programInfo, deltaTime);
        this.leg1.drawCube(gl, projectionMatrix, programInfo, deltaTime);
        this.leg2.drawCube(gl, projectionMatrix, programInfo, deltaTime);
    }
};