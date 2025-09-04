import { Mode } from 'osh-js/source/core/datasource/Mode'
// import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource'
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource'
import { OSHDatastream } from '@/lib/OSHConnectDataStructs'

/**
 * Utility to create a default ConSysApi datasource for charts.
 * @returns {any} ConSysApi datasource instance
 */
export function createDefaultDataSource(datastream: OSHDatastream) {
  // Datasource for the ConSys API
  // const datasource = ref(null);

  // TODO: determine how initializing the datasource in the onMounted hook behaves
  const datasource = new SweApi(datastream.name, {
    endpointUrl: datastream.datastream.networkProperties.endpointUrl,
    resource: `/datastreams/${datastream.datastream.properties.id}/observations`,
    tls: false,
    startTime: 'now',
    endTime: '2025-08-01T00:00:00Z',
    mode: Mode.REAL_TIME,
    responseFormat: 'application/swe+json'
  })

  // onMounted(() => {
  //   datasource.value = new ConSysApi(datastream.name, {
  //     endpointUrl: datastream.datastream.networkProperties.endpointUrl,
  //     resource: `/datastreams/${datastream.datastream.properties.id}/observations`,
  //     tls: true,
  //     startTime: 'now',
  //     endTime: '2025-08-01T00:00:00Z',
  //     mode: Mode.REAL_TIME,
  //     responseFormat: 'application/swe+json'
  //   });
  // });
  //

  // exposes managed state to including component
  return datasource
}

export function createVideoDataSource(datastream: OSHDatastream) {
  // Datasource for the ConSys API
  // const datasource = ref(null);

  // TODO: determine how initializing the datasource in the onMounted hook behaves
  const datasource = new SweApi(datastream.name, {
    protocol: 'ws',
    endpointUrl: datastream.datastream.networkProperties.endpointUrl,
    resource: `/datastreams/${datastream.datastream.properties.id}/observations`,
    tls: false,
    startTime: 'now',
    endTime: '2025-08-01T00:00:00Z',
    mode: Mode.REAL_TIME,
    responseFormat: 'application/swe+binary'
  })

  // onMounted(() => {
  //   datasource.value = new ConSysApi(datastream.name, {
  //     endpointUrl: datastream.datastream.networkProperties.endpointUrl,
  //     resource: `/datastreams/${datastream.datastream.properties.id}/observations`,
  //     tls: true,
  //     startTime: 'now',
  //     endTime: '2025-08-01T00:00:00Z',
  //     mode: Mode.REAL_TIME,
  //     responseFormat: 'application/swe+json'
  //   });
  // });
  //

  // exposes managed state to including component
  return datasource
}

export function createLocationDataSource(datastream: OSHDatastream) {
  const datasource = new SweApi(datastream.name, {
    protocol: 'ws',
    endpointUrl: datastream.datastream.networkProperties.endpointUrl,
    resource: `/datastreams/${datastream.datastream.properties.id}/observations`,
    tls: false,
    startTime: 'now',
    endTime: '2025-08-01T00:00:00Z',
    mode: Mode.REAL_TIME,
    // mode: Mode.BATCH,
    responseFormat: 'application/swe+json'
  })

  return datasource
}