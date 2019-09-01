import { BehaviorSubject } from 'rxjs';

/**
 * 実行環境側で用意される API の型情報だけを用意したもの
 */

const _global = new Function('return this')();
if (typeof _global.feeles !== 'object') {
  throw new Error('feeles is not defined');
}

export const feeles = _global.feeles as Feeles;

export interface IButtonInput {
  up: boolean;
  right: boolean;
  down: boolean;
  left: boolean;
  a: boolean;
}

export interface Feeles {
  code$: BehaviorSubject<string>;
  pause$: BehaviorSubject<boolean>;
  input$: BehaviorSubject<IButtonInput>;
  emphasizeCode: () => void;
  audioContextReady: Promise<AudioContext>;
  /**
   * Deprecated
   */
  env?: {
    USER_UUID: string;
    VERSION_UUID: string;
  };
  connected: Promise<{ port: MessagePort }>;
  fetch?: (name: string) => Promise<any>;
  fetchDataURL?: (name: string) => Promise<any>;
  fetchText?: (name: string) => Promise<any>;
  fetchArrayBuffer?: (name: string) => Promise<any>;
  resolve?: (name: string) => Promise<any>;
  saveAs?: (blob: Blob, name: string) => Promise<any>;
  reload?: () => Promise<any>;
  replace?: (url: string) => Promise<any>;
  openReadme?: (fileName: string) => Promise<any>;
  closeReadme?: () => Promise<any>;
  openMedia?: (params: any) => Promise<any>;
  closeMedia?: () => Promise<any>;
  openCode?: (fileName: string) => Promise<any>;
  closeCode?: () => Promise<any>;
  openEditor?: (fileName: string) => Promise<any>;
  closeEditor?: () => Promise<any>;
  /**
   * Deprecated
   */
  setAlias?: (name: string, ref: any) => Promise<any>;
  runCode?: () => Promise<any>;
  install?: (name: string) => Promise<any>;
  /**
   * Deprecated
   */
  ipcRenderer?: any;
  setTimeout?: (func: () => void, delay: number) => number;
  clearTimeout?: (timeoutId: number) => void;
  setInterval?: (func: () => void, delay: number) => number;
  clearInterval?: (intervalId: number) => void;
  // Feeles の onMessage を dispatch する
  dispatchOnMessage?: (data: any) => void;
  // 親ウィンドウで URL (Same Domain) を window.open する
  openWindow?: (
    url: string,
    target: string,
    features: any,
    replace: any
  ) => void;
  // error を IDE に投げる
  throwError?: (error: any) => void;
  // eval する
  eval?: (code: string) => void;
}

export const code$ = feeles.code$;
export const pause$ = feeles.pause$;
export const input$ = feeles.input$;
export const emphasizeCode = feeles.emphasizeCode;
export const audioContextReady = feeles.audioContextReady;
export const env = feeles.env || { VERSION_UUID: '', USER_UUID: '' };
export const connected = feeles.connected;
export const fetch = feeles.fetch;
export const fetchDataURL = feeles.fetchDataURL;
export const fetchText = feeles.fetchText;
export const fetchArrayBuffer = feeles.fetchArrayBuffer;
export const resolve = feeles.resolve;
export const saveAs = feeles.saveAs;
export const reload = feeles.reload;
export const replace = feeles.replace;
export const openReadme = feeles.openReadme;
export const closeReadme = feeles.closeReadme;
export const openMedia = feeles.openMedia;
export const closeMedia = feeles.closeMedia;
export const openCode = feeles.openCode;
export const closeCode = feeles.closeCode;
export const openEditor = feeles.openEditor;
export const closeEditor = feeles.closeEditor;
/**
 * Deprecated
 */
export const setAlias = feeles.setAlias;
export const runCode = feeles.runCode;
export const install = feeles.install;
/**
 * Deprecated
 */
export const ipcRenderer = feeles.ipcRenderer;
export const setTimeout = feeles.setTimeout;
export const clearTimeout = feeles.clearTimeout;
export const setInterval = feeles.setInterval;
export const clearInterval = feeles.clearInterval;
// Feeles の onMessage を dispatch する
export const dispatchOnMessage = feeles.dispatchOnMessage;
// 親ウィンドウで URL (Same Domain) を window.open する
export const openWindow = feeles.openWindow;
// error を IDE に投げる
export const throwError = feeles.throwError;
// eval する
export const eval_ = feeles.eval;
