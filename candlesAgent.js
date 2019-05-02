import { histoHour, setApiKey } from 'cryptocompare'
import { Progress, dateToUnix } from './util'
import { cryptocompareApiKey } from './options'

import fetch from 'node-fetch'
global.fetch = fetch

const hourDuration = 60 * 60
const batchSize = 2000

export default function (produceCallback) {
  if (cryptocompareApiKey) {
    setApiKey(cryptocompareApiKey)
  }
  // TODO: Move into a seperate labeler
  let differencePeriods = 48
  function transformer (current, past) {
    if (isNaN(current) || isNaN(past)) return NaN
    else if (current / past > 1.01) return 1
    else if (current / past < 0.995) return -1
    else return 0
  }
  let candleProgress = new Progress('candle', [
    // dateToUnix(new Date('2015-06-29T00:00:00Z')),
    dateToUnix(new Date('2018-06-29T00:00:00Z')),
    new Array(differencePeriods).fill(NaN)
  ])

  async function consumeNewestCandles () {
    let newCandles = []
    let maxTimestamp = dateToUnix()
    let toTimestamp = Math.min(candleProgress.value[0] + hourDuration * batchSize, maxTimestamp)
    let thisBatch = Math.min(Math.floor((maxTimestamp - candleProgress.value[0]) / hourDuration), batchSize)
    if (thisBatch <= 0) return false
    newCandles = await histoHour('ETH', 'USD', { limit: thisBatch, toTs: toTimestamp, exchange: 'Coinbase' })

    for (let candle of newCandles) {
      if (candleProgress.value[0] < candle.time) {
        let transformedValue = transformer(candle.close, candleProgress.value[1][0])
        if (!isNaN(transformedValue)) {
          produceCallback(candle.time - differencePeriods * hourDuration, [transformedValue])
        }
        candleProgress.value = [
          candle.time,
          [candle.close].concat(candleProgress.value[1].slice(0, -1))
        ]
      } else {
        console.log(candleProgress.value[0], candle.time)
      }
    }
    return true
  }

  let timerFunction = async () => {
    let delay = 100
    try {
      if (!await consumeNewestCandles()) {
        delay = 1000
      }
    } catch (error) {
      console.error(error)
      delay = 1000
    }

    setTimeout(timerFunction, delay)
  }
  timerFunction()
}
