import { watch, Ref } from 'vue';

/**
 * Reusable composable to sync time values with a store or callback.
 * @param timeRef - The ref to watch (e.g., startTime or endTime)
 * @param onChange - Callback to run when the ref changes
 */
export function useTimeSync(timeRef: Ref<string | null>, onChange: (val: string | null) => void) {
	watch(timeRef, (val) => {
		onChange(val);
	});
}

/**
 * Example: useTimeSync for both start and end time with a store
 * @param startTime - Ref for start time
 * @param endTime - Ref for end time
 * @param visualizationStore - Store with currentVisDataStreamOptions
 */
export function useStartEndTimeSync(
	startTime: Ref<string | null>,
	endTime: Ref<string | null>,
	visualizationStore: any
) {
	useTimeSync(startTime, (val) => {
		visualizationStore.currentVisDataStreamOptions.startTime = val;
	});
	useTimeSync(endTime, (val) => {
		visualizationStore.currentVisDataStreamOptions.endTime = val;
	});
}

/**
 * Reusable composable to sync playback mode with a store or callback.
 * @param playbackModeRef - The ref to watch (e.g., playbackMode)
 * @param visualizationStore - Store with currentVisDataStreamOptions
 */
export function usePlaybackModeSync(playbackModeRef: Ref<string>, visualizationStore: any) {
	watch(playbackModeRef, (val) => {
		visualizationStore.currentVisDataStreamOptions.replayMode = val;
	});
}
