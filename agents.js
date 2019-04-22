import uuidv4 from 'uuid/v4'

function agent (uuid) {
  return {
    uuid: uuid,
    componentType: 'scynet-market-harvester',
    componentId: componentId,
    inputs: [],
    outputs: [{
      dimension: [1]
    }],
    frequency: 60 * 60
  }
}

export const componentId = uuidv4()
export const agents = [
  agent('331d591b-184d-4e7c-b075-9841181c05c1')
]
