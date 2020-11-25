import { loadingSurfaceSet, surfaceLoadedCallbacks } from './skin';
import { default as enchant } from '../enchantjs/enchant';

const cache = new WeakMap<any, Map<string, any>>();

/**
 * Surface にフィルタをかけて新たな Surface を作って返す
 * @param originalSurface フィルタのかかっていない元の enchant.Surface
 * @param filterText CanvasRenderingContext2D::filter に設定できる文字列
 */
export function filterSurface(originalSurface: any, filterText: string) {
  const hit = cache.get(originalSurface)?.get(filterText);
  if (hit) {
    return hit;
  }

  // 新しい Surface を作る
  const _element: HTMLImageElement | HTMLCanvasElement =
    originalSurface._element;
  const { width, height } = _element;
  const filtered = new enchant.Surface(width, height);
  // filter を設定する
  const context: CanvasRenderingContext2D = filtered.context;
  context.filter = filterText;

  // ロード中の場合はロード後まで待つ
  if (loadingSurfaceSet.has(originalSurface)) {
    const curr = surfaceLoadedCallbacks.get(originalSurface) || [];
    surfaceLoadedCallbacks.set(
      originalSurface,
      curr.concat(() => {
        context.filter = filterText;
        context.drawImage(originalSurface._element, 0, 0); // render
      })
    );
  } else {
    context.drawImage(_element, 0, 0); // render
  }

  // キャッシュ
  const sameSurface = cache.get(originalSurface) || new Map<string, any>();
  sameSurface.set(filterText, filtered);

  return filtered;
}
