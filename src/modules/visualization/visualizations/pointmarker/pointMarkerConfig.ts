export function getPointMarkerIdentityDatastreamId(
	dsConfig: Record<string, any>
): string | undefined {
	const markerId = dsConfig.markerId;
	if (markerId?.selected && markerId.dsId) return markerId.dsId;
	return dsConfig.location?.dsId;
}

export function validatePointMarkerDetailsDatastream(dsConfig: Record<string, any>): void {
	const details = dsConfig.pmDetails;
	if (!details?.selected) return;

	const identityDatastreamId = getPointMarkerIdentityDatastreamId(dsConfig);
	if (details.dsId !== identityDatastreamId) {
		throw new Error(
			'Detail Properties must use the same datastream as Marker ID, or Location when Marker ID is not configured.'
		);
	}
}
