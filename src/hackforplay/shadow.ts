import { io } from 'socket.io-client';

const Hack = require('./hack').default; // eslint-disable-line

export function startShadowServer() {
  const socket = io(Hack.shadowServerUrl);
  Hack._shadowServerSocket = socket; // ステージから直接触れるように露出させておく
}
