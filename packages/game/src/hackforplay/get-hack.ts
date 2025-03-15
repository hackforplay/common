import enchant from '../enchantjs/enchant';

export function getHack(): any {
  self.Hack = self.Hack || new enchant.EventTarget();
  return self.Hack;
}
