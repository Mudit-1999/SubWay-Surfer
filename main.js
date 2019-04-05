var track = new Array();
var metro = new Array();
var barricades = new Array();
var coins = new Array();
var pole = new Array();
var bush = new Array();
var boot = new Array();
var jetpack = new Array();
var speed = 0.2,score = 0.0;
var dead = false;
var light_count = 100.0;
var Coin_count = 0.0;

var slow_down = false, flag_b =-1,flag_p=-1;
var start_slow = new Date().getSeconds();
var distance = 7;

var left_transition=false;
var right_transition =false;
var transition_time;

var wallTex,trainTex;
var bushTex,groundTex;
var poleTex,bootTex;
var jetTex;

var speed_y=0,acc_y=-0.0060;
var ground_level = -3.8;
var jump=false;

var jump_boost=1.0;
var jump_boost_start_time;

var jet_boost_start_time;
var jet_boost_start = false;

var above_train=false,flag_t=-1;
var train_level = -1.0;

var texture_flash;

var duck=false, duck_score = 0.0;
var duck_time;

var train_speed= 0.5;
var distance_covered=0.0;

main();

//
// Start here
//

function main() {
  
  document.getElementById('music').play();
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // coin1 = new coin(gl,[0,-1,30],1);
  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program and Fragment shader program for normal

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

    
  const fsSource = `
    varying lowp vec4 vColor;

    void main(void) 
    {
      gl_FragColor = vColor;
    }
  `;
  // Fragment shader program for normal grayscale

  const fsSource_grayscale = `
    #ifdef GL_ES
    precision mediump float;
    #endif
    varying lowp vec4 vColor;

    void main(void) {
        float gray = (vColor.r + vColor.g + vColor.b) / 3.0;
        vec3 grayscale = vec3(gray);
        gl_FragColor = vec4(grayscale, vColor.a);
    }
  `;


  // Vertex shader program and Fragment shader program for texture

  const vsSource_texture = `
  attribute vec4 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec2 aTextureCoord;

  uniform mat4 uNormalMatrix;
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying highp vec2 vTextureCoord;
  varying highp vec3 vLighting;

  void main(void) 
  {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;

    // Apply lighting effect

    highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
    highp vec3 directionalLightColor = vec3(1, 1, 1);
    highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

    highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

    highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    vLighting = ambientLight + (directionalLightColor * directional);
  }
`;
  
  const fsSource_texture = `
  varying highp vec2 vTextureCoord;

  uniform sampler2D uSampler;

  void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
  }
  `;

  // Fragment shader program for flashing texture

  const fsSource_texture_flash = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    uniform sampler2D uSampler;

    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
      gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
      gl_FragColor.r+=0.1;
      gl_FragColor.g+=0.1;
      gl_FragColor.b+=0.1;
    }
  `;



  // Fragment shader program for texture grayscale

  const fsSource_texture_grayscale =`
  #ifdef GL_ES
  precision mediump float;
  #endif

  varying highp vec2 vTextureCoord;
  uniform sampler2D uSampler;

  void main(void) {
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
    
    vec3 color = texelColor.rgb;
    float gray = (color.r + color.g + color.b) / 3.0;
    vec3 grayscale = vec3(gray);
    
    gl_FragColor = vec4(grayscale , texelColor.a);
    
  }
`;

  // Fragment shader program for flashing texture grayscale

  const fsSource_texture_flash_grayscale =`
  #ifdef GL_ES
  precision mediump float;
  #endif
  
  varying highp vec2 vTextureCoord;
  varying highp vec3 vLighting;

  uniform sampler2D uSampler;

  void main(void) {
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
    
    vec3 color = texelColor.rgb;
    float gray = (color.r + color.g + color.b) / 3.0;
    vec3 grayscale = vec3(gray);
    gl_FragColor = vec4(grayscale * vLighting, texelColor.a);
    gl_FragColor.r+=0.1;
    gl_FragColor.g+=0.1;
    gl_FragColor.b+=0.1;
  }
