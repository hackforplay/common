// https://github.com/avajs/ava/blob/master/docs/recipes/browser-testing.md#setup-browser-env
import browserEnv from "browser-env";
import { Image } from 'canvas-prebuilt';
const options = {
  beforeParse(window) {
    // window.alert = window.console.log.bind(window.console);
    window.focus = () => {};
    window.Image = Image;
  }
};
browserEnv(options);
