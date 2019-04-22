import { histoHour } from 'cryptocompare'
import { Progress } from './util'

import fetch from 'node-fetch'
global.fetch = fetch

export default function (produceCallback) {
  let candleProgress = new Progress('candle', 0)

  async function consumeNewestCandles () {
    let newCandles = []
    newCandles = await histoHour('ETH', 'USD', { limit: 1, toTs: new Date(), exchange: 'Coinbase' })

    for (let candle of newCandles) {
      if (candleProgress.value < candle.time) {
        produceCallback(candle.time, candle)
        candleProgress.value = candle.time
      }
    }
  }

  let timerFunction = async () => {
    try {
      await consumeNewestCandles()
    } catch (error) {
      console.error(error)
    }

    setTimeout(timerFunction, 1000)
  }
  timerFunction()
}
