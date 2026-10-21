import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.DEMO_BASE_URL ?? "http://localhost:3010";
const outputRoot = path.resolve(process.argv[2] ?? "public/guide");
const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 10) {
  console.error("DEMO_PASSWORD is required (at least 10 characters).");
  process.exit(1);
}

const locales = [
  {
    code: "fr",
    browserLocale: "fr-FR",
    emailLabel: "Adresse e-mail",
    passwordLabel: "Mot de passe",
    loginButton: "Se connecter",
  },
  {
    code: "en",
    browserLocale: "en-US",
    emailLabel: "Email address",
    passwordLabel: "Password",
    loginButton: "Log in",
  },
];

const browser = await chromium.launch({ headless: true });

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureLocale(locale) {
  const output = path.join(outputRoot, locale.code);
  await mkdir(output, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    locale: locale.browserLocale,
  });
  const page = await context.newPage();

  async function prepareGuideChrome() {
    await page.addStyleTag({
      content: `
        body > div > header,
        body > div > footer {
          display: none !important;
        }
        body > div {
          max-width: 72rem !important;
          padding-top: 1.25rem !important;
          padding-bottom: 1.25rem !important;
        }
      `,
    });
    await page.evaluate(() => {
      const rewrite = (value) =>
        value.replace(/https?:\/\/localhost:\d+/g, "https://ohyoushouldnt.app");
      document.querySelectorAll("input, textarea").forEach((el) => {
        if ("value" in el && typeof el.value === "string" && el.value.includes("localhost")) {
          el.value = rewrite(el.value);
        }
      });
      document.querySelectorAll("a[href*='localhost']").forEach((el) => {
        el.setAttribute("href", rewrite(el.getAttribute("href") ?? ""));
        if (el.textContent?.includes("localhost")) {
          el.textContent = rewrite(el.textContent);
        }
      });
    });
  }

  async function hideExtraCards(keepCount) {
    await page.evaluate((keep) => {
      const cards = [...document.querySelectorAll('main [data-slot="card"]')];
      cards.forEach((card, index) => {
        if (index >= keep) card.style.display = "none";
      });
    }, keepCount);
  }

  async function gotoStable(pathname) {
    const url = `${baseURL}${pathname}`;
    let lastError;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await sleep(500);
        return;
      } catch (error) {
        lastError = error;
        await sleep(700 * attempt);
      }
    }
    throw lastError;
  }

  async function capture(name, pathname, { after, selector = "main" } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await gotoStable(pathname);
        await prepareGuideChrome();
        if (after) await after();
        await sleep(300);
        const target = page.locator(selector).first();
        await target.waitFor({ state: "visible", timeout: 15000 });
        await target.screenshot({ path: path.join(output, `${name}.png`), animations: "disabled" });
        console.log(`${locale.code}/${name}: ${page.url()}`);
        return;
      } catch (error) {
        lastError = error;
        console.warn(`${locale.code}/${name}: retry ${attempt} — ${error.message}`);
        await sleep(800 * attempt);
      }
    }
    throw lastError;
  }

  await gotoStable(`/?lang=${locale.code}`);

  await capture("liste-partagee", `/l/demo-list-lecture?lang=${locale.code}`);
  await capture("reserver-cadeau", `/l/demo-list-lecture/reserver?lang=${locale.code}`);
  await capture("inscription", `/inscription?lang=${locale.code}`);

  await gotoStable(`/connexion?lang=${locale.code}`);
  await page.getByLabel(locale.emailLabel).fill("alex@example.test");
  await page.getByLabel(locale.passwordLabel).fill(password);
  await page.getByRole("button", { name: locale.loginButton }).click();
  await page.waitForURL("**/");

  const aiCopy =
    locale.code === "en"
      ? {
          title: "Details suggested by AI",
          body: "These fields were prefilled using a language model. Review them before saving.",
          tokens: "1,842 tokens used for this lookup",
          co2: "About 0.9 g CO₂e — roughly equivalent to 0.034 g of red meat",
          disclaimer: "Indicative orders of magnitude, not a certified carbon footprint.",
        }
      : {
          title: "Informations proposées par une IA",
          body: "Ces champs ont été préremplis à l’aide d’un modèle de langage. Relisez-les avant d’enregistrer.",
          tokens: "1 842 tokens utilisés pour cette récupération",
          co2: "Environ 0,9 g de CO₂e — soit l’équivalent d’environ 0,034 g de viande rouge",
          disclaimer: "Ordres de grandeur indicatifs, pas un bilan carbone certifié.",
        };

  await capture("mes-listes", `/?lang=${locale.code}`);
  await capture("nouvelle-idee", `/listes/demo-list?lang=${locale.code}`, {
    after: async () => {
      await page.evaluate(() => {
        const accordion = document.querySelector('[data-slot="accordion"]');
        if (accordion) accordion.style.display = "none";
        const url = document.querySelector('input[name="url"]');
        if (url && "value" in url) {
          url.value = "https://ohyoushouldnt.app/demo/lampe";
          url.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
    },
  });
  await capture("enrich-ia", `/listes/demo-list?lang=${locale.code}`, {
    selector: 'main [data-slot="card"]',
    after: async () => {
      await page.evaluate(() => {
        const accordion = document.querySelector('[data-slot="accordion"]');
        if (accordion) accordion.style.display = "none";
      });
      await page.getByLabel(locale.code === "en" ? "Gift name" : "Nom du cadeau").fill(
        locale.code === "en" ? "Reading lamp" : "Lampe de lecture",
      );
      await page.getByLabel(locale.code === "en" ? "Price (€)" : "Prix (€)").fill("49");
      await page.evaluate((copy) => {
        const cardContent = document.querySelector('main [data-slot="card"] [data-slot="card-content"]');
        const form = cardContent?.querySelector("form") ?? document.querySelector("main form");
        if (!form) return;
        const alert = document.createElement("div");
        alert.setAttribute("role", "alert");
        alert.className =
          "relative mb-3 grid w-full gap-0.5 rounded-base border-2 border-border bg-secondary-background px-2.5 py-2 text-left text-sm text-foreground shadow-shadow has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2";
        alert.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
          <div class="font-medium">${copy.title}</div>
          <div class="text-sm text-muted-foreground">
            <p>${copy.body}</p>
            <ul class="mt-2 list-disc pl-4">
              <li>${copy.tokens}</li>
              <li>${copy.co2}</li>
            </ul>
            <p class="mt-2 text-xs">${copy.disclaimer}</p>
          </div>
        `;
        form.prepend(alert);
      }, aiCopy);
    },
  });
  await capture("categories", `/listes/demo-list?lang=${locale.code}`, {
    after: async () => {
      await page.evaluate(() => {
        const formCard = document.querySelector('main [data-slot="card"]');
        if (formCard) formCard.style.display = "none";
      });
      // Accordéon fermé par défaut : ouvrir 2 sections pour montrer idées + drag
      const triggers = page.locator('[data-slot="accordion-trigger"]');
      const count = await triggers.count();
      for (let i = 0; i < Math.min(2, count); i += 1) {
        await triggers.nth(i).click();
        await sleep(150);
      }
    },
  });
  await capture("partage", `/listes/demo-list?onglet=partage&lang=${locale.code}`, {
    after: async () => hideExtraCards(2),
  });
  await capture("reglages", `/listes/demo-list?onglet=reglages&lang=${locale.code}`, {
    after: async () => hideExtraCards(3),
  });
  await capture("reservations", `/listes/demo-list?onglet=reservations&lang=${locale.code}`);

  await context.close();
}

for (const locale of locales) {
  await captureLocale(locale);
}

// Anciennes captures à la racine de /guide (si présentes)
for (const name of [
  "liste-partagee",
  "reserver-cadeau",
  "inscription",
  "mes-listes",
  "gestion-idees",
  "partage",
  "reglages",
  "reservations",
]) {
  try {
    await unlink(path.join(outputRoot, `${name}.png`));
  } catch {
    // ignore
  }
}

await browser.close();
console.log(`Screenshots written to ${outputRoot}/{fr,en}`);
