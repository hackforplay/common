const DOT = 12; // PixelMplus フォントのドット幅

/**
 * 縁取り線の幅を取得する
 */
export function getBorderWidth(fontSize: number) {
  return Math.ceil(fontSize / DOT); // 1 ドット分のピクセル数
}

/**
 * 文字を輪郭付きで描画する
 * @param context getContext('2d') の戻り値
 * @param fontSize font に指定しているフォントサイズ
 * @param textColor 文字色
 * @param borderColor 文字の輪郭色
 * @param text 文字
 * @param x 描画する位置 (x)
 * @param y 描画する位置 (y)
 */
export function fillTextWithBorders(
  context: CanvasRenderingContext2D,
  fontSize: number,
  textColor: string,
  borderColor: string,
  text: string,
  x: number,
  y: number
) {
  const dpp = getBorderWidth(fontSize);

  // 座標を整数にする
  x = Math.round(x);
  y = Math.round(y);

  context.font = `${fontSize}px mplus`;
  context.fillStyle = borderColor;
  context.fillText(text, x - dpp, y - dpp); // 左上
  context.fillText(text, x, y - dpp); // 上
  context.fillText(text, x + dpp, y - dpp); // 右上
  context.fillText(text, x - dpp, y);
  context.fillText(text, x + dpp, y);
  context.fillText(text, x - dpp, y + dpp);
  context.fillText(text, x, y + dpp);
  context.fillText(text, x + dpp, y + dpp);

  context.fillStyle = textColor;
  context.fillText(text, x, y); // 中央
}
