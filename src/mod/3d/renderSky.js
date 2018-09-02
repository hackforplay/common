import gl from 'mod/3d/gl';

import { sky } from 'mod/3d/definePrimitive';
import Program from 'mod/3d/program';
import { Vec3, Matrix } from 'mod/3d/math';
import Camera3D from 'mod/3d/camera3D';

function renderSky() {
	const d = 100;

	gl.disable(gl.DEPTH_TEST);

	Program.use('sky');

	const matrixVP = Camera3D.active.matrixVP;

	// const skyPos = new Vec3(Hack.map.width / 2, 0, Hack.map.height / 2);

	const skyPos = Camera3D.active.target;

	// 視線の先に空を配置
	const matrixT = Matrix.translate(skyPos.toArray());

	const matrixMVP = Matrix.mulRow(matrixT, matrixVP);

	const sunPos = new Vec3();

	// inclination = Math.abs(Math.sin(game.rootScene.age * 0.01));

	const inclination = 0.59;

	const { position, target } = Camera3D.get('light');
	const angle = Vec3.sub(position, target);
	const sunAngle = Math.atan2(angle.x, angle.z);

	// azimuth == sunAngle

	var theta = Math.PI * (inclination - 0.5);
	var phi = -sunAngle + Math.PI / 2;

	sunPos.x = d * Math.cos(phi);
	sunPos.y = d * Math.sin(phi) * Math.sin(theta);
	sunPos.z = d * Math.sin(phi) * Math.cos(theta);

	sunPos.y = 10;

	Program.uniform('mat4', 'modelMatrix', false, matrixT);
	Program.uniform('mat4', 'matrix', false, matrixMVP);

	Program.uniform('vec3', 'sunPosition', sunPos.toArray());
	Program.uniform('vec3', 'cameraPos', skyPos.toArray());

	Program.uniform('float', 'rayleigh', 2);
	Program.uniform('float', 'turbidity', 10);
	Program.uniform('float', 'mieCoefficient', 0.005);

	Program.uniform('float', 'mieDirectionalG', 0.8);
	Program.uniform('float', 'luminance', 0.6);
	Program.uniform('float', 'inclination', inclination);

	sky.draw();
}

export default renderSky;
