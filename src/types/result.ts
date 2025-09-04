/**
 * Interface for result of an operation/action
 */
export interface Result {
  message: string   // Message related to the result: success, error description, etc.
  code: number      // HTTP status code related to the result
}