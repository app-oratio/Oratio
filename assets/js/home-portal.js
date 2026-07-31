(() => {
  "use strict";

  const portal = document.querySelector(".home-portal");
  if (!portal) return;

  const parseJsonScript = (id, fallback) => {
    const element = document.getElementById(id);
    if (!element) return fallback;

    try {
      return JSON.parse(element.textContent || "");
    } catch (error) {
      console.warn(`[Oratio] Não foi possível interpretar ${id}.`, error);
      return fallback;
    }
  };

  const config = parseJsonScript("home-portal-config", {});
  const liturgyDays = parseJsonScript("home-liturgy-data", []);
  const rawBaseUrl = typeof config.baseUrl === "string" ? config.baseUrl.trim() : "";
  const baseUrl = rawBaseUrl ? `/${rawBaseUrl.replace(/^\/+|\/+$/g, "")}` : "";

  const siteUrl = (path) => {
    if (!path || typeof path !== "string") return baseUrl || "/";
    if (/^(?:https?:)?\/\//i.test(path) || path.startsWith("#")) return path;

    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (!baseUrl || normalized === baseUrl || normalized.startsWith(`${baseUrl}/`)) {
      return normalized;
    }

    return `${baseUrl}${normalized}`;
  };

  const getSaoPauloDateParts = () => {
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });

      if (typeof formatter.formatToParts === "function") {
        const values = {};
        formatter.formatToParts(new Date()).forEach((part) => {
          values[part.type] = part.value;
        });

        if (values.year && values.month && values.day) {
          return {
            iso: `${values.year}-${values.month}-${values.day}`,
            year: Number(values.year),
            month: Number(values.month),
            day: Number(values.day)
          };
        }
      }

      const formatted = formatter.format(new Date());
      const match = formatted.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return {
          iso: `${match[1]}-${match[2]}-${match[3]}`,
          year: Number(match[1]),
          month: Number(match[2]),
          day: Number(match[3])
        };
      }
    } catch (error) {
      console.info("[Oratio] O fuso de São Paulo não está disponível neste navegador.", error);
    }

    const fallbackDate = new Date();
    const year = fallbackDate.getFullYear();
    const month = String(fallbackDate.getMonth() + 1).padStart(2, "0");
    const day = String(fallbackDate.getDate()).padStart(2, "0");
    return { iso: `${year}-${month}-${day}`, year, month: Number(month), day: Number(day) };
  };

  const dateParts = getSaoPauloDateParts();
  const todayAtNoon = new Date(`${dateParts.iso}T12:00:00-03:00`);
  const currentDateElement = portal.querySelector("[data-home-current-date]");

  if (currentDateElement) {
    const longDate = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(todayAtNoon);

    currentDateElement.textContent = `${longDate.charAt(0).toUpperCase()}${longDate.slice(1)}. Liturgia, oração, meditação e a memória dos santos para acompanhar sua caminhada.`;
  }

  const findLiturgyDay = () => {
    if (!Array.isArray(liturgyDays) || liturgyDays.length === 0) return null;

    const normalizedDays = liturgyDays
      .filter((item) => item && typeof item.date === "string")
      .sort((a, b) => a.date.localeCompare(b.date));

    return normalizedDays.find((item) => item.date === dateParts.iso)
      || [...normalizedDays].reverse().find((item) => item.date <= dateParts.iso)
      || normalizedDays[0]
      || null;
  };

  const selectedLiturgy = findLiturgyDay();
  if (selectedLiturgy) {
    const exactDate = selectedLiturgy.date === dateParts.iso;
    const status = portal.querySelector("[data-home-liturgy-status]");
    const title = portal.querySelector("[data-home-liturgy-title]");
    const date = portal.querySelector("[data-home-liturgy-date]");
    const dailyLink = portal.querySelector("[data-home-liturgy-link]");
    const hoursLink = portal.querySelector("[data-home-hours-link]");

    if (status) status.textContent = exactDate ? "Liturgia de hoje" : "Liturgia disponível";
    if (title) title.textContent = selectedLiturgy.celebration || "Liturgia e leituras do dia";
    if (date) {
      date.textContent = exactDate
        ? selectedLiturgy.label || "Conteúdo litúrgico de hoje"
        : `${selectedLiturgy.label || selectedLiturgy.date} · data mais recente disponível`;
    }
    if (dailyLink && selectedLiturgy.daily_url) dailyLink.href = siteUrl(selectedLiturgy.daily_url);
    if (hoursLink && selectedLiturgy.hours_url) hoursLink.href = siteUrl(selectedLiturgy.hours_url);
  }

  const normalizeNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  const updateSaintCard = (saints) => {
    if (!Array.isArray(saints)) return;

    const celebrations = saints
      .filter((saint) => {
        if (!saint || saint.published === false) return false;
        return normalizeNumber(saint.memorialMonth) === dateParts.month
          && normalizeNumber(saint.memorialDay) === dateParts.day;
      })
      .sort((a, b) => {
        const parsedOrderA = normalizeNumber(a.dailyOrder);
        const parsedOrderB = normalizeNumber(b.dailyOrder);
        const orderA = parsedOrderA === null ? 999 : parsedOrderA;
        const orderB = parsedOrderB === null ? 999 : parsedOrderB;
        return orderA - orderB;
      });

    if (celebrations.length === 0) return;

    const saint = celebrations[0];
    const title = portal.querySelector("[data-home-saint-title]");
    const description = portal.querySelector("[data-home-saint-description]");
    const label = portal.querySelector("[data-home-saint-label]");
    const link = portal.querySelector("[data-home-saint-link]");
    const linkLabel = portal.querySelector("[data-home-saint-link-label]");
    const media = portal.querySelector("[data-home-saint-media]");
    const image = portal.querySelector("[data-home-saint-image]");

    if (title) {
      title.textContent = celebrations.length > 1
        ? `${saint.shortTitle || saint.title} e outras celebrações`
        : saint.shortTitle || saint.title || "Santo do dia";
    }

    if (description) {
      const additional = celebrations.slice(1).map((item) => item.shortTitle || item.title).filter(Boolean);
      description.textContent = additional.length > 0
        ? `Também celebrados hoje: ${additional.join(", ")}.`
        : saint.description || saint.subtitle || "Conheça sua vida, espiritualidade e testemunho.";
    }

    if (label) label.textContent = saint.liturgicalRank || saint.entryType || "Santo do dia";
    if (link && saint.url) link.href = siteUrl(saint.url);
    if (linkLabel) linkLabel.textContent = "Conhecer esta celebração";

    if (media && image && saint.image) {
      image.src = siteUrl(saint.image);
      image.alt = saint.imageAlt || saint.title || "Santo do dia";
      image.style.objectPosition = saint.imagePosition || "center";
      image.addEventListener("error", () => {
        media.hidden = true;
        image.removeAttribute("src");
      }, { once: true });
      media.hidden = false;
    }
  };

  const saintsDataUrl = typeof config.saintsDataUrl === "string"
    ? siteUrl(config.saintsDataUrl)
    : siteUrl("/santos/dados.json");

  fetch(saintsDataUrl, { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((payload) => updateSaintCard(Array.isArray(payload) ? payload : payload.saints))
    .catch((error) => {
      console.info("[Oratio] O santo do dia permanecerá com o acesso geral.", error);
    });
})();
