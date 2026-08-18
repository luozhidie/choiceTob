declare module "qrcode" {
  interface QRCodeToStringOptions {
    type?: "svg" | "terminal" | "utf8";
    margin?: number;
    width?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  }
  export function toString(text: string, options?: QRCodeToStringOptions): Promise<string>;
  export function toDataURL(text: string, options?: any): Promise<string>;
  const QRCode: {
    toString: typeof toString;
    toDataURL: typeof toDataURL;
  };
  export default QRCode;
}
