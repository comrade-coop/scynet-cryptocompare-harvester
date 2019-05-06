import { promisify } from 'util'
import * as grpc from 'grpc'
import uuidv4 from 'uuid/v4'

import { connectionOptions } from './options'
import { Scynet } from './protobufs'
import { agents } from './producer'

export class ComponentServiceImpl {
  RegisterInput (call, callback) {
    callback(null)
  }

  AgentStart (call, callback) {
    callback(null)
    if (!agents.includes(x => x.uuid === call.egg.uuid)) {
      hatchery.AgentStopped({
        agent: call.egg,
        reason: 'Nonexistent agent',
        code: 404
      }, () => {})
    }
  }

  AgentStop (call, callback) {
    callback(null)
  }

  AgentStatus (call, callback) {
    callback(null, { running: agents.includes(x => x.uuid === call.uuid) })
  }

  AgentList (call, callback) {
    callback(null, { agents: agents })
  }
}

function convertAgent (uuid, shape, componentId) {
  return {
    uuid: uuid,
    componentType: 'scynet-market-harvester',
    componentId: componentId,
    inputs: [],
    outputs: [{
      dimension: shape
    }],
    frequency: 60 * 60,
    _module: module
  }
}

for (let key in Scynet.Hatchery.prototype) {
  let value = Scynet.Hatchery.prototype[key]
  if (typeof value === 'function') {
    Scynet.Hatchery.prototype[key + 'Async'] = promisify(value)
  }
}
const hatchery = new Scynet.Hatchery(connectionOptions.hatcheryAddress, grpc.credentials.createInsecure())

export default async (server, componentId = uuidv4()) => {
  server.addService(Scynet.Component.service, new ComponentServiceImpl())

  await hatchery.RegisterComponentAsync({
    uuid: componentId,
    address: connectionOptions.componentAddress,
    runnerType: ['scynet-market-harvester']
  })
  await Promise.all(agents.map(agent =>
    hatchery.RegisterAgentAsync({
      agent: convertAgent(agent.uuid, agent.shape, componentId)
    })
  ))
}
