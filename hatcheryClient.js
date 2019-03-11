
import { protoLoaderOptions } from "./options"
import * as grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync("./protocols/Hatchery.proto", protoLoaderOptions);
var { Scynet } = grpc.loadPackageDefinition(packageDefinition);

export default new Scynet.Hatchery('localhost:9998', grpc.credentials.createInsecure());