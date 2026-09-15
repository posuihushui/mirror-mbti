import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LanguageMenu, type LanguageOption } from "@/components/site/language-menu";
import { MyReportLink } from "@/components/site/my-report-link";
import { OverlayButton } from "@/components/site/overlay-button";
import { href, publishedLocales } from "@/lib/i18n/locale";
import { siteMessages } from "@/lib/i18n/messages/site";
import { getLocale } from "@/lib/i18n/server";

/**
 * `path` is this page's unprefixed path in every language (`/types/INFJ`); the language menu links there.
 * Omit it on pages bound to one language (real results, reports, orders): the menu then opens the other home.
 */
type Props =
  | { variant: "home"; path?: string }
  | { variant: "page"; title: string; backHref: string; active?: "quiz"; path?: string };

const navItem = "flex min-h-11 items-center gap-[9px] text-[12px] text-[#5d696d] hover:text-ink";

/** `.app-header`: brand or back link, desktop nav, language menu, and the single phone action. `backHref` is already localized. */
export async function AppHeader(props: Props) {
  const locale = await getLocale();
  const t = siteMessages[locale].header;
  const home = props.variant === "home";
  const myReport = href(locale, "/my/report");
  const languages: LanguageOption[] = publishedLocales.map((option) => ({
    locale: option,
    href: option === locale ? undefined : href(option, props.path ?? "/"),
  }));
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
          href={href(locale, "/")}
          aria-label={t.homeLabel}
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

      <nav className="hidden items-center gap-[45px] md:flex" aria-label={t.navLabel}>
        <Link href={href(locale, "/quiz")} className={cn(navItem, !home && props.active === "quiz" && "text-ink")}>
          {t.quiz}
        </Link>
        <OverlayButton overlay="about" className={navItem}>
          {t.about}
        </OverlayButton>
        <MyReportLink href={myReport} className={navItem}>
          {t.myReport}
          <ArrowUpRight size={14} />
        </MyReportLink>
        <LanguageMenu current={locale} options={languages} label={t.language} className="border-l border-line pl-[45px]" />
      </nav>

      <div className="flex shrink-0 items-center gap-4 md:hidden">
        <LanguageMenu current={locale} options={languages} label={t.language} compact top={home} />
        {home ? (
          <MyReportLink href={myReport} className="min-h-11 text-[12px]">{t.myReport}</MyReportLink>
        ) : (
          <OverlayButton overlay="about" className="min-h-11 text-[12px]">
            {t.aboutShort}
          </OverlayButton>
        )}
      </div>
    </header>
  );
}
