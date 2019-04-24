import * as grpc from 'grpc'
import * as protobuf from 'protobufjs'
import * as grpcProtoLoader from '@grpc/proto-loader'

import { protoLoaderOptions } from './options'

const grpcPackageDefinition = grpcProtoLoader.loadSync([
  './protocols/Hatchery.proto',
  './protocols/Component.proto'
], protoLoaderOptions)

const protobufRoot = new protobuf.Root().loadSync([
  './protocols/Shared.proto'
], protoLoaderOptions)
protobufRoot.resolveAll()

export const { Scynet } = grpc.loadPackageDefinition(grpcPackageDefinition)
export const ScynetTypes = protobufRoot.nested.Scynet
