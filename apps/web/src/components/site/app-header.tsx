import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";
import { BrandLogo, brandLogoWidth } from "@/components/brand/brand-logo";
import { LanguageLinks, type LanguageOption } from "@/components/site/language-links";
import { MoreMenu } from "@/components/site/more-menu";
import { MyReportLink } from "@/components/site/my-report-link";
import { trackAttrs, type CtaId, type CtaLocation } from "@/lib/analytics/events";
import { href, publishedLocales, type Locale } from "@/lib/i18n/locale";
import { siteMessages } from "@/lib/i18n/messages/site";
import { getLocale } from "@/lib/i18n/server";

/**
 * `path` is this page's unprefixed path in every language (`/types/INFJ`); the language options link there.
 * Omit it on pages bound to one language (real results, reports, orders): the menu then opens the other home.
 */
type Props =
  | { variant: "home"; path?: string }
  | { variant: "page"; title: string; backHref: string; active?: "quiz" | "types"; path?: string };

type MenuLink = readonly [path: string, cta: CtaId, label: keyof (typeof siteMessages)["zh"]["header"], prefetch?: false];

/** Secondary pages, grouped. Pages have no footer navigation: the header's "更多信息" menu is where they are listed. */
const moreGroups: readonly (readonly MenuLink[])[] = [
  [["/preferences", "view_preferences", "preferences"], ["/about", "view_about", "aboutPage"], ["/help", "view_help", "help"]],
  [["/privacy", "view_privacy", "privacy"], ["/terms", "view_terms", "terms"]],
];
/** Phones show only 更多, so that menu starts with the primary items. History is never prefetched. */
const phonePrimary: readonly MenuLink[] = [["/quiz", "start_quiz", "quiz"], ["/types", "view_types", "types"], ["/my/report", "my_report", "myReport", false]];

const navItem = "flex min-h-11 items-center gap-2 text-sm text-mist hover:text-ink";
const menuItem =
  "flex min-h-11 items-center rounded-[3px] px-3 text-sm whitespace-nowrap text-mist hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:text-ink focus-visible:-outline-offset-2";

/**
 * `.app-header`: brand or back link, the desktop nav (人格测试 · 16 型人格 · 我的报告 · 更多信息), and on phones
 * a single 更多 menu that also holds those three. Both menus end with the language options.
 * `backHref` is already localized.
 */
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
        "z-5 flex h-[75px] items-center justify-between gap-2 px-[23px]",
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
          {/* Phones show the mark and wordmark only, the same in both languages; desktop keeps the locale lockup. */}
          <BrandLogo tagline={false} width={brandLogoWidth(locale, 168, false)} className="md:hidden" />
          <BrandLogo locale={locale} className={cn("hidden h-auto md:block", locale === "en" ? "md:w-[232px]" : "md:w-[194px]")} />
        </Link>
      ) : (
        <Link href={props.backHref} className="back-button min-w-0">
          <ArrowLeft size={19} weight="light" className="shrink-0" />
          <span className="min-w-0 truncate">{props.title}</span>
        </Link>
      )}

      <nav className="hidden items-center gap-[45px] md:flex" aria-label={t.navLabel}>
        <Link href={href(locale, "/quiz")} className={cn(navItem, !home && props.active === "quiz" && "text-ink")} {...trackAttrs("start_quiz", "header_nav")}>
          {t.quiz}
        </Link>
        <Link href={href(locale, "/types")} className={cn(navItem, !home && props.active === "types" && "text-ink")} {...trackAttrs("view_types", "header_nav")}>
          {t.types}
        </Link>
        <MyReportLink href={myReport} className={navItem} {...trackAttrs("my_report", "header_nav")}>
          {t.myReport}
        </MyReportLink>
        <MoreMenu label={t.more} location="header_nav">
          <MoreLinks locale={locale} location="header_nav" groups={moreGroups} />
          <div className="mt-[6px] border-t border-line pt-[6px]"><LanguageLinks options={languages} label={t.language} itemClassName={menuItem} /></div>
        </MoreMenu>
      </nav>

      <nav className="flex shrink-0 items-center md:hidden" aria-label={t.navLabel}>
        <MoreMenu label={t.moreShort} location="header_mobile">
          <MoreLinks locale={locale} location="header_mobile" groups={[phonePrimary, ...moreGroups]} />
          <div className="mt-[6px] border-t border-line pt-[6px]"><LanguageLinks options={languages} label={t.language} itemClassName={menuItem} /></div>
        </MoreMenu>
      </nav>
    </header>
  );
}

/** Rendered on the server, so every link stays in the HTML while the menu is closed. */
function MoreLinks({ locale, location, groups }: { locale: Locale; location: CtaLocation; groups: readonly (readonly MenuLink[])[] }) {
  const t = siteMessages[locale].header;
  return groups.map((group, index) => (
    <ul key={group[0][0]} className={cn(index > 0 && "mt-[6px] border-t border-line pt-[6px]")}>
      {group.map(([path, cta, label, prefetch]) => (
        <li key={path}>
          <Link href={href(locale, path)} prefetch={prefetch} className={menuItem} {...trackAttrs(cta, location)}>
            {t[label]}
          </Link>
        </li>
      ))}
    </ul>
  ));
}
