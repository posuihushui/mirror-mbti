import { afterEach, expect, it, vi } from "vitest";
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
it.each(["/s/", "/en/s/", "/t/", "/en/t/", "/compare/", "/my/shares/"])("disables configured Google collection before config on %s",async(path)=>{
 const token="aB_9".repeat(8);const append=vi.fn();
 const location=new URL(`https://mirror.example${path}${token}?utm_source=${token}`);
 const win:Record<string,unknown>={location,sessionStorage:{getItem:()=>null}};
 vi.stubGlobal("window",win);vi.stubGlobal("navigator",{userAgent:"test"});
 vi.stubGlobal("document",{readyState:"complete",referrer:`https://mirror.example/s/${token}`,createElement:()=>({}),head:{appendChild:append},addEventListener:vi.fn()});
 const {initAnalytics}=await import("@/lib/analytics/track");initAnalytics("G-TEST1234");
 expect(win["ga-disable-G-TEST1234"]).toBe(true);expect(append).not.toHaveBeenCalled();
 const layer=JSON.stringify(win.dataLayer);expect(layer).not.toContain(token);expect(layer).toContain('send_page_view');
});
