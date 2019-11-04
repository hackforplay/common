import { create, init, setThis } from '../../src/index' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない
setThis '.dracula/black' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない

###
黒色のドラキュラ
###
costume '//skins/dracula/black'

###
黒色のドラキュラはどこに出てくる？
###
create x: 7, y: 5, m: 1, f: 0

###
初期パラメータ
###
created ->
  @hp = 10
  @atk = 1
  @family = 'monster'
  # bumped を使うので、視界の設定は使わない

###
うごき
###
updated ->
  @invinsible = true
  await @chase '.player/_1' # プレイヤーの前でさらに一歩進もうとしたとき、 bumped に移る

###
プレイヤーとぶつかったら、コウモリ状態ではなくなって、攻撃してくる
###
bumped ->
  if _is '.player/_1'
    await @wait 0.5
    @invinsible = false
    await @attack 1
    await @wait 1

###
やられたとき銀色の宝石を落とす
###
damaged ->
  @summon name: '.jewel/silver', x: @x, y: @y
