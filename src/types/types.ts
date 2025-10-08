/**
 * Interface for result of an operation/action
 */
export interface Result {
  message: string   // Message related to the result: success, error description, etc.
  code: number      // HTTP status code related to the result
}

/**
 * Type for PTZ command directions
 */
export type Direction = "up" | "down" | "left" | "right" | "up-left" | "up-right" | "down-left" | "down-right" | "home" | "zoomIn" | "zoomOut";

/**
 * Type for PTZ command
 */
export type Command =
  | { params: { rpan: number } }
  | { params: { rtilt: number } }
  | { params: { rzoom: number } }
  | { params: { pan: number } }
  | { params: { tilt: number } }
  | { params: { zoom: number } }
  | { params: { preset: string } }
  | { params: { absolute: { pan: number; tilt: number; zoom: number } } };  // CHECK -> ptzPos is the field name for this camera