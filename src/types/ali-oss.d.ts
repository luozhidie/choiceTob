// 声明阿里云 OSS SDK 类型（官方未提供完整 .d.ts，此处仅声明本项目用到的最小接口）
declare module "ali-oss" {
  interface PutOptions {
    contentType?: string;
  }
  class OSS {
    constructor(config: {
      region: string;
      accessKeyId: string;
      accessKeySecret: string;
      bucket: string;
      endpoint?: string;
    });
    put(key: string, data: Buffer | Uint8Array, options?: PutOptions): Promise<unknown>;
    delete(key: string): Promise<unknown>;
    generateObjectUrl(key: string): string;
  }
  export = OSS;
}
