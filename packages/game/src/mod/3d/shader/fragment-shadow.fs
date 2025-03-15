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
