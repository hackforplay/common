import { create, init, setThis } from '../../src/index' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない
setThis '.rock/gray' # このコードは全てのセルの実行直前に自動挿入される。表にはかかれない

###
いわ
###
costume '//skins/rock/gray'

###
横に並んだいわを置く
###
# inline
create x: x, y: 5, m: 1, f: 0 for x in [0..14]

# block statement
for x in [0..14]
  create x: x, y: 5, m: 1, f: 0

# random y
create x: x, y: rand [0..9], m: 1, f: 0 for x in [0..14]
