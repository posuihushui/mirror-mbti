import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MyReportLink } from "@/components/site/my-report-link";
import { OverlayButton } from "@/components/site/overlay-button";

type Props =
  | { variant: "home" }
  | { variant: "page"; title: string; backHref: string; active?: "quiz" };

const navItem = "flex min-h-11 items-center gap-[9px] text-[12px] text-[#5d696d] hover:text-ink";

/** `.app-header`: brand or back link, desktop nav, and the single phone action. */
export function AppHeader(props: Props) {
  const home = props.variant === "home";
  return (
    <header
      className={cn(
        "z-5 flex h-[75px] items-center justify-between px-[23px]",
        home ? "absolute inset-x-0 top-0 bg-transparent" : "relative bg-paper",
        "md:static md:mx-auto md:h-[92px] md:max-w-[1320px] md:border-b md:border-line md:bg-transparent md:px-11",
      )}
    >
      {home ? (
        <Link
          href="/"
          aria-label="观己 mirror 首页"
          className="flex min-h-11 items-center"
        >
          <BrandLogo className="h-auto w-[168px] md:w-[194px]" />
        </Link>
      ) : (
        <Link href={props.backHref} className="back-button">
          <ArrowLeft size={19} weight="light" />
          <span>{props.title}</span>
        </Link>
      )}

      <nav className="hidden items-center gap-[45px] md:flex" aria-label="主导航">
        <Link href="/quiz" className={cn(navItem, !home && props.active === "quiz" && "text-ink")}>
          人格测试
        </Link>
        <OverlayButton overlay="about" className={navItem}>
          了解测试
        </OverlayButton>
        <MyReportLink className={navItem}>
          我的报告
          <ArrowUpRight size={14} />
        </MyReportLink>
      </nav>

      {home ? (
        <MyReportLink className="min-h-11 text-[12px] md:hidden">我的报告</MyReportLink>
      ) : (
        <OverlayButton overlay="about" className="min-h-11 text-[12px] md:hidden">
          测试说明
        </OverlayButton>
      )}
    </header>
  );
}
