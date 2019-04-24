import * as grpc from 'grpc'

import { connectionOptions } from './options'
import { agents } from './agents'
import { ScynetTypes } from './protobufs'
import startComponentService from './componentService'

import { Kafka } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'cryptocompare-harvester',
  brokers: connectionOptions.kafkaBrokers
})

// Producing
const producer = kafka.producer()

function encodeBlob (values) {
  let shape = []
  let testArray = values
  while (Array.isArray(testArray)) {
    shape.push(testArray.length)
    testArray = testArray[0]
  }
  let blob = { data: values, shape: { dimension: shape } }
  return ScynetTypes.Blob.encode(blob).finish()
}

async function main () {
  try {
    await producer.connect()
  } catch (error) {
    console.log(error)
  }

  for (let agent of agents) {
    let { _module: agentFunction, uuid: topic } = agent

    agentFunction(function (key, values) {
      producer.send({
        topic,
        messages: [{ key, value: encodeBlob(values) }]
      })
    })
  }

  let server = new grpc.Server()
  startComponentService(server)
  server.bind(connectionOptions.componentAddress, grpc.ServerCredentials.createInsecure())
  server.start()
}

main()
