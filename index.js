import * as grpc from 'grpc'

import { connectionOptions } from './options'
import startComponentService from './componentService'
import * as candlesAgent from './candlesAgent'

function main () {
  Promise.resolve(candlesAgent.initialize()).catch(err => {
    console.error(err)
  })

  let server = new grpc.Server()
  Promise.resolve(startComponentService(server)).catch(err => {
    console.error(err)
  })
  server.bind(connectionOptions.componentAddress, grpc.ServerCredentials.createInsecure())
  server.start()
}

main()
