declare module 'colorthief' {
  type Color = [number, number, number];
  export default class ColorThief {
    getColor(sourceImage: HTMLImageElement, quality?: number): Color;
    getPalette(sourceImage: HTMLImageElement, colorCount?: number, quality?: number): Color[];
  }
}