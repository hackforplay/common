import { create, init, setThis } from '../../src/index' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない
setThis '.wizard/black' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない

###
黒色の魔法使い
###
costume '//skins/wizard/black'

###
黒色の魔法使いはどこに出てくる？
###
create x: 7, y: 5, m: 1, f: 0

###
初期パラメータ
###
created ->
  @hp = 3
  @atk = 1
  @family = 'monster'

###
ランダムにテレポートして黒色のスライムを召喚する
###
updated ->
  @x = rand [0..14]
  @y = rand [0..9]
  await turn rand [0..3]
  await wait 2
  await attack 1
  @summon name: '.slime/black', pos: @posf
  await wait 1

###
やられたら青色の宝石を落とす
###
damaged ->
  if @hp < 1
    @summon name: '.jewel/blue', x: @x, y: @y
