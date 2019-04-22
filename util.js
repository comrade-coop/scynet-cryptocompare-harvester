import fs from 'fs'

export function convertCryptocompareObject (array) {
  let [exchange, primary, secondory, direction, tickString, timestamp, p1, price, u1] = array
  let tick = tickString | 0
  return {
    exchange,
    pair: [primary, secondory],
    direction: direction === 1 ? 'UP' : 'DOWN',
    lastTrade: [p1, u1],
    price,
    tick,
    timestamp: new Date(1000 * timestamp)
  }
}

export function readFileOr (file, els) {
  if (fs.existsSync(file)) {
    return fs.readFileSync(file) | 0
  } else {
    return els
  }
}
