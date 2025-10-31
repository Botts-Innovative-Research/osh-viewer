import ControlFilter from 'osh-js/source/core/sweapi/control/ControlFilter'
import Control from 'osh-js/source/core/sweapi/control/Control'
import { useControlStreamStore } from '@/stores/controlstreamstore'

/**
 * Fetch the schema for a control stream
 */
export async function fetchControlStreamSchema(controlstream: any, networkProperties: any) {
  const controlStreamStore = useControlStreamStore()

  const props = {
    id: controlstream.id,
    'system@id': controlstream.parentId,
    name: controlstream.name,
    type: controlstream.type,
  }

  const control = new Control(props, networkProperties)

  console.log('[ControlstreamUtils] Fetching schema for controlstream:', control)

  let filter = new ControlFilter()
  return control
    .getSchema(filter)
    .then((schema: any) => {
      if (schema) {
        console.log('[ControlstreamUtils] Schema fetched:', schema)
        // Add schema to store
        controlStreamStore.addCSSchema(controlstream.id, schema)
        return getCommandSchema(schema.paramsSchema.items)
      }
    })
    .catch((error: any) => {
      console.error('[ControlstreamUtils] Error fetching schema:', error)
      return null
    })
}

export function getCommandSchema(schema: any[]) {
  // Start with empty command schema
  let commandSchema: any = { params: {} }

  // Check for PTZ camera command schema
  if (schema.some((item: any) => item.name === 'pan' || item.name === 'rpan')) {
    return { }

    // TO DO IMPLEMENT ISPRESET, ISDATARECORD, etc. HERE

    // if (schema.some((item: any) => item.name === 'pan')) {
    //   // Add absolute PTZ command schema
    //   commandSchema.params.pan = { type: 'number', constraint: schema.find((item: any) => item.name === 'pan').constraint.intervals }
    //   commandSchema.params.tilt = { type: 'number', constraint: schema.find((item: any) => item.name === 'tilt').constraint.intervals }
    //   commandSchema.params.zoom = { type: 'number', constraint: schema.find((item: any) => item.name === 'zoom').constraint.intervals }
    // }
    // if (schema.some((item: any) => item.name === 'rpan')) {
    //   // Add relative PTZ command schema
    //   commandSchema.params.rpan = { type: 'number', constraint: schema.find((item: any) => item.name === 'rpan').constraint.intervals }
    //   commandSchema.params.rtilt = { type: 'number', constraint: schema.find((item: any) => item.name === 'rtilt').constraint.intervals }
    //   commandSchema.params.rzoom = { type: 'number', constraint: schema.find((item: any) => item.name === 'rzoom').constraint.intervals }
    // }
    // if (schema.some((item: any) => item.name === 'preset')) {
    //   // Add Preset PTZ command schema
    //   const presetItem = schema.find((item: any) => item.name === 'preset')
    //   // Add all possible preset values as an array
    //   commandSchema.params.preset = { type: presetItem.type, values: presetItem.constraint.values }
    // }
    // if (schema.some((item: any) => item.type === 'DataRecord')) {
    //   // Add DataRecord PTZ command schema
    //   const dataRecItem = schema.find((item: any) => item.type === 'DataRecord')
    //   commandSchema.params[dataRecItem.name] = { type: dataRecItem.type pan: 'number', tilt: 'number', zoom: 'number' }
    // }
  }

  return commandSchema
}

/**
 * Class representing Control Stream schema field property
 */
// export class CSSchemaFieldProperty {
//   definition: string;
//   name: string;
//   type: string;
//   uom?: any;
//   children? : CSSchemaFieldProperty[];

//   constructor(definition: string, name: string, type: string, uom?: string, children?: any[]) {
//     this.definition = definition;
//     this.name = name;
//     this.type = type;
//     this.uom = uom;
//     this.children = children?.forEach(child => return new CSSchemaFieldProperty(
//       child.definition,
//       child.name,
//       child.type,
//       child.uom,
//     ));
//   }
// }
