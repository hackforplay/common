import { create, init, setThis } from '../../src/index' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない
setThis '.player/_1' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない

###
プレイヤーが敵を倒すと経験値が増えていき、2 ** level 以上の経験値が貯まるとレベルが上がるシステム
###
costume '//skin/knight/male'
create x: 7, y: 5, m: 1, f: 0

###
初期パラメータ
###
created ->
  @player = 1 # P1
  @hp = 3
  @atk = 1
  @level = 1
  @exp = 0

###
敵を攻撃したとき（そして、相手の体力が 1 より小さくなったとき）
###
attacked ->
  if _hp < 1
    @exp += 1
    if @exp >= 2 ** @level
      @level += 1
      @exp = 0
      @hp = @level + 2 # 体力は Lv+2
      @atk = @level + 1 # 攻撃力は Lv+1
      log "レベルアップ! 体力が #{@hp} に上がった 攻撃力が #{@atk} に上がった"

