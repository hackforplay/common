import { create, init, setThis } from '../../src/index' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない
setThis '.mimic/red' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない

###
赤色のミミック
###
costume '//skins/mimic/red'

###
赤色のミミックは、赤色のばけたミミックから作られるよ
###

###
初期パラメータ
###
created ->
  @hp = 4
  @atk = 1
  @family = 'monster'
  @fod = 10
  @fov = 1

###
うごき
###
updated ->
  await @find '.player/_1' # プレイヤー１を探す
	await @wait 1
	await @walk 1
	await @turn rand [0..3]

###
プレイヤーを見つけたら、襲いかかってくる
###
found ->
  await @watch _ # プレイヤー１の方を見る
  await @walk 1
  await @await find _name # 再起的に探す

###
やられたとき青色の宝石を落とす
###
damaged ->
  if @hp < 1
    await @summon name: '.jewel/blue', x: @x, y: @y
