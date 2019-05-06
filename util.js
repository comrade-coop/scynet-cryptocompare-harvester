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

class IProgress {
  split () {
    if (typeof this.value === 'object' && !Array.isArray(this.value)) {
      let result = { _: this }
      for (let key in this.value) {
        if (this.value.hasOwnProperty(key)) {
          result[key] = new SubProgress(key, this).split()
        }
      }
      return result
    } else {
      return this
    }
  }

  valueOf () {
    return this.value
  }

  toString () {
    return this.value
  }
}

export class Progress extends IProgress {
  constructor (name, defaultValue = {}) {
    super()
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

export class SubProgress extends IProgress {
  constructor (name, parent) {
    super()
    this.name = name
    this.parent = parent
  }

  get value () {
    return this.parent.value[this.name]
  }

  set value (value) {
    this.parent.value[this.name] = value
    this.parent.store()
  }

  read () {
    this.parent.read()
    return this
  }

  store () {
    this.parent.store()
    return this
  }
}
