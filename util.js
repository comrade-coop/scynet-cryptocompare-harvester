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

export function dateToUnix (date) {
  return Math.floor((date || new Date()).getTime() / 1000)
}

export function unixToDate (unix) {
  return new Date(unix * 1000)
}

export class Progress {
  constructor (name, defaultValue = {}) {
    this.name = name
    this.hasValue = false
    this._value = defaultValue
    this.storeQueued = false
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
      try {
        this._value = JSON.parse(fs.readFileSync(this.name + '.progress'))
      } catch (error) {
        console.error('Error while reading progress', error)
      }
    }
    this.hasValue = true
    return this
  }

  store () {
    if (this.storeQueued) return
    this.storeQueued = true
    setTimeout(() => {
      fs.writeFile(this.name + '.progress', JSON.stringify(this._value), (error) => {
        if (error) {
          console.error('Error while saving progress', error)
        }
        this.storeQueued = false
      })
    }, 100)
    return this
  }
}
