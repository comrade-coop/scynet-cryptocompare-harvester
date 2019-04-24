import * as grpc from 'grpc'

import { connectionOptions } from './options'
import { componentId, agents } from './agents'
import { Scynet } from './protobufs'

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

export const hatchery = new Scynet.Hatchery(connectionOptions.hatcheryAddress, grpc.credentials.createInsecure())

export default async (server) => {
  server.addService(Scynet.Component.service, new ComponentServiceImpl())

  hatchery.RegisterComponent({
    uuid: componentId,
    address: connectionOptions.componentAddress,
    runnerType: ['scynet-market-harvester']
  }, () => {
    for (let agent of agents) {
      hatchery.RegisterAgent({ agent }, () => {})
    }
  })
}
