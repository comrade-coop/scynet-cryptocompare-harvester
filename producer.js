import { connectionOptions } from './options'
import { ScynetTypes } from './protobufs'
import { unixToDate } from './util'
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

export async function connect (uuid, shape) {
  await producer.connect()
}

export var agents = []

export function addProducer (uuid, shape) {
  let topic = uuid + ''
  agents.push({ uuid, shape })

  console.log(`Added agent ${uuid} (topic ${topic}) with shape ${shape}!`)

  return function (key, values) {
    console.log(`Agent ${uuid} produced value ${values}\t at ${key} (${unixToDate(key | 0).toISOString()})`)
    producer.send({
      topic,
      messages: [{ key: key.toString(), value: encodeBlob(values) }]
    })
  }
}
