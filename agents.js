import uuidv4 from 'uuid/v4'
import candlesAgent from './candlesAgent'
import ticksAgent from './ticksAgent'

function agent (uuid, module) {
  return {
    uuid: uuid,
    componentType: 'scynet-market-harvester',
    componentId: componentId,
    inputs: [],
    outputs: [{
      dimension: [1]
    }],
    frequency: 60 * 60,
    _module: module
  }
}

export const componentId = uuidv4()
export const agents = [
  agent('331d591b-184d-4e7c-b075-9841181c05c1', candlesAgent),
  agent('33204f2d-e1c3-4032-9a5b-5d1a94372e63', ticksAgent)
]
