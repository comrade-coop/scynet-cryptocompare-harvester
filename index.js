import io from 'socket.io-client'
import * as cryptocompare from 'cryptocompare'
import * as grpc from 'grpc'

import fs from 'fs'
import fetch from 'node-fetch'

import { convertCryptocompareObject, readFileOr } from './util'
import { connectionOptions } from './options'
import { agents } from './agents'
import startComponentService from './componentService'

import { Kafka } from 'kafkajs'

global.fetch = fetch

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: connectionOptions.kafkaBrokers
})

// Producing
const producer = kafka.producer()

async function main () {
  try {
    await producer.connect()
  } catch (error) {
    console.log(error)
  }
  var socket = io.connect('https://streamer.cryptocompare.com/')
  socket.emit('SubAdd', { 'subs': ['0~Coinbase~ETH~USD'] })

  let lastCandle = readFileOr('candle', 0)
  let lastTick = readFileOr('tick', 0)

  socket.on('m', async (message) => {
    let [type, ...rest] = message.split('~')
    switch (type) {
      case '0':
        let priceObject = convertCryptocompareObject(rest)
        let { tick } = priceObject

        if (lastTick < tick) {
          // TODO: Replace the json with protobuf

          await producer.send({
            topic: agents[0].uuid,
            messages: [
              { value: JSON.stringify(priceObject), key: tick.toString() }
            ]
          })
          fs.writeFileSync('tick', tick)
        }
        // console.log(lastTick, tick)

        break
      case '3':

        break
    }
  })

  async function consumeNewestCandles () {
    let lastHour = null
    try {
      lastHour = await cryptocompare.histoHour('ETH', 'USD', { limit: 1, timestamp: new Date(), exchange: 'Coinbase' })
    } catch (error) {
      console.log(error)
    }

    for (let candle of lastHour) {
      if (lastCandle < candle.time) {
        // console.log(candle)
        // TODO: Replace the json with protobuf
        await producer.send({
          topic: 'scynet-cryptocompare-eth-usd-candle-1h',
          messages: [
            { value: JSON.stringify(candle), key: candle.time.toString() }
          ]
        })
        lastCandle = candle.time
        fs.writeFileSync('candle', lastCandle)
      }
    }
  }

  setInterval(consumeNewestCandles, 1000)

  let server = new grpc.Server()
  server.bind(connectionOptions.componentAddress, grpc.ServerCredentials.createInsecure())
  server.start()

  startComponentService(server)
}

main()
