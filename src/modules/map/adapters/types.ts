export type MapClickHandler = (lat: number, lon: number, alt: number) => void;
export type CursorMode = 'default' | 'crosshair';

export interface MapAdapter {
  init(container: string): Promise<void>;
  destroy(): void;

  addLayer(layer: any): void;
  removeLayer(layer: any): void;

  onClick(handler: MapClickHandler): () => void;
  setCursor(mode: CursorMode): void;
}