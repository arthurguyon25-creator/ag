/* =========================================================
   LE MOON — Scripts du site
   ========================================================= */
(function () {
  "use strict";

  const C = window.MOON_CONFIG;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const DAYS_SHORT = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  const MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // affichage lundi → dimanche
  const SLOT_STEP = 30; // minutes entre deux créneaux de réservation
  const LAST_BOOKING_BEFORE_CLOSE = 60; // dernière résa 1 h avant la fermeture

  /* ---------- Utilitaires ---------- */
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const toMin = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const fmtMin = (min) => {
    const m = ((min % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  };
  const fmtHour = (hhmm) => hhmm.replace(":", "h").replace(/h00$/, "h");
  const fmtPrice = (p) => p.toFixed(2).replace(".", ",").replace(",00", "") + " €";
  const fmtRating = (r) => String(r).replace(".", ",");
  const pad = (n) => String(n).padStart(2, "0");
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseIso = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const longDate = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()].replace(".", "")} ${d.getFullYear()}`;

  /** Horaire d'ouverture d'un jour en minutes : { open, close } (close > 1440 si après minuit) ou null. */
  function spanFor(day) {
    const h = C.hours[day];
    if (!h) return null;
    const open = toMin(h[0]);
    let close = toMin(h[1]);
    if (close <= open) close += 1440;
    return { open, close };
  }

  /** Date/heure actuelle à Pontarlier (Europe/Paris), quel que soit le fuseau du visiteur. */
  function parisNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    const date = new Date(get("year"), get("month") - 1, get("day"));
    return { date, day: date.getDay(), minutes: get("hour") * 60 + get("minute") };
  }

  /** Statut d'ouverture actuel. */
  function openStatus() {
    const { day, minutes } = parisNow();
    const yesterday = (day + 6) % 7;
    const ySpan = spanFor(yesterday);
    if (ySpan && ySpan.close > 1440 && minutes < ySpan.close - 1440) {
      return { open: true, until: fmtMin(ySpan.close) };
    }
    const span = spanFor(day);
    if (span && minutes >= span.open && minutes < span.close) {
      return { open: true, until: fmtMin(span.close) };
    }
    if (span && minutes < span.open) {
      return { open: false, next: `aujourd'hui à ${fmtMin(span.open)}`, nextShort: fmtMin(span.open) };
    }
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      const s = spanFor(d);
      if (s) {
        const when = i === 1 ? "demain" : DAYS_SHORT[d];
        return { open: false, next: `${when} à ${fmtMin(s.open)}`, nextShort: `${fmtMin(s.open)} ${DAYS_SHORT[d]}` };
      }
    }
    return { open: false, next: "", nextShort: "" };
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("is-visible"), 3800);
  }

  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
    },
  };

  async function postJson(url, data) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
  }

  /* ---------- Liens & infos statiques ---------- */
  function initStaticInfo() {
    $$("[data-google-maps]").forEach((a) => (a.href = C.googleMapsUrl));
    $$("[data-google-reviews]").forEach((a) => (a.href = C.googleReviewsUrl));
    $$("[data-social]").forEach((a) => (a.href = C.social[a.dataset.social] || "#"));
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
    $$("[data-rating-value]").forEach((el) => (el.textContent = fmtRating(C.rating.value)));
    $$("[data-rating-count]").forEach((el) => (el.textContent = C.rating.count));
    $$("[data-rating-stars]").forEach((el) => el.style.setProperty("--pct", (C.rating.value / 5) * 100 + "%"));
    $$("[data-highlights]").forEach((ul) => {
      ul.innerHTML = C.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join("");
    });
  }

  /* ---------- Horaires & statut ---------- */
  function renderHours() {
    const today = parisNow().day;
    const table = $("[data-hours-table]");
    table.innerHTML =
      "<tbody>" +
      WEEK_ORDER.map((d) => {
        const h = C.hours[d];
        const label = DAYS[d].charAt(0).toUpperCase() + DAYS[d].slice(1);
        const val = h ? `${fmtHour(h[0])} – ${fmtHour(h[1])}` : '<span class="closed">Fermé</span>';
        return `<tr class="${d === today ? "is-today" : ""}"><td>${label}</td><td>${val}</td></tr>`;
      }).join("") +
      "</tbody>";

    const h = C.hours[today];
    $$("[data-today-hours]").forEach(
      (el) => (el.textContent = h ? `Aujourd'hui : ${fmtHour(h[0])} – ${fmtHour(h[1])}` : "Fermé aujourd'hui")
    );
  }

  function renderStatus() {
    const s = openStatus();
    $$("[data-open-status]").forEach((el) => {
      el.innerHTML = s.open
        ? `Ouvert<span class="status-pill__more">&nbsp;· jusqu'à ${s.until}</span>`
        : `Fermé<span class="status-pill__more">&nbsp;· ouvre ${s.nextShort}</span>`;
      el.classList.toggle("is-open", s.open);
      el.classList.toggle("is-closed", !s.open);
    });
    $$("[data-open-status-long]").forEach((el) => {
      el.textContent = s.open ? `Ouvert maintenant · ferme à ${s.until}` : `Fermé · ouvre ${s.next}`;
      el.style.color = s.open ? "var(--ok)" : "var(--ko)";
    });
  }

  /* ---------- Carte (menu) ---------- */
  function initMenu() {
    const tabs = $("[data-menu-tabs]");
    const panel = $("[data-menu-panel]");
    const search = $("#menuSearch");
    let current = C.menu[0].id;

    tabs.innerHTML = C.menu
      .map(
        (cat, i) =>
          `<button class="tab" role="tab" id="tab-${cat.id}" aria-selected="${i === 0}" data-cat="${cat.id}">` +
          `<span aria-hidden="true">${cat.icon}</span>${escapeHtml(cat.label)}</button>`
      )
      .join("");

    const itemHtml = (item, catLabel) => {
      const tags = (item.tags || [])
        .map((t) => `<span class="badge ${t === "Local" ? "badge--local" : ""}">${escapeHtml(t)}</span>`)
        .join("");
      return `<article class="menu-item">
          <h3 class="menu-item__name">${escapeHtml(item.name)} ${tags}</h3>
          <span class="menu-item__price">${fmtPrice(item.price)}</span>
          <p class="menu-item__desc">${escapeHtml(item.desc || "")}${
            catLabel ? ` <span class="menu-item__cat">· ${escapeHtml(catLabel)}</span>` : ""
          }</p>
        </article>`;
    };

    function render() {
      const q = search.value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      let html;
      if (q) {
        const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        const hits = C.menu.flatMap((cat) =>
          cat.items
            .filter((it) => norm(`${it.name} ${it.desc} ${(it.tags || []).join(" ")}`).includes(q))
            .map((it) => itemHtml(it, cat.label))
        );
        html = hits.length ? hits.join("") : `<p class="menu-empty">Aucun résultat pour « ${escapeHtml(search.value)} ».</p>`;
        panel.removeAttribute("aria-labelledby");
      } else {
        const cat = C.menu.find((c) => c.id === current);
        html = cat.items.map((it) => itemHtml(it)).join("");
        panel.setAttribute("aria-labelledby", "tab-" + cat.id);
      }
      panel.innerHTML = html;
      $$(".tab", tabs).forEach((t) => t.setAttribute("aria-selected", !q && t.dataset.cat === current));
    }

    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      current = btn.dataset.cat;
      search.value = "";
      render();
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
    tabs.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const list = $$(".tab", tabs);
      const idx = list.findIndex((t) => t.dataset.cat === current);
      const next = list[(idx + (e.key === "ArrowRight" ? 1 : -1) + list.length) % list.length];
      next.click();
      next.focus();
    });
    search.addEventListener("input", render);
    render();
  }

  /* ---------- Événements ---------- */
  function initEvents() {
    const { date: today } = parisNow();
    const list = C.events
      .map((ev) => {
        let date;
        if (ev.date) {
          date = parseIso(ev.date);
          if (date < today) return null;
        } else {
          date = new Date(today);
          const diff = (ev.weekday - today.getDay() + 7) % 7;
          date.setDate(date.getDate() + diff);
        }
        return { ...ev, dateObj: date };
      })
      .filter(Boolean)
      .sort((a, b) => a.dateObj - b.dateObj);

    const container = $("[data-events]");
    if (!list.length) {
      container.innerHTML = '<p class="note center">De nouveaux événements arrivent bientôt. Restez connectés !</p>';
      return;
    }

    container.innerHTML = list
      .map((ev) => {
        const d = ev.dateObj;
        const diffDays = Math.round((d - today) / 86400000);
        const soon = diffDays === 0 ? "Ce soir" : diffDays === 1 ? "Demain" : "";
        const recurring = ev.weekday !== undefined && !ev.date ? ` · Tous les ${DAYS[ev.weekday]}s` : "";
        return `<article class="event reveal ${soon ? "event--soon" : ""}">
            ${soon ? `<span class="event__soon">${soon}</span>` : ""}
            <div class="event__date">
              <span class="event__day">${d.getDate()}</span>
              <span class="event__month">${DAYS_SHORT[d.getDay()]} ${MONTHS_SHORT[d.getMonth()]}</span>
            </div>
            <span class="badge event__cat">${escapeHtml(ev.category || "Événement")}</span>
            <h3 class="event__title">${escapeHtml(ev.title)}</h3>
            <p class="event__meta">${escapeHtml(ev.time || "")}${recurring}</p>
            <p class="event__desc">${escapeHtml(ev.desc || "")}</p>
            <a href="#reservation" class="event__cta" data-book-date="${isoDate(d)}" data-book-occasion="Soirée / événement"
               data-book-message="${escapeHtml(ev.title)}">Réserver pour cette soirée →</a>
          </article>`;
      })
      .join("");
  }

  /* ---------- Réservation ---------- */
  function initReservation() {
    const form = $("#reservationForm");
    const dateInput = $("#r-date");
    const timeSelect = $("#r-time");
    const guests = $("#r-guests");
    const errorEl = $("[data-form-error]", form);

    const { date: today } = parisNow();
    const max = new Date(today);
    max.setDate(max.getDate() + 90);
    dateInput.min = isoDate(today);
    dateInput.max = isoDate(max);

    function slotsFor(iso) {
      const d = parseIso(iso);
      const span = spanFor(d.getDay());
      if (!span) return null;
      const now = parisNow();
      const isToday = iso === isoDate(now.date);
      const slots = [];
      // On commence au premier créneau "rond" après l'ouverture.
      const first = Math.ceil(span.open / SLOT_STEP) * SLOT_STEP;
      for (let m = first; m <= span.close - LAST_BOOKING_BEFORE_CLOSE; m += SLOT_STEP) {
        if (isToday && m < now.minutes + 30) continue;
        slots.push(m);
      }
      return slots;
    }

    function fillTimes() {
      const iso = dateInput.value;
      clearError();
      if (!iso) {
        timeSelect.innerHTML = '<option value="">Choisir une date</option>';
        timeSelect.disabled = true;
        return;
      }
      const slots = slotsFor(iso);
      if (slots === null) {
        timeSelect.innerHTML = '<option value="">Fermé ce jour</option>';
        timeSelect.disabled = true;
        showError(`Le Moon est fermé le ${DAYS[parseIso(iso).getDay()]}. Choisissez un autre jour 🌙`);
        return;
      }
      if (!slots.length) {
        timeSelect.innerHTML = '<option value="">Complet / trop tard</option>';
        timeSelect.disabled = true;
        showError("Plus de créneau disponible ce jour-là. Appelez-nous au " + C.phone + ".");
        return;
      }
      const prev = timeSelect.value;
      timeSelect.innerHTML =
        '<option value="">Heure</option>' +
        slots
          .map((m) => {
            const v = fmtMin(m);
            return `<option value="${v}">${v}${m >= 1440 ? " (nuit)" : ""}</option>`;
          })
          .join("");
      timeSelect.disabled = false;
      if (slots.map(fmtMin).includes(prev)) timeSelect.value = prev;
    }

    function showError(msg) { errorEl.textContent = msg; }
    function clearError() { errorEl.textContent = ""; $$(".is-invalid", form).forEach((f) => f.classList.remove("is-invalid")); }

    dateInput.addEventListener("change", fillTimes);

    $$("[data-step]", form).forEach((btn) =>
      btn.addEventListener("click", () => {
        const v = Math.min(40, Math.max(1, (parseInt(guests.value, 10) || 1) + Number(btn.dataset.step)));
        guests.value = v;
      })
    );

    // Pré-remplissage depuis les événements / liens
    document.addEventListener("click", (e) => {
      const ev = e.target.closest("[data-book-date]");
      if (ev) {
        dateInput.value = ev.dataset.bookDate;
        fillTimes();
        $("#r-occasion").value = ev.dataset.bookOccasion;
        const msg = $("#r-message");
        if (!msg.value) msg.value = "Pour la soirée : " + ev.dataset.bookMessage;
      }
      const occ = e.target.closest("[data-prefill-occasion]");
      if (occ) $("#r-occasion").value = occ.dataset.prefillOccasion;
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();

      const invalid = $$("input, select, textarea", form).filter((el) => !el.checkValidity());
      if (invalid.length) {
        invalid.forEach((el) => el.closest(".field")?.classList.add("is-invalid"));
        const first = invalid[0];
        const msg = first.type === "checkbox"
          ? "Merci d'accepter l'utilisation de vos données pour la réservation."
          : "Merci de compléter les champs obligatoires (*).";
        showError(msg);
        first.focus();
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      delete data.consent;
      const dateLabel = longDate(parseIso(data.date));

      const btn = $("button[type=submit]", form);
      if (C.reservationEndpoint) {
        btn.disabled = true;
        btn.textContent = "Envoi…";
        try {
          await postJson(C.reservationEndpoint, { type: "reservation", ...data });
          openConfirm(data, dateLabel, true);
          form.reset();
          fillTimes();
        } catch (err) {
          showError("L'envoi a échoué. Réessayez ou appelez-nous au " + C.phone + ".");
        } finally {
          btn.disabled = false;
          btn.textContent = "Envoyer la demande";
        }
      } else {
        openConfirm(data, dateLabel, false);
      }
    });

    function openConfirm(data, dateLabel, sent) {
      const modal = $("#confirmModal");
      const rows = [
        ["Nom", data.name],
        ["Date", dateLabel],
        ["Heure", data.time],
        ["Personnes", data.guests],
        ["Emplacement", data.area],
        data.occasion && ["Occasion", data.occasion],
        ["Téléphone", data.phone],
      ].filter(Boolean);

      $("#confirmTitle").textContent = sent ? "Demande envoyée !" : "Dernière étape";
      $("[data-confirm-content]", modal).innerHTML =
        `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(v)}</dd>`).join("")}</dl>` +
        (sent
          ? "<p>Merci ! Nous vous recontactons rapidement pour confirmer votre table.</p>"
          : "<p>Envoyez-nous votre demande par e-mail, ou appelez-nous directement pour une confirmation immédiate.</p>");

      const body = [
        "Bonjour Le Moon,",
        "",
        "Je souhaite réserver une table :",
        ...rows.map(([k, v]) => `- ${k} : ${v}`),
        data.email ? `- E-mail : ${data.email}` : "",
        data.message ? `\nMessage : ${data.message}` : "",
        "",
        "Merci !",
      ].filter((l) => l !== "").join("\n");
      const mailto = `mailto:${C.email}?subject=${encodeURIComponent(
        `Réservation — ${dateLabel} ${data.time} — ${data.guests} pers.`
      )}&body=${encodeURIComponent(body)}`;

      $("[data-confirm-actions]", modal).innerHTML = sent
        ? ""
        : `<a class="btn btn--gold btn--block" href="${mailto}">✉️ Envoyer par e-mail</a>
           <a class="btn btn--ghost btn--block" href="tel:${C.phoneIntl}">📞 Appeler le ${C.phone}</a>`;

      if (typeof modal.showModal === "function") modal.showModal();
      else modal.setAttribute("open", "");
    }

    $("[data-close-modal]").addEventListener("click", () => $("#confirmModal").close());
    $("#confirmModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) e.currentTarget.close();
    });
  }

  /* ---------- Avis ---------- */
  const REVIEWS_KEY = "moon.reviews";

  function renderReviews() {
    const local = store.get(REVIEWS_KEY, []).map((r) => ({ ...r, local: true }));
    const all = [...local, ...(C.featuredReviews || [])];
    const grid = $("[data-reviews]");
    $("[data-reviews-empty]").hidden = all.length > 0;
    grid.innerHTML = all
      .map((r) => {
        const d = r.date ? parseIso(r.date) : null;
        return `<article class="review">
            <div class="review__head">
              <span class="review__avatar" aria-hidden="true">${escapeHtml(r.author.charAt(0).toUpperCase())}</span>
              <div>
                <div class="review__author">${escapeHtml(r.author)}</div>
                <div class="review__date">${d ? `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}` : ""}</div>
              </div>
            </div>
            <span class="stars" style="--pct:${(r.rating / 5) * 100}%" role="img" aria-label="${r.rating} sur 5"></span>
            <p class="review__text">${escapeHtml(r.text)}</p>
            ${r.local ? '<span class="review__src">Votre avis · visible sur cet appareil</span>' : ""}
          </article>`;
      })
      .join("");
  }

  function initReviewForm() {
    const form = $("#reviewForm");
    const errorEl = $("[data-form-error]", form);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";
      $$(".is-invalid", form).forEach((f) => f.classList.remove("is-invalid"));

      const data = Object.fromEntries(new FormData(form).entries());
      const problems = [];
      if (!data.author?.trim()) { problems.push("votre prénom"); $("#v-name").closest(".field").classList.add("is-invalid"); }
      if (!data.rating) problems.push("une note");
      if (!data.text || data.text.trim().length < 10) { problems.push("un avis d'au moins 10 caractères"); $("#v-text").closest(".field").classList.add("is-invalid"); }
      if (problems.length) {
        errorEl.textContent = "Il manque " + problems.join(", ") + ".";
        return;
      }

      const review = {
        author: data.author.trim(),
        rating: Number(data.rating),
        text: data.text.trim(),
        date: isoDate(parisNow().date),
      };

      if (C.reviewEndpoint) {
        try {
          await postJson(C.reviewEndpoint, { type: "review", ...review });
          toast("Merci ! Votre avis sera publié après validation 🌙");
        } catch {
          errorEl.textContent = "L'envoi a échoué, réessayez plus tard.";
          return;
        }
      } else {
        const list = store.get(REVIEWS_KEY, []);
        list.unshift(review);
        store.set(REVIEWS_KEY, list.slice(0, 20));
        renderReviews();
        toast("Merci pour votre avis ! Pensez à le partager aussi sur Google ⭐");
      }
      form.reset();
    });
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    const header = $("#header");
    const burger = $("#burger");
    const nav = $("#nav");

    const setMenu = (open) => {
      burger.setAttribute("aria-expanded", open);
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      nav.classList.toggle("is-open", open);
      header.classList.toggle("menu-open", open);
    };
    burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if ("IntersectionObserver" in window) {
      const links = $$(".nav__list a:not(.btn)");
      const spy = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id));
          });
        },
        { rootMargin: "-45% 0px -50% 0px" }
      );
      $$("main section[id]").forEach((s) => spy.observe(s));

      const reveal = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("is-visible");
              reveal.unobserve(en.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      $$(".section__head, .reveal, .card, .hours-card, .map").forEach((el) => {
        el.classList.add("reveal");
        reveal.observe(el);
      });
    }
  }

  /* ---------- Démarrage ---------- */
  initStaticInfo();
  renderHours();
  renderStatus();
  setInterval(renderStatus, 60 * 1000);
  initMenu();
  initEvents();
  initReservation();
  renderReviews();
  initReviewForm();
  initNav();
})();
