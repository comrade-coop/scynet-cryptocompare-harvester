
import * as grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';

import { protoLoaderOptions } from "./options"

const packageDefinition = protoLoader.loadSync("./protocols/Component.proto", protoLoaderOptions);
var { Scynet } = grpc.loadPackageDefinition(packageDefinition);

function agent(uuid, componentType, componentId) {
    return {
        uuid,
        componentType,
        componentId,
        eggData: new Buffer("Magical agent"),
        inputs: [],
        outputs: [],
        frequency: 60*60
    }
}
class ComponentServieImpl {
    RegisterInput(call, callback) {
        console.log("RegisterInput", arguments)
        callback(null)
    }

    AgentStart(call, callback) {
        console.log("AgentStart", arguments)
        callback(null)

    }

    AgentStop(call, callback) {
        console.log("AgentStop", arguments)
        callback(null)

    }

    AgentStatus(call, callback) {
        console.log("AgentStatus", arguments)
        callback(null, { running: true })

    }

    AgentList(call, callback) {
        console.log("AgentList", arguments)
        
        callback(null, { agents: [ agent("0101", "scynet-market-harvester", "0002"), agent("1001", "scynet-market-harvester", "0001") ] })

    }
}

debugger

export default (server) => server.addService(Scynet.Component.service, new ComponentServieImpl());