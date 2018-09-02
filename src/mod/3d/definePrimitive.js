import { Plane2D, Plane2DD, Model2D, SkyShpere } from 'mod/3d/primitive';

var plane2 = new Plane2DD(480 * 0.3, 320 * 0.3);
var plane = new Plane2D();
var model2d = new Model2D();

const sky = new SkyShpere(20, 20, 300);

export { plane2, plane, model2d, sky };
