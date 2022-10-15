import test from 'ava';
import { getTransformDefaultProps } from './transform-default-props';

test('getTransformDefaultProps', t => {
  const props = getTransformDefaultProps();
  t.deepEqual(props, {
    _atk: undefined,
    _collisionFlag: undefined,
    _isKinematic: undefined,
    _penetrate: undefined,
    damage: 0,
    speed: 1,
    opacity: 1,
    velocityX: 0,
    velocityY: 0,
    accelerationX: 0,
    accelerationY: 0,
    mass: 1,
    skill: '',
    fieldOfView: 1,
    lengthOfView: 10
  });
});
