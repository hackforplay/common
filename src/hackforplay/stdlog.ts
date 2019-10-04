import { log } from '@hackforplay/log';

type Self = { name: string };

export function errorInEvent(error: any, self?: Self, eventName?: string) {
  const message =
    [
      self ? `${self.name} が` : '',
      eventName ? `${eventName} に` : '',
      error ? `「${error.name}」` : ''
    ].join(' ') + 'エラーをおこしたみたい';
  error && console.error(error);
  return log('error', message, self ? `modules/${self.name}.js` : 'Unknown');
}
