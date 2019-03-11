import io from 'socket.io-client';
import * as cryptocompare from "cryptocompare";
import * as grpc from 'grpc';

import fs from "fs"
import fetch from "node-fetch"
global.fetch = fetch

import registerComponentService from "./componentService"
import Hatchery from "./hatcheryClient"
import { cryptocompare2object, readFileOr } from "./util"
import * as protoLoader from '@grpc/proto-loader';
import componentService from './componentService';

import { Kafka } from "kafkajs"
import hatcheryClient from './hatcheryClient';

import uuidv4 from 'uuid/v4';


const kafka = new Kafka({
	clientId: 'my-app',
	brokers: ['127.0.0.1:9092']
  })
  
  // Producing
const producer = kafka.producer()
  
async function main() {
	try{
		await producer.connect()
	}catch(error){
		console.log(error)
		debugger
	}
	var socket = io.connect('https://streamer.cryptocompare.com/');
	socket.emit('SubAdd', {'subs': ["0~Coinbase~ETH~USD"]})

	let lastCandle = readFileOr("candle", 0)
	let lastTick = readFileOr("tick", 0)

	socket.on("m", async (message) => {
		let [type, ...rest] = message.split("~")
		switch(type) {
			case '0':
				let priceObject = cryptocompare2object(rest)
				let {tick} = priceObject
	
				if(lastTick < tick) {
					// console.log(priceObject)
					// TODO: Replace the json with protobuf

					await producer.send({
						topic: 'scynet-cryptocompare-eth-usd-tick',
						messages: [
							{ value: JSON.stringify(priceObject), key: tick.toString() }
						],
					})
					fs.writeFileSync("tick", tick);
				}
				// console.log(lastTick, tick)
	
				
			break;
			case '3':
	
			break;
		}
		
	})

	async function consumeNewestCandles() {
		let lastHour = null
		try{
			 lastHour = await cryptocompare.histoHour('ETH', 'USD', { limit: 1, timestamp: new Date(), exchange: "Coinbase" })
		}catch(error){
			console.log(error)
		}
		
		for(let candle of lastHour) {
			if(lastCandle < candle.time){
				// console.log(candle)
				// TODO: Replace the json with protobuf
				await producer.send({
					topic: 'scynet-cryptocompare-eth-usd-candle-1h',
					messages: [
						{ value: JSON.stringify(candle), key: candle.time.toString() }
					],
				})
				lastCandle = candle.time
				fs.writeFileSync("candle", lastCandle);
			}
		}
	}

	
	setInterval(async () => {
		await consumeNewestCandles();
	}, 1000)

	let server = new grpc.Server();
	componentService(server)
	let port = server.bind('0.0.0.0:9999', grpc.ServerCredentials.createInsecure());
	server.start()
	console.log("Listening on 0.0.0.0:" + port)

	hatcheryClient.RegisterComponent({ uuid: uuidv4(), address: "127.0.0.1:" + port, runnerType: [] }, () => {})
} 




main()