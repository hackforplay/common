// シェーダ定義

export default async function(FragmentShader, VertexShader) {
	FragmentShader.new(
		'sky',
		`
// https://threejs.org/examples/webgl_shaders_sky.html
precision highp float;
precision highp int;
#define saturate(a) clamp( a, 0.0, 1.0 )
vec4 LinearToLinear( in vec4 value ) {
return value;
}
vec4 GammaToLinear( in vec4 value, in float gammaFactor ) {
return vec4( pow( value.xyz, vec3( gammaFactor ) ), value.w );
}
vec4 LinearToGamma( in vec4 value, in float gammaFactor ) {
return vec4( pow( value.xyz, vec3( 1.0 / gammaFactor ) ), value.w );
}
vec4 sRGBToLinear( in vec4 value ) {
return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.w );
}
vec4 LinearTosRGB( in vec4 value ) {
return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.w );
}
vec4 RGBEToLinear( in vec4 value ) {
return vec4( value.rgb * exp2( value.a * 255.0 - 128.0 ), 1.0 );
}
vec4 LinearToRGBE( in vec4 value ) {
float maxComponent = max( max( value.r, value.g ), value.b );
float fExp = clamp( ceil( log2( maxComponent ) ), -128.0, 127.0 );
return vec4( value.rgb / exp2( fExp ), ( fExp + 128.0 ) / 255.0 );
}
vec4 RGBMToLinear( in vec4 value, in float maxRange ) {
return vec4( value.xyz * value.w * maxRange, 1.0 );
}
vec4 LinearToRGBM( in vec4 value, in float maxRange ) {
float maxRGB = max( value.x, max( value.g, value.b ) );
float M      = clamp( maxRGB / maxRange, 0.0, 1.0 );
M            = ceil( M * 255.0 ) / 255.0;
return vec4( value.rgb / ( M * maxRange ), M );
}
vec4 RGBDToLinear( in vec4 value, in float maxRange ) {
return vec4( value.rgb * ( ( maxRange / 255.0 ) / value.a ), 1.0 );
}
vec4 LinearToRGBD( in vec4 value, in float maxRange ) {
float maxRGB = max( value.x, max( value.g, value.b ) );
float D      = max( maxRange / maxRGB, 1.0 );
D            = min( floor( D ) / 255.0, 1.0 );
return vec4( value.rgb * ( D * ( 255.0 / maxRange ) ), D );
}
vec4 emissiveMapTexelToLinear( vec4 value ) { return LinearToLinear( value ); }
vec4 linearToOutputTexel( vec4 value ) { return LinearToLinear( value ); }
varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying float vSunfade;
varying vec3 vBetaR;
varying vec3 vBetaM;
varying float vSunE;
uniform float luminance;
uniform float mieDirectionalG;
uniform vec3 cameraPos;
const float pi = 3.141592653589793238462643383279502884197169;
const float n = 1.0003;
const float N = 2.545E25;
const float rayleighZenithLength = 8.4E3;
const float mieZenithLength = 1.25E3;
const vec3 up = vec3(0.0, 1.0, 0.0);
const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;
const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
const float ONE_OVER_FOURPI = 0.07957747154594767;
float rayleighPhase( float cosTheta )
{
return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
}
float hgPhase( float cosTheta, float g )
{
float g2 = pow( g, 2.0 );
float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
}
const float A = 0.15;
const float B = 0.50;
const float C = 0.10;
const float D = 0.20;
const float E = 0.02;
const float F = 0.30;
const float whiteScale = 1.0748724675633854;
vec3 Uncharted2Tonemap( vec3 x )
{
return ( ( x * ( A * x + C * B ) + D * E ) / ( x * ( A * x + B ) + D * F ) ) - E / F;
}
void main() 
{
float zenithAngle = acos( max( 0.0, dot( up, normalize( vWorldPosition - cameraPos ) ) ) );
float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
float sR = rayleighZenithLength * inverse;
float sM = mieZenithLength * inverse;
vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );
float cosTheta = dot( normalize( vWorldPosition - cameraPos ), vSunDirection );
float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
vec3 betaRTheta = vBetaR * rPhase;
float mPhase = hgPhase( cosTheta, mieDirectionalG );
vec3 betaMTheta = vBetaM * mPhase;
vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );
vec3 direction = normalize( vWorldPosition - cameraPos );
float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
vec3 L0 = vec3( 0.1 ) * Fex;
float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
L0 += ( vSunE * 19000.0 * Fex ) * sundisk;
vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );
vec3 curr = Uncharted2Tonemap( ( log2( 2.0 / pow( luminance, 4.0 ) ) ) * texColor );
vec3 color = curr * whiteScale;
vec3 retColor = pow( color, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );
gl_FragColor.rgb = retColor;
gl_FragColor.a = 1.0;
}
	`
	);

	VertexShader.new(
		'sky',
		`
// https://threejs.org/examples/webgl_shaders_sky.html

precision highp float;
precision highp int;

attribute vec3 position;


uniform mat4 modelMatrix;
uniform mat4 matrix;

uniform vec3 sunPosition;




uniform float rayleigh;
uniform float turbidity;
uniform float mieCoefficient;




varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying float vSunfade;
varying vec3 vBetaR;
varying vec3 vBetaM;
varying float vSunE;


const vec3 up = vec3( 0.0, 1.0, 0.0 );
const float e = 2.71828182845904523536028747135266249775724709369995957;
const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );
const vec3 K = vec3( 0.686, 0.678, 0.666 );
const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );
const float cutoffAngle = 1.6110731556870734;
const float steepness = 1.5;
const float EE = 1000.0;


float sunIntensity( float zenithAngleCos )
{
zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
}


vec3 totalMie( float T )
{
float c = ( 0.2 * T ) * 10E-18;
return 0.434 * c * MieConst;
}


void main() {

vec4 worldPosition = modelMatrix * vec4( position, 1.0 );


vWorldPosition = worldPosition.xyz;

gl_Position = matrix * vec4( position, 1.0 );

vSunDirection = normalize( sunPosition );
vSunE = sunIntensity( dot( vSunDirection, up ) );
vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );
float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );
vBetaR = totalRayleigh * rayleighCoefficient;
vBetaM = totalMie( turbidity ) * mieCoefficient;
}
	`
	);

	FragmentShader.new(
		'fragment-shadow',
		`
precision mediump float;

varying vec2 v_uv;
varying vec4 v_position;

uniform vec4 uvScale;

uniform sampler2D texture;

vec4 toRGBA(float depth) {
float r = depth;
float g = fract(r * 255.0);
float b = fract(g * 255.0);
float coef = 1.0 / 255.0;
r -= g * coef;
g -= b * coef;
return vec4(r, g, b, 1.0);
}


void main(void) {

// normalized device coordinates
float ndc = v_position.z / v_position.w;

// -1~+1 -> 0~1
float depth = (ndc + 1.0) * 0.5;

vec4 color = toRGBA(depth);

color.a = texture2D(texture, uvScale.xy + v_uv * uvScale.zw).a;

gl_FragColor = color;

}

	`
	);

	FragmentShader.new(
		'fragment-shadow2',
		`
precision mediump float;


uniform sampler2D texture;
uniform sampler2D texture2;

uniform vec4 uvScale;

varying vec2 v_uv;
varying vec4 v_texcoord;
varying vec4 v_depth;

float getDepth(vec3 RGB) {
const float rMask = 1.0;
const float gMask = 1.0 / 255.0;
const float bMask = 1.0 / (255.0 * 255.0);
float depth = dot(RGB, vec3(rMask, gMask, bMask));
return depth;
}


void main(void) {

vec4 depthTexture = texture2DProj(texture2, v_texcoord);


float shadow = getDepth(depthTexture.xyz);

vec4 depthColor = vec4(1.0);


vec4 result = texture2D(texture, uvScale.xy + v_uv * uvScale.zw);


if (v_depth.w > 0.0) {


float lightCoord = (v_depth.z / v_depth.w + 1.0) * 0.5;
if ((lightCoord - 0.0001) > shadow) {
depthColor = vec4(0.5, 0.5, 0.5, 1.0);
}


}
gl_FragColor = result * depthColor;

}

	`
	);

	VertexShader.new(
		'vertex-simple',
		`
uniform mat4 matrix;
attribute vec3 position;
void main() {
gl_Position = matrix * vec4(position, 1.0);
}`
	);

	VertexShader.new(
		'vs2',
		'\n\t\tuniform mat4 matrix;\n\t\tattribute vec3 position;\n\t\tvoid main() {\n\t\t\tgl_Position = matrix * vec4(position, 1.0);\n\t\t}\n\t\t'
	);

	FragmentShader.new(
		'fs2',
		'\n\t\tprecision mediump float;\n\t\tuniform vec4 color;\n\t\tvoid main() {\n\t\t\tgl_FragColor = color;\n\t\t}\n\t\t'
	);

	VertexShader.new(
		'map',
		'\n\t\tuniform mat4 matrix;\n\t\tattribute vec3 position;\n\t\tattribute vec2 uv;\n\t\tvarying vec2 v_uv;\n\t\tvoid main() {\n\t\t\tv_uv = uv;\n\t\t\tgl_Position = matrix * vec4(position, 1.0);\n\t\t}\n\t\t'
	);

	FragmentShader.new(
		'map',
		'\n\t\tprecision mediump float;\n\t\tuniform sampler2D texture;\n\t\tvarying vec2 v_uv;\n\t\tvoid main() {\n\t\t\tgl_FragColor = texture2D(texture, v_uv);\n\t\t\t\n\t\t\t//if (abs(v_uv.x - 0.5) > 0.48 || abs(v_uv.y - 0.5) > 0.48) {\n\t\t\t\t//\tgl_FragColor = vec4(0, 0, 0, 0.5);\n\t\t\t\t//}\n\t\t\t\n\t\t\t\n\t\t}\n\t\t'
	);

	VertexShader.new(
		'vertex-shadow2',
		`

attribute vec3 position;
attribute vec2 uv;
uniform mat4 matrix;

uniform mat4 mMatrix;

uniform mat4 matrixTex;

uniform mat4 matrixLight;


varying vec4 v_texcoord;
varying vec4 v_depth;
varying vec2 v_uv;

void main(void){
v_uv = uv;

v_texcoord = matrixTex * vec4((mMatrix * vec4(position, 1.0)).xyz, 1.0);

v_depth = matrixLight * vec4(position, 1.0);

gl_Position = matrix * vec4(position, 1.0);
}
`
	);

	VertexShader.new(
		'vertex-shadow',
		`
attribute vec3 position;
uniform   mat4 matrix;

attribute vec2 uv;

varying vec2 v_uv;
varying vec4 v_position;

void main(void){

v_uv = uv;
v_position = matrix * vec4(position, 1.0);

gl_Position = v_position;
}
`
	);

	VertexShader.new(
		'texture-simple',
		`


uniform mat4 matrix;

attribute vec3 position;

attribute vec2 uv;
varying vec2 v_uv;
varying vec3 v_position;


void main() {

v_uv = uv;

gl_Position = matrix * vec4(position, 1.0);


v_position = gl_Position.xyz;

}


`
	);

	VertexShader.new(
		'vs-texture',
		`

uniform mat4 matrix;

attribute vec3 position;

attribute vec2 uv;
varying vec2 v_uv;


void main() {

v_uv = uv;

gl_Position = matrix * vec4(position, 1.0);

}


`
	);

	FragmentShader.new(
		'fragment-simple',
		`

precision mediump float;
uniform vec4 color;

void main() {
gl_FragColor = color;
}

`
	);

	FragmentShader.new(
		'texture-simple',
		`
precision mediump float;

uniform float opacity;

uniform vec4 color;
uniform sampler2D texture;
varying vec2 v_uv;
varying vec3 v_position;

const float border = 0.48;

void main() {
vec4 result = texture2D(texture, v_uv);

// 半透明はダメ
result.a = step(0.5, result.a);
result *= opacity;

gl_FragColor = result;
}
`
	);

	FragmentShader.new(
		'fs-block',
		`

precision mediump float;

uniform sampler2D texture;
varying vec2 v_uv;

void main() {
vec4 result;
vec4 color = texture2D(texture, v_uv);

color.a = 1.0;


float x = max(0.0, abs(v_uv.x - 0.5) - 0.45);
float y = max(0.0, abs(v_uv.y - 0.5) - 0.45);

float a = (x + y) * 3.0;

color += a;

// color.a = step(0.5, color.r);

gl_FragColor = color;
}
`
	);

	VertexShader.new(
		'fog',
		`
attribute vec3 position;
attribute vec2 uv;

uniform mat4 matrix;
uniform mat4 matrix2;

uniform float fogStart;
uniform float fogEnd;


varying vec2 varyingUV;
varying vec3 varyingPosition;



void main() {



varyingUV = uv;

gl_Position = matrix * vec4(position, 1);

varyingPosition = (matrix2 * vec4(position, 1)).xyz;
}


`
	);

	FragmentShader.new(
		'fog',
		`
precision mediump float;

uniform sampler2D texture;

uniform vec2 size;


uniform vec3 eyePosition;


varying vec2 varyingUV;
varying vec3 varyingPosition;

void main() {



vec4 color = texture2D(texture, varyingUV);


float s = max(size.x, size.y) / 2.0 + 220.0;

// gl_FragColor = color;


float d = length(varyingPosition - eyePosition);

float near = s;
float far = near + 100.0;




float f = (far - d) / (far - near);
f = clamp(f, 0.0, 1.0);


color *= f;




gl_FragColor = color;

}
`
	);
}
