import { histoHour, setApiKey } from 'cryptocompare'
import { Progress, dateToUnix } from './util'
import { cryptocompareApiKey } from './options'
import { addProducer } from './producer'

import fetch from 'node-fetch'
global.fetch = fetch

const hourDuration = 60 * 60
const maxBatchSize = 2000
const labelPeriods = 48
const highThreshold = 0.01
const lowThreshold = 0.005

function getLabel (pastPrice, highSince, lowSince) {
  if (isNaN(pastPrice) || isNaN(highSince) || isNaN(lowSince)) return undefined

  if ((highSince - pastPrice) / pastPrice >= highThreshold && (pastPrice - lowSince) / pastPrice <= lowThreshold) return 1
  else return 0
}

export function initialize () {
  if (cryptocompareApiKey) {
    setApiKey(cryptocompareApiKey)
  }

  const labelCallback = addProducer('331d591b-184d-4e7c-b075-9841181c05c1', [1])
  const dataCallback = addProducer('30bdf7fc-8c8d-4de0-b0cf-ef65fffa7844', [6])

  let { timestampReached, window } = new Progress('candle-v1', {
    timestampReached: dateToUnix(new Date('2015-06-29T00:00:00Z')), // '2018-06-29T00:00:00Z'
    window: {
      close: new Array(labelPeriods).fill(undefined),
      high: new Array(labelPeriods).fill(undefined),
      low: new Array(labelPeriods).fill(undefined)
    }
  }).split()

  if (window.close.value.length !== labelPeriods || window.high.value.length !== labelPeriods || window.low.value.length !== labelPeriods) {
    throw new Error('Bad progress file!')
  }

  async function consumeNewestCandles () {
    let currentTime = dateToUnix() - 3605
    let toTime = timestampReached.value + hourDuration * maxBatchSize
    let batchSize = maxBatchSize

    if (toTime > currentTime) {
      toTime = currentTime
      batchSize = Math.floor((currentTime - timestampReached.value) / hourDuration)
      if (batchSize <= 0) {
        return false
      }
    }

    let newCandles = await histoHour('ETH', 'USD', { limit: batchSize, toTs: toTime, exchange: 'Coinbase' })

    for (let candle of newCandles) {
      if (candle.time <= timestampReached.value) {
        console.log(timestampReached.value, candle.time)
        continue
      }

      dataCallback(candle.time, [
        candle.close,
        candle.high,
        candle.low,
        candle.open,
        candle.volumefrom,
        candle.volumeto
      ])

      let label = getLabel(
        window.close.value[labelPeriods - 1],
        Math.max(...window.high.value),
        Math.min(...window.low.value)
      )
      if (!isNaN(label)) {
        labelCallback(candle.time - labelPeriods * hourDuration, [label])
      }

      timestampReached.value = candle.time
      window.close.value = [candle.close].concat(window.close.value.slice(0, -1))
      window.high.value = [candle.high].concat(window.high.value.slice(0, -1))
      window.low.value = [candle.low].concat(window.low.value.slice(0, -1))
    }
    return true
  }

  let timerFunction = async () => {
    let delay = 100
    try {
      if (!await consumeNewestCandles()) {
        delay = 1000 // No new data
      }
    } catch (error) {
      console.error(error)
      delay = 1000 // Error, backoff a bit
    }

    setTimeout(timerFunction, delay)
  }
  timerFunction()
}
