import * as grpc from 'grpc'

import { connectionOptions } from './options'
import { agents } from './agents'
import startComponentService from './componentService'

import { Kafka } from 'kafkajs'

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

  for (let agent of agents) {
    let { _module: agentFunction, uuid: topic } = agent

    agentFunction(function (key, value) {
      // TODO: Replace the json with protobuf
      producer.send({
        topic,
        messages: [{ key, value: JSON.stringify(value) }]
      })
    })
  }

  let server = new grpc.Server()
  server.bind(connectionOptions.componentAddress, grpc.ServerCredentials.createInsecure())
  server.start()

  startComponentService(server)
}

main()