`;
  

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const shaderProgram_grayscale = initShaderProgram(gl, vsSource, fsSource_grayscale);
  const shaderProgram_texture = initShaderProgram(gl, vsSource_texture, fsSource_texture);
  const shaderProgram_texture_grayscale = initShaderProgram(gl, vsSource_texture, fsSource_texture_grayscale);
  const shaderProgram_texture_flash = initShaderProgram(gl, vsSource_texture, fsSource_texture_flash);
  const shaderProgram_texture_flash_grayscale = initShaderProgram(gl, vsSource_texture, fsSource_texture_flash_grayscale);



  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  const programInfo_grayscale = {
    program: shaderProgram_grayscale,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram_grayscale, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram_grayscale, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram_grayscale, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram_grayscale, 'uModelViewMatrix'),
    },
  };
  
  const programInfo_texture = {
    program: shaderProgram_texture,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram_texture, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram_texture, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram_texture, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram_texture, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram_texture, 'uSampler'),
    },
  };

  const programInfo_texture_grayscale = {
    program: shaderProgram_texture_grayscale,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram_texture_grayscale, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram_texture_grayscale, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram_texture_grayscale, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram_texture_grayscale, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram_texture_grayscale, 'uSampler'),
    },
  };


  const programInfo_texture_flash = {
    program: shaderProgram_texture_flash,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram_texture_flash, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram_texture_flash, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram_texture_flash, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram_texture_flash, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram_texture_flash, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram_texture_flash, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram_texture_flash, 'uSampler'),
    },
  };


  const programInfo_texture_flash_grayscale = {
    program: shaderProgram_texture_flash_grayscale,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram_texture_flash_grayscale, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram_texture_flash_grayscale, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram_texture_flash_grayscale, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram_texture_flash_grayscale, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram_texture_flash_grayscale, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram_texture_flash_grayscale, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram_texture_flash_grayscale, 'uSampler'),
    },
  };



  var texture = false;
  var grayscale = false;
  ground   = new cube(gl, [ 4,-4.5 , 15],100,0.2,1000,10);
  track.push(new cube(gl, [-5,-4.4 , 15],2.5,0.2,1000,1));
  track.push(new cube(gl, [ 0,-4.4 , 15],2.5,0.2,1000,1));
  track.push(new cube(gl, [ 5,-4.4 , 15],2.5,0.2,1000,1));
  
  wall1    = new cube(gl, [-7,-4.0,15] ,0.5,20,1000,2);
  wall2    = new cube(gl, [7,-4.0,15] ,0.5,20,1000,2);
  
  barricades.push(new cube(gl,[5,-3.3,55],3.0,2.0,0.1,1));

  bush.push(new cube(gl,[-5,-3.8,45],2.0,1.0,0.1,1));
  
  // coins.push(new coin(gl,[0,-3.80,25],0.5,0.5,0.1));
  // coins.push(new coin(gl,[0,-3.80,29],0.5,0.5,0.1));

  pole.push(new cube(gl,[2.75,-3.0,25],0.5,10.5,0.2,1));

  boot.push(new cube(gl,[0,-3.80,39],1.5,1.5,0.1,1));
  
  jetpack.push(new cube(gl,[5,-3.80,49],1.0,1.0,0.1,1));

  metro.push(new train(gl,[-5,-3.0,25],2.8,3,20,5));
  hero     = new body(gl, [0,-3.8,-2],0.8,1,0.8);
  cop      = new body(gl, [0,-3.8,-1],0.8,1,0.8);

  var y_coin =4;
  for(var i = 0; i < 20 ; i++)
  {
    var len=Math.round(Math.random()*10) + 5.0;
    var x= Math.random();
    if(x <= 0.15)
    {
      for(var j = 0; j < len ; j++)
      {
        coins.push(new coin(gl,[+5,-3.80,y_coin+j],0.5,0.5,0.1));
        coins.push(new coin(gl,[-5,-3.80,y_coin+j],0.5,0.5,0.1));
      }
      jetpack.push(new cube(gl,[5,-3.80,y_coin+4],1.0,1.0,0.1,1));
      barricades.push(new cube(gl,[5,-3.3,y_coin+2],3.0,2.0,0.1,1));
      barricades.push(new cube(gl,[0,-3.3,y_coin+4],3.0,2.0,0.1,1));
      barricades.push(new cube(gl,[-5,-3.3,y_coin+2],3.0,2.0,0.1,1));
      
      bush.push(new cube(gl,[5,-3.8,y_coin+8],2.0,1.0,0.1,1));
      barricades.push(new cube(gl,[-5,-3.3,y_coin+8],3.0,2.0,0.1,1));
    }
    else if(x <= 0.40)
    {
      for(var j = 0; j < len ; j++)
      {
        coins.push(new coin(gl,[0,-3.80,y_coin+j],0.5,0.5,0.1));
      }

      barricades.push(new cube(gl,[5,-3.3,y_coin+1],3.0,2.0,0.1,1));
      barricades.push(new cube(gl,[0,-3.3,y_coin+4],3.0,2.0,0.1,1));
      // barricades.push(new cube(gl,[-5,-3.3,y_coin+6],3.0,2.0,0.1,1));
      bush.push(new cube(gl,[-5,-3.8,y_coin+6],2.0,1.0,0.1,1));
    }
    else if(x <= 0.6)
    {
      for(var j = 0; j < len ; j++)
      {
        coins.push(new coin(gl,[-5,-3.80,y_coin+j],0.5,0.5,0.1));
      }
      pole.push(new cube(gl,[-2.75,-3.0,y_coin+5],0.5,10.5,0.2,1));
      bush.push(new cube(gl,[-5,-3.8,y_coin+3],2.0,1.0,0.1,1));
    }
    else if( x<= 0.8)
    {
      for(var j = 0; j < len ; j++)
      {
        coins.push(new coin(gl,[+5,-3.80,y_coin+j],0.5,0.5,0.1));
      }
      bush.push(new cube(gl,[0,-3.8,y_coin+3],2.0,1.0,0.1,1));
      bush.push(new cube(gl,[0,-3.8,y_coin+6],2.0,1.0,0.1,1));

    }
    else if( x<= 0.90)
    {
      for(var j = 0; j < len ; j++)
      {
        coins.push(new coin(gl,[-5,-3.80,y_coin+j],0.5,0.5,0.1));
      }
      boot.push(new cube(gl,[0,-3.80,y_coin+4],1.5,1.5,0.1,1));
    }
    else
    {
      for(var j = 0; j < len ; j+=2)
      {
        coins.push(new coin(gl,[-5,-3.80,y_coin+j],0.5,0.5,0.1));
      }
      pole.push(new cube(gl,[2.75,-3.0,y_coin+2],0.5,10.5,0.2,1));
      pole.push(new cube(gl,[-2.75,-3.0,y_coin+5],0.5,10.5,0.2,1));
    }
    y_coin=y_coin+(len+ x*100);
  }

  var y_train=25;
  for(var i = 0; i < 30 ; i++)
  {
    var len=Math.round(Math.random()*10) + 10.0;
    var x= Math.random();
    y_train=y_train+(len+ x*100);
    if(x <= 0.15)
    {
      metro.push(new train(gl,[-5,-3.0,y_train],2.8,3,len,5));
      metro.push(new train(gl,[5,-3.0,y_train],2.8,3,len,5));
    }
    else if(x <= 0.45)
    {
      metro.push(new train(gl,[0,-3.0,y_train],2.8,3,len,5));
    }
    else if(x <= 0.7)
    {
      metro.push(new train(gl,[5,-3.0,y_train],2.8,3,len,5));
    }
    else
    {
      metro.push(new train(gl,[-5,-3.0,y_train],2.8,3,len,5));
      
    }
  }

  

  wallTex = loadTexture(gl, 'wall.jpg');
  trainTex = loadTexture(gl, 'train1.png');
  bushTex = loadTexture(gl, 'bush.png');
  groundTex = loadTexture(gl, 'ground.png');
  poleTex = loadTexture(gl, 'pole1.png');
  barricadeTex = loadTexture(gl, 'barricade.png');
  bootTex = loadTexture(gl, 'boot.png');
  jetTex = loadTexture(gl, 'jetpack.png');


  Mousetrap.bind('a', function () 
  {
    if(hero.pos[0] != 5 && left_transition==false && right_transition ==false)
    {
      hero.pos[0] = hero.pos[0]+ 2.5;
      left_transition=true;
      transition_time= new Date().getTime();
    }
  });
  Mousetrap.bind('d', function () 
  {
    if(hero.pos[0] != -5 && right_transition == false && left_transition== false)
    {
      hero.pos[0] = hero.pos[0]- 2.5;
      right_transition=true;
      transition_time= new Date().getTime();
    }
  });
  Mousetrap.bind('space', function () 
  {
    if(jump==false)
    {
      speed_y=0.08*2*jump_boost;
      jump=true;
    }
  });

  Mousetrap.bind('c', function () 
  {
    if(duck==false)
    {
      duck_score=0.4;
      hero.pos[1]-=duck_score;
      duck=true;
      duck_time= new Date().getTime();

    }
  });
  Mousetrap.bind('t', function () 
  {
    texture = ~texture;
  });
  Mousetrap.bind('b', function () 
  {
    grayscale = ~grayscale;
  });
  

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  //const buffers

  var then = 0;
  
  function sleep(ms) 
  {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  // Draw the scene repeatedly
  async function render(now) 
  {
    if(dead)
      return;
    if(distance_covered>=1000)
    {
      game_over();
    }
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    score += deltaTime;
    $("#score").text("Score: " + (Math.round(score)));



    for(var i =0; i< metro.length ; i++)
    {
      metro[i].pos[2]-=train_speed;  
    } 

    hero.pos[2]=hero.pos[2]+ speed;
    distance_covered+=speed;
    hero.pos[1] += speed_y;
    speed_y += acc_y*jump_boost;
    if(hero.pos[1] <= train_level &&  above_train && 
      (Math.abs(metro[flag_t].pos[2] - hero.pos[2]) * 2 < (metro[flag_t].length + hero.length)) && 
      (Math.abs(metro[flag_t].pos[0] - hero.pos[0]) * 2 < (metro[flag_t].width + hero.width))
      )
    {
      hero.pos[1]=train_level-duck_score;
      jump=false;
    }
    else if(hero.pos[1] <= ground_level )
    {
      hero.pos[1]=ground_level-duck_score;
      jump=false;
      above_train = false;
    }

    cop.pos[0] = hero.pos[0];
    cop.pos[1] = hero.pos[1];
    cop.pos[2] = hero.pos[2] - distance;
    if(slow_down)
    {
      distance-=6;
      slow_down =false;
      if(distance <= 2)
        game_over();
    }
    else if( distance < 13.0  &&  new Date().getSeconds() -  start_slow >= 1)
    {
      distance++;
      start_slow = new Date().getSeconds();
    }
    // console.log("distance",distance);
    // console.log("hi " ,hero.pos)
    // console.log(jump_boost);
    if( new Date().getSeconds() - jump_boost_start_time >= 10 && jump_boost==2)
    {
      jump_boost=1;
    }
    if( new Date().getSeconds() - jet_boost_start_time >= 10 && jet_boost_start==true)
    {
      hero.pos[1] = ground_level;
      acc_y=-0.0060;
      speed=0.2;
      jet_boost_start=false;
      jump=false;
    }
    await sleep(20);
    if(!grayscale)
    {
      if(light_count > 0)
      {
        texture_flash=false;
        drawScene(gl, programInfo,programInfo_texture,programInfo_texture,deltaTime);
      }
      else
      {
        texture_flash=true;
        drawScene(gl, programInfo,programInfo_texture,programInfo_texture_flash ,deltaTime);
        if(light_count < -100)
          light_count=100;
      }
    }
    else
    {
      if(light_count > 0)
      {
        texture_flash=false;
        drawScene(gl, programInfo_grayscale,programInfo_texture_grayscale,programInfo_texture_grayscale,deltaTime);
      }
      else
      {
        texture_flash=true;
        drawScene(gl, programInfo_grayscale,programInfo_texture_grayscale,programInfo_texture_flash_grayscale,deltaTime);
        if(light_count < -100)
          light_count=100;
      }
    }
    light_count--;
    if(left_transition &&  new Date().getTime()- transition_time > 300)
    {
      left_transition=false;
      hero.pos[0]+=2.5;
    }
    
    if(right_transition &&  new Date().getTime()- transition_time > 300)
    {
      right_transition=false;
      hero.pos[0]-=2.5;
    }
    
    if(duck &&  new Date().getTime()- duck_time > 300)
    {
      duck=false;
      duck_score=0.0;
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// Draw the scene.

function drawScene(gl, programInfo,programInfo_texture, programInfo_texture_flash,deltaTime) 
{
  gl.clearColor(0.0, 0.0, 0.5, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 300.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  var cameraMatrix = mat4.create();
  mat4.translate(cameraMatrix, cameraMatrix, [0, 0, 0]);
  // var cameraPosition = [
  //   cameraMatrix[12],
  //   cameraMatrix[13],
  //   cameraMatrix[14],
  // ];
  // console.log(cameraPosition);
  var cameraPosition = [
      0.0,
      hero.pos[1] + 3.5 +duck_score,
      hero.pos[2]-13.0,
    ];

  var target = [
    0.0,
    hero.pos[1] + duck_score,
    hero.pos[2],
  ];
  
  var up = [0, 1, 0];

  mat4.lookAt(cameraMatrix, cameraPosition,target, up);

  var viewMatrix = cameraMatrix;//mat4.create();

  //mat4.invert(viewMatrix, cameraMatrix);

  var viewProjectionMatrix = mat4.create();

  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
  
  if(!texture_flash)
  {
    wall1.drawCubeTexture(gl, viewProjectionMatrix,programInfo_texture_flash, deltaTime,wallTex);
    wall2.drawCubeTexture(gl, viewProjectionMatrix,programInfo_texture_flash, deltaTime,wallTex);
    ground.drawCubeTexture(gl, viewProjectionMatrix,programInfo_texture_flash, deltaTime,groundTex);
  }
  else
  {
    wall1.drawCubeTextureFlash(gl, viewProjectionMatrix,programInfo_texture_flash, deltaTime,wallTex);
    wall2.drawCubeTextureFlash(gl, viewProjectionMatrix,programInfo_texture_flash, deltaTime,wallTex);
    ground.drawCubeTextureFlash(gl, viewProjectionMatrix,programInfo_texture_flash, deltaTime,groundTex);
  }  
  for(var i =0; i< track.length ; i++)
  {
    track[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  }
  for(var i =0; i< barricades.length ; i++)
  {
    barricades[i].drawCubeTexture(gl, viewProjectionMatrix, programInfo_texture, deltaTime,barricadeTex);
    if(detect_collision(barricades[i].bd_box(), hero.bd_box()))
    {
      game_over();
      return;
    }
  }
  for(var i =0; i< bush.length ; i++)
  {
    bush[i].drawCubeTexture(gl, viewProjectionMatrix, programInfo_texture, deltaTime,bushTex);
    if(detect_collision(bush[i].bd_box(), hero.bd_box()) && flag_b != i)
    {
      start_slow = new Date().getSeconds();
      slow_down=true;
      flag_b= i;
      // console.log('bush',start_slow);
    }
  }
  for(var i =0; i< pole.length ; i++)
  {
    pole[i].drawCubeTexture(gl, viewProjectionMatrix, programInfo_texture, deltaTime,poleTex);
    if ( detect_collision(pole[i].bd_box() ,hero.bd_box()) && flag_p !=i  )
    {
      start_slow = new Date().getSeconds();
      slow_down=true;
      flag_p=i;
      // console.log('pole',start_slow);
    }

  }
  for(var i =0; i< coins.length ; i++)
  {
    coins[i].drawCoin(gl, viewProjectionMatrix, programInfo, deltaTime);
    if(detect_collision(coins[i].bd_box(), hero.bd_box()))
    {
      Coin_count++;
      $("#coincollected").text("Coin: " + (Math.round(Coin_count)));
      coins.splice(i, 1);
      break;
    }
  }

  for(var i =0; i< boot.length ; i++)
  {
    boot[i].drawCubeTexture(gl, viewProjectionMatrix, programInfo_texture, deltaTime,bootTex);
    if(detect_collision(boot[i].bd_box(), hero.bd_box()))
    {
      jump_boost=2.0;
      jump_boost_start_time= new Date().getSeconds();
      boot.splice(i, 1);
      break;
    }
  }
  for(var i =0; i< jetpack.length ; i++)
  {
    jetpack[i].drawCubeTexture(gl, viewProjectionMatrix, programInfo_texture, deltaTime,jetTex);
    if(detect_collision(jetpack[i].bd_box(), hero.bd_box()))
    {
      hero.pos[1]=3.0;
      speed_y = 0.0;
      acc_y=0.0;
      speed=0.4;
      jump=true;
      jet_boost_start=true;
      jet_boost_start_time= new Date().getSeconds();
      jetpack.splice(i, 1);
      break;
    }
  }

  for(var i =0; i< metro.length ; i++)
  {
    metro[i].drawTrainTexture(gl, viewProjectionMatrix, programInfo_texture, deltaTime,trainTex);
    if(detect_above_train( metro[i].bd_box(),hero.bd_box()))
    {
      above_train=true;
      console.log('above train')
      flag_t=i;
      break;
    }
    else if(detect_collision(metro[i].bd_box(), hero.bd_box()) )
    {
      game_over();
      return;
    }
  } 
  hero.drawBody(gl, viewProjectionMatrix, programInfo, deltaTime);
  cop.drawBody(gl, viewProjectionMatrix, programInfo, deltaTime);
  light_count--;
}


// Initialize a shader program, so WebGL knows how to draw our data

function initShaderProgram(gl, vsSource, fsSource) 
{
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
  {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

// creates a shader of the given type, uploads the source and
// compiles it.

function loadShader(gl, type, source) 
{
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
  {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


function detect_collision(a, b) 
{
    return (Math.abs(a.x - b.x) * 2 < (a.width + b.width))   &&
           (Math.abs(a.y - b.y) * 2 < (a.height + b.height)) && 
           (Math.abs(a.z - b.z) * 2 < (a.length + b.length));
}

function detect_above_train(t, b) 
{
    return (Math.abs(t.x - b.x) * 2 < (t.width + b.width))   &&
           (Math.abs(t.z - b.z) * 2 < (t.length + b.length)) && 
           ( t.y + 1.4<  b.y )  && 
           (Math.abs(t.y - b.y) * 2 < (t.height + b.height));
}

function game_over() {
  dead = true;
  if(distance_covered >= 1000)
  {
    $("#canvasDiv").html("<h1>You Won!!</h1>");
  }
  else
  {
    $("#canvasDiv").html("<h1>Game Over</h1>");
  }
  document.getElementById('music').pause();
  document.getElementById('crash').play();
}
