import socketIo from 'socket.io-client'
import { convertCryptocompareObject, Progress } from './util'

import fetch from 'node-fetch'
global.fetch = fetch

export default function (produceCallback) {
  var socket = socketIo.connect('https://streamer.cryptocompare.com/')
  socket.emit('SubAdd', { 'subs': ['0~Coinbase~ETH~USD'] })
  let tickProgress = new Progress('tick', 0).read()

  socket.on('m', (message) => {
    let [type, ...rest] = message.split('~')
    switch (type) {
      case '0':
        let priceObject = convertCryptocompareObject(rest)

        if (tickProgress.value < priceObject.tick) {
          produceCallback(priceObject.tick, priceObject)
          tickProgress.value = priceObject.tick
        }

        break
      case '3':

        break
    }
  })
}
