import type { OSHDatastream } from '@/lib/OSHConnectDataStructs';

const dsRoleKeywords: Record<string, string[]> = {
	// location/orientation
	location: ['location', 'lla', 'position', 'platform location', 'adsb', 'ais', 'aircraft', 'vessel'],
	lla: ['location', 'lla', 'position', 'platform location'],
	position: ['location', 'lla', 'position', 'platform location', 'pos'],
	origin: ['location', 'lla', 'position', 'platform location', 'origin'],
	orientation: ['orientation', 'attitude', 'heading', 'euler', 'track', 'cog', 'adsb', 'ais'],
	homeOrientation: ['orientation', 'attitude', 'heading', 'euler'],
	markerId: ['adsb', 'ais', 'icao', 'mmsi', 'aircraft', 'vessel'],
	pmLabel: ['adsb', 'ais', 'callsign', 'vessel', 'aircraft'],
	pmIconColor: ['adsb', 'ais', 'callsign', 'mmsi'],
	// mission
	home: ['home', 'home position', 'home location', 'launch position'],
	homeLocation: ['home', 'home position', 'home location', 'launch position'],
	status: ['status', 'statusevent', 'status event'],
	// vid
	video: ['video', 'camera', 'image', 'stream'],
	// chart
	x: ['time', 'timestamp'],
	// lob
	bearing: ['bearing', 'azimuth', 'angle', 'line of bearing', 'LOB'],
	// ellipse
	semiMajorAxis: ['ellipse major', 'ellipse axis 1'],
	semiMinorAxis: ['ellipse minor', 'ellipse axis 0'],
	// audio & sdr
	sampleRate: ['sample rate', 'sample_rate', 'samplerate', 'bandwidth', 'audio', 'samples', 'AAC', 'AMR-NB', 'AMR-WB', 'FLAC', 'VORBIS', 'OPUS', 'PCM'],
	samples: ['audio', 'samples', 'AAC', 'AMR-NB', 'AMR-WB', 'FLAC', 'VORBIS', 'OPUS', 'PCM'],
	// sdr
	amplitude: ['spectrum', 'power_spectral_density', 'psd', 'amplitude', 'fft', 'rf_spectrum', 'rtlsdr_spectrum'],
	centerFrequency: ['center frequency', 'center_frequency', 'center_freq', 'centerfreq', 'settings', 'rtlsdr_settings', 'spectrum', 'rtlsdr_spectrum'],
	frequencyAxis: ['frequency axis', 'frequency_axis', 'freq_axis', 'freqaxis', 'spectrum', 'rtlsdr_spectrum'],
};

export function autoMapDataStreams(
	datastreams: OSHDatastream[]
): Record<string, string> {
	const result: Record<string, string> = {};

	for (const [role, keywords] of Object.entries(dsRoleKeywords)) {
		for (const ds of datastreams) {
			const name = (ds.name || '').toLowerCase();
			const id = (ds.id || '').toLowerCase();
			const outputName = (ds.datastream?.properties?.outputName ?? '').toLowerCase();
			if (keywords.some((kw) => name.includes(kw) || id.includes(kw) || outputName.includes(kw))) {
				result[role] = ds.id;
				break;
			}
		}
	}

	return result;
}

