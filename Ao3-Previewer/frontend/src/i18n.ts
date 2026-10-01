import i18n from "i18next";
import type { BackendModule, Resource, ResourceLanguage } from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { enResources, namespaces } from "./locales/en";
import { buildPseudoLocale } from "./locales/pseudo";

// English ships in the main bundle; any other language lives in
// src/locales/<lng>/<ns>.json and is fetched only when that language is active.
const lazyLocales = import.meta.glob<{ default: ResourceLanguage }>([
  "./locales/*/*.json",
  "!./locales/en/*.json",
]);

const lazyLocaleBackend: BackendModule = {
  type: "backend",
  init() {},
  read(language, namespace, callback) {
    const load = lazyLocales[`./locales/${language}/${namespace}.json`];
    if (!load) {
      callback(null, {});
      return;
    }
    load()
      .then((mod) => callback(null, mod.default))
      .catch((err) => callback(err, null));
  },
};

// Add a language here once its folder exists under src/locales/.
const supportedLngs = ["en"];

const resources: Resource = { en: enResources };

// Dev-only pseudo-locale (?lng=xx): every translated string renders as accented,
// lengthened text, so any plain English left on screen is a string we missed.
if (import.meta.env.DEV) {
  supportedLngs.push("xx");
  resources.xx = buildPseudoLocale(enResources);
}

i18n
  .use(lazyLocaleBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    partialBundledLanguages: true,
    supportedLngs,
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: "en",
    ns: namespaces,
    defaultNS: "common",
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      lookupQuerystring: "lng",
      lookupLocalStorage: "ficformatter-language",
      caches: ["localStorage"],
    },
    interpolation: {
      // React already escapes rendered strings.
      escapeValue: false,
    },
    react: {
      // Render with English while another language loads rather than suspending.
      useSuspense: false,
    },
  });

function syncHtmlLang(lng: string) {
  document.documentElement.lang = lng === "xx" ? "en" : lng;
}

syncHtmlLang(i18n.resolvedLanguage ?? "en");
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
