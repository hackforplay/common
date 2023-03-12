import { register } from '.';

register(getGlobal());

function getGlobal() {
  try {
    return window;
  } catch (error) {}

  try {
    return global;
  } catch (error) {}

  try {
    return self;
  } catch (error) {}
}
