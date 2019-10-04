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

export function logFromUser(...line: any[]) {
  const _ = window.__sandbox_context_name || 'Unknown';
  switch (line.length) {
    case 0:
      return;
    case 1:
      return log('info', line[0], _);
    case 2:
      return log(line[0], line[1], _);
    case 3:
      return log(...line);
    default:
      log('error', 'log() の中身は３つでいいよ', _);
      return log(...line);
  }
}
