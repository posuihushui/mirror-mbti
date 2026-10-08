import { initAnalytics } from "@/lib/analytics/track";

// GA4 starts before hydration, so page components' events queue behind `config` and the first page view.
initAnalytics(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
