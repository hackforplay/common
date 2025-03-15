import test from 'ava';
import { Direction, turn, random4, random8 } from './direction';
import Vector2 from './math/vector2';

test('turn should return the correct direction', t => {
  // Test turning to absolute directions
  t.is(turn(Direction.Up, Direction.Right), Direction.Right);
  t.is(turn(Direction.Right, Direction.Down), Direction.Down);
  t.is(turn(Direction.Down, Direction.Left), Direction.Left);
  t.is(turn(Direction.Left, Direction.Up), Direction.Up);

  // Test turning right hand
  t.is(turn(Direction.Up, Direction.RightHand), Direction.Right);
  t.is(turn(Direction.Right, Direction.RightHand), Direction.Down);
  t.is(turn(Direction.Down, Direction.RightHand), Direction.Left);
  t.is(turn(Direction.Left, Direction.RightHand), Direction.Up);

  // Test turning left hand
  t.is(turn(Direction.Up, Direction.LeftHand), Direction.Left);
  t.is(turn(Direction.Left, Direction.LeftHand), Direction.Down);
  t.is(turn(Direction.Down, Direction.LeftHand), Direction.Right);
  t.is(turn(Direction.Right, Direction.LeftHand), Direction.Up);

  // Test turning behind
  t.is(turn(Direction.Up, Direction.Behind), Direction.Down);
  t.is(turn(Direction.Right, Direction.Behind), Direction.Left);
  t.is(turn(Direction.Down, Direction.Behind), Direction.Up);
  t.is(turn(Direction.Left, Direction.Behind), Direction.Right);
});

test('turn should return random direction', t => {
  const directions = [
    Direction.Up,
    Direction.Right,
    Direction.Down,
    Direction.Left
  ];

  // Test random direction
  const randomDirection = turn(Direction.Up, Direction.Random);
  t.true(directions.includes(randomDirection));
});

test('random4 should return a Vector2 with correct values', t => {
  const vectors = [
    new Vector2(0, -1),
    new Vector2(1, 0),
    new Vector2(0, 1),
    new Vector2(-1, 0)
  ];

  // Test random4 function
  const randomVector = random4();
  const contains = vectors.some(
    vector => vector.x === randomVector.x && vector.y === randomVector.y
  );
  t.true(contains);
});

test('random8 should return a Vector2 with correct values', t => {
  const vectors = [
    new Vector2(-1, -1),
    new Vector2(0, -1),
    new Vector2(1, -1),
    new Vector2(1, 0),
    new Vector2(1, 1),
    new Vector2(0, 1),
    new Vector2(-1, 1),
    new Vector2(-1, 0)
  ];

  // Test random8 function
  const randomVector = random8();
  const contains = vectors.some(
    vector => vector.x === randomVector.x && vector.y === randomVector.y
  );
  t.true(contains);
});
