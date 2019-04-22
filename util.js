import fs from 'fs'

export function convertCryptocompareObject (array) {
  let [exchange, primary, secondory, direction, tick, timestamp, p1, price, u1] = array
  return {
    exchange: exchange,
    pair: [primary, secondory],
    direction: direction === 1 ? 'UP' : 'DOWN',
    lastTrade: [p1, u1],
    price: price,
    tick: tick | 0,
    timestamp: new Date(1000 * timestamp)
  }
}

export class Progress {
  constructor (name, defaultValue = 0) {
    this.name = name
    this.hasValue = false
    this._value = defaultValue
  }

  get value () {
    if (!this.hasValue) {
      this.read()
    }
    return this._value
  }

  set value (value) {
    this._value = value
    this.hasValue = true
    this.store()
  }

  read () {
    if (fs.existsSync(this.name + '.progress')) {
      this._value = fs.readFileSync(this.name + '.progress')
    }
    this.hasValue = true
    return this
  }

  store () {
    fs.writeFile(this.name + '.progress', this._value)
    return this
  }
}
