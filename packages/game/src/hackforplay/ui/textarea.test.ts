import test from 'ava';
import { convertHankakuToZenkaku } from './textarea';

const testCases = [
  ['Hello World!', 'Ｈｅｌｌｏ　Ｗｏｒｌｄ！'],
  ['Multi\nLine\nTest', 'Ｍｕｌｔｉ\nＬｉｎｅ\nＴｅｓｔ'],
  [
    ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~',
    '　！＂＃＄％＆＇（）＊＋，－．／０１２３４５６７８９：；＜＝＞？＠ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ［＼］＾＿｀ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ｛｜｝～'
  ]
] as const;

test('convertHankakuToZenkaku', t => {
  for (const [input, output] of testCases) {
    t.is(convertHankakuToZenkaku(input), output);
  }
});
