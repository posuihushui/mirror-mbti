export function isWeChat(ua: string | null | undefined): boolean {
  return /MicroMessenger/i.test(ua ?? "");
}

export function isMobile(ua: string | null | undefined): boolean {
  return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua ?? "");
}

/** WeChat Pay channel by environment: in-app JSAPI, mobile browser H5, otherwise Native QR. */
export function pickWeChatChannel(ua: string | null | undefined): "jsapi" | "h5" | "native" {
  if (isWeChat(ua)) return "jsapi";
  if (isMobile(ua)) return "h5";
  return "native";
}
