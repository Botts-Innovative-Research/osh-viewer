import { OSHControlStream } from '@/lib/OSHConnectDataStructs'
import ControlFilter from 'osh-js/source/core/sweapi/control/ControlFilter'
import Control from 'osh-js/source/core/sweapi/control/Control'
import { useUIStore } from '@/stores/uistore'


/**
 * Fetch the schema for a control stream
 */
export async function fetchControlStreamSchema(controlstream: any, networkProperties: any) {
  
  const props = {
    id: controlstream.id,
    'system@id': controlstream.parentId,
    name: controlstream.name,
    type: controlstream.type
  }

  const control = new Control(props, networkProperties)
  
  console.log('[ControlstreamUtils] Fetching schema for controlstream:', control)

  let filter = new ControlFilter()
  return control.getSchema(filter)
  .then((schema: any) => {
    if (schema) {
    console.log('[ControlstreamUtils] Schema fetched:', schema)
    return schema
    }
  }).catch((error: any) => {
    console.error('[ControlstreamUtils] Error fetching schema:', error)
    return null
  })
}
