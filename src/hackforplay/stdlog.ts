import { log } from '@hackforplay/log';

type Self = { name: string };

export function errorInEvent(error: any, self?: Self, eventName?: string) {
  console.error(error);
  const fileName = self ? `modules/${self.name}.js` : 'Unknown';

  // ReferenceError
  if (error instanceof Error && error.name === 'ReferenceError') {
    const varName = error.message.split(' ')[0];
    const message = [
      self ? `${self.name} が` : '',
      eventName ? `${eventName} に` : '',
      `「${varName}」と書いてしまったみたい`,
    ].join(' ');
    return log('error', message, fileName);
  }

  return log('error', `原因不明のエラーです。コンソールを見て下さい`, fileName);
}

export function errorRemoved(name: string, self?: Self) {
  return log(
    'error',
    `${name} は削除されました`,
    self ? `modules/${self.name}.js` : 'Unknown'
  );
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

export function logFromAsset(self: Self, message: string) {
  return log('asset', message, `modules/${self.name}.js`);
}

export function logToDeprecated(name: string) {
  return log(
    'error',
    `${name} is deprecated. It will remove v0.25`,
    '@hackforplay/common'
  );
}
