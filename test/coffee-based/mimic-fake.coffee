import { create, init, setThis } from '../../src/index' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない
setThis '.mimic-fake/red' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない

###
化けた赤色のミミック
###
costume '//skins/mimic-fake/red'

###
化けた赤色のミミックはどこに出てくる？
###
create x: 7, y: 5, m: 1, f: 0

###
初期パラメータ
###
created ->
  @family = 'monster'
  @label = '' # HPラベルを非表示にする

###
攻撃されるとミミックになる
###
damaged ->
  await @transform '.mimic/red'
  @label = 'HP: @hp' # HPラベルを表示
