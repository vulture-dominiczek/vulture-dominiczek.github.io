//Based on https://www.youtube.com/watch?v=7djqZcyTZKM

var canvas = document.getElementById("canvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize the GL context
var gl = canvas.getContext('webgl');
if(!gl){
	console.error("Unable to initialize WebGL.");
}

//Time
var time = 0.0;

//************** Shader sources **************

var vertexSource = `
attribute vec2 position;
void main() {
	gl_Position = vec4(position, 0.0, 1.0);
}
`;

var fragmentSource = `
precision highp float;

#define AA

uniform float width;
uniform float height;

vec2 resolution = vec2(width, height);
uniform float time;

const float PI = 3.14;
const float TWO_PI = 2.0 * PI;

void main(){

	vec3 col1 = vec3(1.0, 1.0, 1.0);
	vec3 col2 = vec3(0.2, 0.7, 1.0);

	float tilingFrequency = 1.0;
	vec2 centre = vec2(0.5, 0.5);

	vec2 fC = gl_FragCoord.xy;

	vec3 col = vec3(0);

	#ifdef AA
	for(int i = -1; i <= 1; i++) {
		for(int j = -1; j <= 1; j++) {

			fC = gl_FragCoord.xy+vec2(i,j)/3.0;

			#endif

			//Normalized pixel coordinates (from 0 to 1)
			vec2 uv = fC/resolution.xy;

			//The ratio of the width and height of the screen
			float widthHeightRatio = resolution.x/resolution.y;

			//Position of fragment relative to centre of screen
			vec2 pos = centre - uv;
			//Adjust y by ratio for uniform transforms
			pos.y /= widthHeightRatio;

			//Distance from centre. pow adjusts the distance wrt position, creating a tunnel effect 
			float dist = pow(length(pos), 0.15);

			//Zoom out
			dist *= 10.0;

			//Angle of position around centre
			float angle = atan(pos.y, pos.x);
			//From [-PI; PI] to [0; 1]
			angle = (angle + PI) / TWO_PI;

			//Combine distance and angle
			dist += angle;

			//Move in time
			dist -= time;

			int value = int(floor(fract(dist * tilingFrequency) + 0.55));

			if(value == 0){col += col1;};
			if(value == 1){col += col2;};

			#ifdef AA
		}
	}

	col /= 9.0;

	#endif

	//Fragment colour
	gl_FragColor = vec4(col, 1.0);
}
`;

//************** Utility functions **************
window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.uniform1f(widthHandle, window.innerWidth);
	gl.uniform1f(heightHandle, window.innerHeight);
}

//Compile shader and combine with source
function compileShader(shaderSource, shaderType){
	var shader = gl.createShader(shaderType);
	gl.shaderSource(shader, shaderSource);
	gl.compileShader(shader);
	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
		throw "Shader compile failed with: " + gl.getShaderInfoLog(shader);
	}
	return shader;
}

//From https://codepen.io/jlfwong/pen/GqmroZ
//Utility to complain loudly if we fail to find the attribute/uniform
function getAttribLocation(program, name) {
	var attributeLocation = gl.getAttribLocation(program, name);
	if (attributeLocation === -1) {
		throw 'Cannot find attribute ' + name + '.';
	}
	return attributeLocation;
}

function getUniformLocation(program, name) {
	var attributeLocation = gl.getUniformLocation(program, name);
	if (attributeLocation === -1) {
		throw 'Cannot find uniform ' + name + '.';
	}
	return attributeLocation;
}

//************** Create shaders **************

//Create vertex and fragment shaders
var vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
var fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);

//Create shader programs
var program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

gl.useProgram(program);

//Set up rectangle covering entire canvas 
var vertexData = new Float32Array([
	-1.0,  1.0, 	// top left
	-1.0, -1.0, 	// bottom left
	1.0,  1.0, 	// top right
	1.0, -1.0, 	// bottom right
]);

//Create vertex buffer
var vertexDataBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

// Layout of our data in the vertex buffer
var positionHandle = getAttribLocation(program, 'position');

gl.enableVertexAttribArray(positionHandle);
gl.vertexAttribPointer(positionHandle,
	2, 				// position is a vec2 (2 values per component)
	gl.FLOAT, // each component is a float
	false, 		// don't normalize values
	2 * 4, 		// two 4 byte float components per vertex (32 bit float is 4 bytes)
	0 				// how many bytes inside the buffer to start from
);

//Set uniform handle
var timeHandle = getUniformLocation(program, 'time');
var widthHandle = getUniformLocation(program, 'width');
var heightHandle = getUniformLocation(program, 'height');

gl.uniform1f(widthHandle, window.innerWidth);
gl.uniform1f(heightHandle, window.innerHeight);

var lastFrame = Date.now();
var thisFrame;

function draw(){
	
  //Update time
	thisFrame = Date.now();
  time += (thisFrame - lastFrame)/770;	
	lastFrame = thisFrame;
	
	//Send uniforms to program
	gl.uniform1f(timeHandle, time);
	//Draw a triangle strip connecting vertices 0-4
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	requestAnimationFrame(draw);
}

draw();