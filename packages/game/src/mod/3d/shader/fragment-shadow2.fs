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
