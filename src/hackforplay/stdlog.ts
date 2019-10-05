import { log } from '@hackforplay/log';
import { errorJp } from './error-jp';

type Self = { name: string };

export function errorInEvent(error: any, self?: Self, eventName?: string) {
  const errorName = getName(error);
  const message =
    [
      self ? `${self.name} が` : '',
      eventName ? `${eventName} に` : '',
      errorName ? `「${errorName}」` : ''
    ].join(' ') + 'みたい';
  error && console.error(error);
  return log('error', message, self ? `modules/${self.name}.js` : 'Unknown');
}

export function errorRemoved(name: string, self?: Self) {
  return log(
    'error',
    `${name} は削除されました`,
    self ? `modules/${self.name}.js` : 'Unknown'
  );
}

export function getName(error: any) {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return errorJp.get(error.name) || error.name;
  if (typeof error === 'undefined') return '';
  if (error === null) return '';
  if ('name' in error) return error['name'];
  return '';
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
