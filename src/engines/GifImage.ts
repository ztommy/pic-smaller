/**
 * Reference：
 * https://github.com/renzhezhilu/gifsicle-wasm-browser
 * https://www.lcdf.org/gifsicle/man.html
 */

import { gifsicle } from "./GifWasmModule";
import {
  CompressOption,
  ImageBase,
  ImageInfo,
  ProcessOutput,
} from "./ImageBase";

export class GifImage extends ImageBase {
  /**
   * Create GifImage instance
   * @param info
   * @param option
   * @returns
   */
  public static async create(
    info: Omit<ImageInfo, "width" | "height">,
    option: CompressOption,
  ) {
    const dimension = await ImageBase.getDimension(info.blob);
    return new GifImage({ ...info, ...dimension }, option);
  }

  async compress(): Promise<ProcessOutput> {
    try {
      const { width, height } = this.getOutputDimension();
      const commands: string[] = [
        `--resize=${width}x${height}`,
        `--colors=${this.option.gif.colors}`,
      ];
      if (this.option.gif.dithering) {
        commands.push(`--dither=floyd-steinberg`);
      }
      commands.push(`--output=/out/${this.info.name}`);
      commands.push(this.info.name);
      const buffer = await this.info.blob.arrayBuffer();
      const result = await gifsicle({
        data: [
          {
            file: buffer,
            name: this.info.name,
          },
        ],
        command: [commands.join(" ")],
      });

      if (!Array.isArray(result) || result.length !== 1) {
        return this.failResult();
      }

      const blob = new Blob([result[0].file], {
        type: this.info.blob.type,
      });
      return {
        width,
        height,
        blob,
        src: URL.createObjectURL(blob),
      };
    } catch (error) {
      return this.failResult();
    }
  }

  async preview(): Promise<ProcessOutput> {
    const { width, height } = this.getPreviewDimension();

    const commands: string[] = [
      `--resize=${width}x${height}`,
      `--colors=${this.option.gif.colors}`,
      `--output=/out/${this.info.name}`,
      this.info.name,
    ];
    const buffer = await this.info.blob.arrayBuffer();
    const result = await gifsicle({
      data: [
        {
          file: buffer,
          name: this.info.name,
        },
      ],
      command: [commands.join(" ")],
    });

    if (!Array.isArray(result) || result.length !== 1) {
      return {
        width: this.info.width,
        height: this.info.height,
        blob: this.info.blob,
        src: URL.createObjectURL(this.info.blob),
      };
    }

    const blob = new Blob([result[0].file], {
      type: this.info.blob.type,
    });
    return {
      width,
      height,
      blob,
      src: URL.createObjectURL(blob),
    };
  }
}
