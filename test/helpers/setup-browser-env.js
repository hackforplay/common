// https://github.com/avajs/ava/blob/master/docs/recipes/browser-testing.md#setup-browser-env
import browserEnv from 'browser-env';
import { Image } from 'canvas-prebuilt';
import register from './timers';
const options = {
  beforeParse(window) {
    // window.alert = window.console.log.bind(window.console);
    window.focus = () => {};
    window.Image = Image;
    window.Map = global.Map; // https://github.com/hackforplay/common/issues/10
    register(global);
    register(window);
  }
};
browserEnv(options);
