declare global {
  interface Window { __ALTWEB_OFFLINE_ASSETS__?: Record<string,string>; }
}

/** Hosted builds retain local URLs; the downloadable build embeds exact asset bytes. */
export function assetUrl(path:string):string {
  const assets=window.__ALTWEB_OFFLINE_ASSETS__;
  return assets && Object.prototype.hasOwnProperty.call(assets,path) ? assets[path]! : path;
}
