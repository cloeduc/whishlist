import type { Resource } from "i18next";
import commonEn from "../../locales/en/common.json";
import authEn from "../../locales/en/auth.json";
import homeEn from "../../locales/en/home.json";
import listEn from "../../locales/en/list.json";
import publicEn from "../../locales/en/public.json";
import errorsEn from "../../locales/en/errors.json";
import mailEn from "../../locales/en/mail.json";
import commonFr from "../../locales/fr/common.json";
import authFr from "../../locales/fr/auth.json";
import homeFr from "../../locales/fr/home.json";
import listFr from "../../locales/fr/list.json";
import publicFr from "../../locales/fr/public.json";
import errorsFr from "../../locales/fr/errors.json";
import mailFr from "../../locales/fr/mail.json";

export const resources = {
  fr: {
    common: commonFr,
    auth: authFr,
    home: homeFr,
    list: listFr,
    public: publicFr,
    errors: errorsFr,
    mail: mailFr,
  },
  en: {
    common: commonEn,
    auth: authEn,
    home: homeEn,
    list: listEn,
    public: publicEn,
    errors: errorsEn,
    mail: mailEn,
  },
} satisfies Resource;
