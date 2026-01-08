import { Mode } from 'osh-js/source/core/datasource/Mode';
// import ConSysApi from 'osh-js/source/core/datasource/consysapi/ConSysApi.datasource'
import SweApi from 'osh-js/source/core/datasource/sweapi/SweApi.datasource';
import { OSHDatastream } from '@/lib/OSHConnectDataStructs';

/**
 * Utility to create a default ConSysApi datasource for charts.
 * @returns {any} ConSysApi datasource instance
 */
export function createRTDataSource(ds: any, isVideo: boolean) {
  return new SweApi(ds.id, {
    endpointUrl: ds.endpointUrl,
    resource: `/datastreams/${ds.id}/observations`,
    tls: ds.tls,
    protocol: 'ws',
    mode: Mode.REAL_TIME,
    responseFormat: isVideo ? 'application/swe+binary' : 'application/swe+json',
      connectorOpts: {
          username: ds.connectorOpts.username,
          password: ds.connectorOpts.password
      }
  });
}

export function createBatchDataSource(datastream: OSHDatastream, isVideo: boolean) {
    return new SweApi(datastream.name, {
        endpointUrl: datastream.datastream.networkProperties.endpointUrl,
        resource: `/datastreams/${datastream.datastream.properties.id}/observations`,
        tls: datastream.datastream.networkProperties.tls,
        protocol: 'ws',
        mode: Mode.BATCH,
        startTime: 'now',
        endTime: '2125-08-01T00:00:00Z',
        responseFormat: isVideo ? 'application/swe+binary' : 'application/swe+json',
        connectorOpts: {
            username: datastream.datastream.networkProperties?.connectorOpts.username,
            password: datastream.datastream.networkProperties?.connectorOpts.password
        }
    });
}

export function createReplayDataSource(datastream: OSHDatastream, isVideo: boolean) {
    return new SweApi(datastream.name, {
        endpointUrl: datastream.datastream.networkProperties.endpointUrl,
        resource: `/datastreams/${datastream.datastream.properties.id}/observations`,
        tls: datastream.datastream.networkProperties.tls,
        protocol: 'ws',
        mode: Mode.REPLAY,
        startTime: 'now',
        endTime: '2125-08-01T00:00:00Z',
        responseFormat: isVideo ? 'application/swe+binary' : 'application/swe+json',
        connectorOpts: {
            username: datastream.datastream.networkProperties?.connectorOpts.username,
            password: datastream.datastream.networkProperties?.connectorOpts.password
        }
    });
}