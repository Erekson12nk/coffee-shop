/* ==========================================================
   «Зерно» — логика витрины: каталог, фильтры, корзина, заказ.
   Данные заказа никуда не отправляются.
   ========================================================== */
(function () {
  'use strict';

  /* ---------- Утилиты ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fmt = (n) => n.toLocaleString('ru-RU') + ' ₽';
  const normalize = (s) => String(s).toLowerCase().replace(/ё/g, 'е').trim();
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionDelay = (ms) => (reduceMotion.matches ? 0 : ms);

  function plural(n, forms) {
    const n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
    return forms[2];
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  // Смешивает цвет упаковки с фоном страницы — для мягкой подложки карточки
  function tint(hex, amount = 0.78) {
    const base = [247, 241, 232];
    const c = hex.replace('#', '');
    const rgb = [0, 2, 4].map((i) => parseInt(c.substr(i, 2), 16));
    const mix = rgb.map((v, i) => Math.round(v + (base[i] - v) * amount));
    return `rgb(${mix.join(',')})`;
  }

  /* ---------- Хранилище ---------- */
  const STORAGE_KEY = 'zerno-cart-v1';
  const storage = {
    read() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },
    write(data) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        /* хранилище недоступно — корзина живёт до перезагрузки */
      }
    }
  };

  /* ---------- Данные ---------- */
  const FREE_DELIVERY = 3000;
  const DELIVERY_COST = 350;
  const MAX_QTY = 20;
  const productById = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const basePrice = (p) => p.variants[0].price;
  const PRICE_MIN = Math.floor(Math.min(...PRODUCTS.map(basePrice)) / 10) * 10;
  const PRICE_MAX = Math.ceil(Math.max(...PRODUCTS.map(basePrice)) / 10) * 10;

  /* ---------- Рисованные упаковки ---------- */
  function labelSVG(p, top) {
    const c = p.colors;
    const level = ROASTS[p.roast].level;
    const nameSize = p.short.length > 8 ? 10.5 : 12.5;
    const sub = p.category === 'drip' ? 'дрип-пакеты' : ROASTS[p.roast].label.toLowerCase() + ' обжарка';
    const beans = [0, 1, 2].map((i) => {
      const x = 84 + i * 16, y = top + 90;
      return `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="6.6" transform="rotate(-25 ${x} ${y})" fill="${i < level ? c.ink : 'none'}" stroke="${c.ink}" stroke-width="1.5"/>`;
    }).join('');
    return `
      <rect x="58" y="${top}" width="84" height="112" rx="8" fill="${c.label}"/>
      <text x="100" y="${top + 25}" text-anchor="middle" font-family="Lora, Georgia, serif" font-weight="700" font-size="14" letter-spacing="3" fill="${c.ink}">ЗЕРНО</text>
      <path d="M76 ${top + 34} H124" stroke="${c.accent}" stroke-width="2" stroke-linecap="round"/>
      <text x="100" y="${top + 56}" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-weight="800" font-size="${nameSize}" letter-spacing=".5" fill="${c.ink}">${p.short}</text>
      <text x="100" y="${top + 71}" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-weight="600" font-size="8" fill="${c.ink}" fill-opacity=".65">${sub}</text>
      ${beans}`;
  }

  function packSVG(p) {
    const c = p.colors;
    if (p.category === 'drip') {
      return `<svg viewBox="0 0 200 240" aria-hidden="true" focusable="false">
        <ellipse cx="100" cy="231" rx="70" ry="6" fill="#2a1c15" fill-opacity=".14"/>
        <g transform="rotate(-6 100 50)">
          <rect x="66" y="10" width="70" height="64" rx="4" fill="#f6efe3" stroke="#2a1c15" stroke-opacity=".12"/>
          <path d="M74 22 H128" stroke="#2a1c15" stroke-opacity=".2" stroke-width="1.4" stroke-dasharray="3 3"/>
          <text x="101" y="44" text-anchor="middle" font-family="Manrope, Arial, sans-serif" font-weight="700" font-size="8" fill="#2a1c15" fill-opacity=".5">12 г</text>
        </g>
        <rect x="34" y="52" width="132" height="174" rx="10" fill="${c.bag}"/>
        <rect x="34" y="52" width="132" height="22" rx="10" fill="#000" fill-opacity=".12"/>
        <rect x="34" y="66" width="132" height="8" fill="#000" fill-opacity=".06"/>
        <rect x="40" y="80" width="10" height="140" rx="5" fill="#fff" fill-opacity=".16"/>
        <rect x="152" y="74" width="14" height="152" fill="#000" fill-opacity=".08"/>
        <rect x="34" y="208" width="132" height="8" fill="${c.accent}" fill-opacity=".85"/>
        ${labelSVG(p, 88)}
      </svg>`;
    }
    return `<svg viewBox="0 0 200 240" aria-hidden="true" focusable="false">
      <ellipse cx="100" cy="231" rx="68" ry="6" fill="#2a1c15" fill-opacity=".14"/>
      <path d="M46 34 H154 L163 218 Q163 226 155 226 H45 Q37 226 37 218 Z" fill="${c.bag}"/>
      <path d="M46 34 H60 L53 226 H45 Q37 226 37 218 Z" fill="#fff" fill-opacity=".16"/>
      <path d="M142 34 H154 L163 218 Q163 226 155 226 H148 Z" fill="#000" fill-opacity=".1"/>
      <path d="M38.2 196 H161.8 L162.2 205 H37.8 Z" fill="${c.accent}" fill-opacity=".85"/>
      <rect x="43" y="14" width="114" height="24" rx="3" fill="${c.bag}"/>
      <rect x="43" y="14" width="114" height="24" rx="3" fill="#000" fill-opacity=".14"/>
      <path d="M47 26 H153" stroke="#fff" stroke-opacity=".3" stroke-width="12" stroke-dasharray="1.6 3.2"/>
      <circle cx="100" cy="58" r="7.5" fill="#000" fill-opacity=".12"/>
      <circle cx="100" cy="58" r="3" fill="#000" fill-opacity=".18"/>
      ${labelSVG(p, 78)}
    </svg>`;
  }

  const roastDots = (level) => `<span class="roast-dots" data-level="${level}" aria-hidden="true"><i></i><i></i><i></i></span>`;

  /* ---------- Состояние ---------- */
  const state = {
    category: 'all',
    roasts: new Set(),
    min: null,
    max: null,
    query: '',
    sort: 'popular'
  };

  let cart = sanitizeCart(storage.read());

  function sanitizeCart(data) {
    if (!Array.isArray(data)) return [];
    return data.filter((item) => {
      const p = item && productById[item.id];
      return p && p.variants.some((v) => v.id === item.variant) && Number.isFinite(item.qty) && item.qty > 0;
    }).map((item) => ({
      key: item.id + ':' + item.variant,
      id: item.id,
      variant: item.variant,
      qty: Math.min(MAX_QTY, Math.floor(item.qty))
    }));
  }

  /* ---------- Элементы ---------- */
  const el = {
    header: $('.header'),
    grid: $('#productGrid'),
    count: $('#resultsCount'),
    empty: $('#catalogEmpty'),
    search: $('#searchInput'),
    searchForm: $('#searchForm'),
    searchClear: $('#searchClear'),
    sort: $('#sortSelect'),
    filters: $('#filters'),
    filtersToggle: $('#filtersToggle'),
    filtersBadge: $('#filtersBadge'),
    priceMin: $('#priceMin'),
    priceMax: $('#priceMax'),
    priceSlider: $('#priceSlider'),
    priceHint: $('#priceHint'),
    overlay: $('#overlay'),
    productModal: $('#productModal'),
    pmContent: $('#pmContent'),
    drawer: $('#cartDrawer'),
    cartOpen: $('#cartOpen'),
    cartCount: $('#cartCount'),
    cartBtnLabel: $('#cartBtnLabel'),
    cartList: $('#cartList'),
    cartEmpty: $('#cartEmpty'),
    cartFoot: $('#cartFoot'),
    cartSubtotal: $('#cartSubtotal'),
    cartDelivery: $('#cartDelivery'),
    shipping: $('#shipping'),
    shippingText: $('#shippingText'),
    shippingBar: $('#shippingBar'),
    shippingFill: $('#shippingFill'),
    checkoutModal: $('#checkoutModal'),
    checkoutForm: $('#checkoutForm'),
    checkoutView: $('#checkoutFormView'),
    success: $('#checkoutSuccess'),
    toastZone: $('#toastZone')
  };

  /* ==========================================================
     Каталог
     ========================================================== */
  function matchesQuery(p, q) {
    if (!q) return true;
    const hay = normalize([
      p.name, p.origin, p.process, p.notes.join(' '),
      CATEGORIES[p.category], ROASTS[p.roast].label
    ].join(' '));
    return q.split(/\s+/).every((word) => hay.includes(word));
  }

  function getFiltered() {
    const q = normalize(state.query);
    const list = PRODUCTS.filter((p) => {
      if (state.category !== 'all' && p.category !== state.category) return false;
      if (state.roasts.size && !state.roasts.has(p.roast)) return false;
      const price = basePrice(p);
      if (state.min != null && price < state.min) return false;
      if (state.max != null && price > state.max) return false;
      return matchesQuery(p, q);
    });
    const sorters = {
      popular: (a, b) => b.popularity - a.popularity,
      'price-asc': (a, b) => basePrice(a) - basePrice(b),
      'price-desc': (a, b) => basePrice(b) - basePrice(a)
    };
    return list.sort(sorters[state.sort] || sorters.popular);
  }

  function badgeHTML(p) {
    if (!p.badge) return '';
    const mod = p.badge === 'Новинка' ? ' card__badge--new' : p.badge === 'Микролот' ? ' card__badge--lot' : '';
    return `<span class="card__badge${mod}">${p.badge}</span>`;
  }

  function cardHTML(p, i) {
    const v = p.variants[0];
    const roast = ROASTS[p.roast];
    return `<li>
      <article class="card" style="--tint:${tint(p.colors.bag)};--i:${i}">
        ${badgeHTML(p)}
        <div class="card__media">${packSVG(p)}</div>
        <div class="card__body">
          <p class="card__origin">${p.origin}</p>
          <h3 class="card__title"><button type="button" data-open="${p.id}" aria-haspopup="dialog">${p.name}</button></h3>
          <p class="card__notes">${capitalize(p.notes.join(', '))}</p>
          <p class="card__roast">${roastDots(roast.level)}${roast.label} обжарка</p>
          <div class="card__foot">
            <p class="card__price">${fmt(v.price)} <small>/ ${v.label}</small></p>
            <button class="btn btn--primary card__add" type="button" data-add="${p.id}" aria-label="Добавить в корзину: ${p.name}, ${v.label}">В корзину</button>
          </div>
        </div>
      </article>
    </li>`;
  }

  function renderCatalog() {
    const list = getFiltered();
    el.grid.innerHTML = list.map(cardHTML).join('');
    el.empty.hidden = list.length > 0;
    el.grid.hidden = list.length === 0;
    el.count.textContent = list.length
      ? `${list.length === PRODUCTS.length ? 'Всего' : 'Найдено'} ${list.length} ${plural(list.length, ['товар', 'товара', 'товаров'])}`
      : '';
    updateFilterBadge();
  }

  function updateFilterBadge() {
    let n = 0;
    if (state.category !== 'all') n++;
    n += state.roasts.size;
    if (state.min != null || state.max != null) n++;
    el.filtersBadge.hidden = n === 0;
    el.filtersBadge.textContent = n;
  }

  /* ---------- Фильтры ---------- */
  function setupPriceControls() {
    el.priceMin.placeholder = PRICE_MIN;
    el.priceMax.placeholder = PRICE_MAX;
    el.priceSlider.min = PRICE_MIN;
    el.priceSlider.max = PRICE_MAX;
    el.priceSlider.value = PRICE_MAX;
    el.priceHint.textContent = `В каталоге: от ${fmt(PRICE_MIN)} до ${fmt(PRICE_MAX)}`;
    updateSliderFill();
  }

  function updateSliderFill() {
    const pct = ((el.priceSlider.value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
    el.priceSlider.style.setProperty('--fill', pct + '%');
  }

  const readPrice = (input) => {
    const v = parseInt(input.value, 10);
    return Number.isFinite(v) && v >= 0 ? v : null;
  };

  const applyPrice = debounce(() => {
    state.min = readPrice(el.priceMin);
    state.max = readPrice(el.priceMax);
    renderCatalog();
  }, 250);

  function setCategory(value) {
    state.category = value;
    const radio = $(`input[name="category"][value="${value}"]`);
    if (radio) radio.checked = true;
  }

  function resetFilters() {
    setCategory('all');
    state.roasts.clear();
    $$('input[name="roast"]').forEach((c) => { c.checked = false; });
    state.min = state.max = null;
    el.priceMin.value = el.priceMax.value = '';
    el.priceSlider.value = PRICE_MAX;
    updateSliderFill();
    state.query = '';
    el.search.value = '';
    el.searchClear.hidden = true;
    renderCatalog();
  }

  function bindFilters() {
    $$('input[name="category"]').forEach((r) => r.addEventListener('change', () => {
      state.category = r.value;
      renderCatalog();
    }));

    $$('input[name="roast"]').forEach((c) => c.addEventListener('change', () => {
      c.checked ? state.roasts.add(c.value) : state.roasts.delete(c.value);
      renderCatalog();
    }));

    el.priceMin.addEventListener('input', applyPrice);
    el.priceMax.addEventListener('input', () => {
      const v = readPrice(el.priceMax);
      el.priceSlider.value = v == null ? PRICE_MAX : Math.max(PRICE_MIN, Math.min(PRICE_MAX, v));
      updateSliderFill();
      applyPrice();
    });
    el.priceSlider.addEventListener('input', () => {
      const v = Number(el.priceSlider.value);
      el.priceMax.value = v >= PRICE_MAX ? '' : v;
      updateSliderFill();
      applyPrice();
    });

    el.sort.addEventListener('change', () => {
      state.sort = el.sort.value;
      renderCatalog();
    });

    $('#filtersReset').addEventListener('click', resetFilters);
    $('#emptyReset').addEventListener('click', () => {
      resetFilters();
      el.search.focus();
    });

    el.filtersToggle.addEventListener('click', () => {
      const open = el.filters.classList.toggle('is-open');
      el.filtersToggle.setAttribute('aria-expanded', String(open));
    });

    // Поиск
    const runSearch = debounce(() => {
      state.query = el.search.value;
      renderCatalog();
    }, 150);
    el.search.addEventListener('input', () => {
      el.searchClear.hidden = el.search.value === '';
      runSearch();
    });
    el.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      state.query = el.search.value;
      renderCatalog();
      $('#catalog').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
    el.searchClear.addEventListener('click', () => {
      el.search.value = '';
      el.searchClear.hidden = true;
      state.query = '';
      renderCatalog();
      el.search.focus();
    });

    // Быстрый переход к категории (первый экран, подвал)
    $$('[data-quick-category]').forEach((btn) => btn.addEventListener('click', () => {
      setCategory(btn.dataset.quickCategory);
      renderCatalog();
      $('#catalog').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }));
  }

  /* ==========================================================
     Модальные окна: открытие, фокус, Esc
     ========================================================== */
  const layers = [];
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function focusables(root) {
    return $$(FOCUSABLE, root).filter((n) => n.offsetParent !== null || n === document.activeElement);
  }

  function openLayer(layer, opts = {}) {
    if (layers.some((l) => l.el === layer)) return;
    const opener = opts.opener || document.activeElement;
    layers.push({ el: layer, opener, onClose: opts.onClose });

    layer.hidden = false;
    el.overlay.hidden = false;
    document.body.classList.add('is-locked');
    void layer.offsetWidth; // запускаем переход
    layer.classList.add('is-open');
    el.overlay.classList.add('is-visible');

    const target = opts.focus || focusables(layer)[0];
    if (target) target.focus({ preventScroll: true });
  }

  function closeLayer(layer, opts = {}) {
    const idx = layers.findIndex((l) => l.el === layer);
    if (idx === -1) return;
    const [entry] = layers.splice(idx, 1);
    layer.classList.remove('is-open');
    setTimeout(() => {
      if (!layer.classList.contains('is-open')) layer.hidden = true;
    }, motionDelay(320));

    if (!layers.length) {
      el.overlay.classList.remove('is-visible');
      document.body.classList.remove('is-locked');
      setTimeout(() => { if (!layers.length) el.overlay.hidden = true; }, motionDelay(320));
    }

    if (entry.onClose) entry.onClose();
    if (opts.restoreFocus !== false && entry.opener && document.contains(entry.opener)) {
      entry.opener.focus({ preventScroll: true });
    }
  }

  const topLayer = () => layers[layers.length - 1];

  document.addEventListener('keydown', (e) => {
    const top = topLayer();
    if (!top) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLayer(top.el);
      return;
    }
    if (e.key === 'Tab') {
      const items = focusables(top.el);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      if (!top.el.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  el.overlay.addEventListener('click', () => {
    const top = topLayer();
    if (top) closeLayer(top.el);
  });

  // Клик по фону модального окна (вне панели)
  [el.productModal, el.checkoutModal].forEach((m) => {
    m.addEventListener('click', (e) => { if (e.target === m) closeLayer(m); });
  });

  $$('[data-close]').forEach((btn) => btn.addEventListener('click', () => {
    const layer = btn.closest('.modal, .drawer');
    if (layer) closeLayer(layer);
  }));

  /* ==========================================================
     Карточка товара
     ========================================================== */
  function openProduct(id, opener) {
    const p = productById[id];
    if (!p) return;
    const roast = ROASTS[p.roast];
    let qty = 1;
    let variant = p.variants[0];

    el.pmContent.innerHTML = `
      <div class="pm__media" style="--tint:${tint(p.colors.bag, .7)}">${packSVG(p)}</div>
      <div class="pm__body">
        <p class="pm__origin">${p.origin} · ${CATEGORIES[p.category]}</p>
        <h2 class="pm__title" id="pmTitle">${p.name}</h2>
        <p class="pm__desc">${p.description}</p>
        <ul class="pm__notes" aria-label="Вкусовые ноты">
          ${p.notes.map((n) => `<li class="pm__note">${n}</li>`).join('')}
        </ul>
        <dl class="pm__specs">
          <div><dt>Обжарка</dt><dd>${roast.label}</dd></div>
          <div><dt>Обработка</dt><dd>${p.process}</dd></div>
          <div><dt>Высота</dt><dd>${p.altitude}</dd></div>
        </dl>
        <fieldset>
          <legend class="pm__label">${p.category === 'drip' ? 'Количество в наборе' : 'Фасовка'}</legend>
          <div class="variants">
            ${p.variants.map((v, i) => `
              <label class="variant">
                <input type="radio" name="pmVariant" value="${v.id}" ${i === 0 ? 'checked' : ''}>
                <span><strong>${v.label}</strong><small>${fmt(v.price)}</small></span>
              </label>`).join('')}
          </div>
        </fieldset>
        <div class="pm__buy">
          <p class="pm__total" aria-live="polite"><span id="pmTotal"></span><small id="pmTotalNote"></small></p>
          <div class="stepper" role="group" aria-label="Количество">
            <button type="button" data-step="-1" aria-label="Уменьшить количество">−</button>
            <output id="pmQty" aria-live="polite">1</output>
            <button type="button" data-step="1" aria-label="Увеличить количество">+</button>
          </div>
          <button class="btn btn--primary" type="button" id="pmAdd">Добавить в корзину</button>
        </div>
      </div>`;

    const totalEl = $('#pmTotal', el.pmContent);
    const noteEl = $('#pmTotalNote', el.pmContent);
    const qtyEl = $('#pmQty', el.pmContent);
    const minus = $('[data-step="-1"]', el.pmContent);
    const plus = $('[data-step="1"]', el.pmContent);

    function update() {
      totalEl.textContent = fmt(variant.price * qty);
      noteEl.textContent = qty > 1 ? `${qty} × ${fmt(variant.price)}` : `за ${variant.label}`;
      qtyEl.textContent = qty;
      minus.disabled = qty <= 1;
      plus.disabled = qty >= MAX_QTY;
    }

    $$('input[name="pmVariant"]', el.pmContent).forEach((r) => r.addEventListener('change', () => {
      variant = p.variants.find((v) => v.id === r.value);
      update();
    }));
    [minus, plus].forEach((b) => b.addEventListener('click', () => {
      qty = Math.max(1, Math.min(MAX_QTY, qty + Number(b.dataset.step)));
      update();
      if (b.disabled) (b === minus ? plus : minus).focus();
    }));
    $('#pmAdd', el.pmContent).addEventListener('click', () => {
      addToCart(p.id, variant.id, qty);
      closeLayer(el.productModal);
      notifyAdded(p, variant, qty);
    });

    update();
    el.productModal.querySelector('.modal__panel').scrollTop = 0;
    openLayer(el.productModal, { opener, focus: $('.modal__close', el.productModal) });
  }

  /* ==========================================================
     Корзина
     ========================================================== */
  function saveCart() {
    storage.write(cart.map(({ id, variant, qty }) => ({ id, variant, qty })));
  }

  function lineInfo(item) {
    const p = productById[item.id];
    const v = p.variants.find((x) => x.id === item.variant);
    return { p, v, sum: v.price * item.qty };
  }

  const subtotal = () => cart.reduce((s, item) => s + lineInfo(item).sum, 0);
  const totalQty = () => cart.reduce((s, item) => s + item.qty, 0);

  function addToCart(id, variantId, qty = 1) {
    const key = id + ':' + variantId;
    const existing = cart.find((i) => i.key === key);
    if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    else cart.push({ key, id, variant: variantId, qty: Math.min(MAX_QTY, qty) });
    saveCart();
    renderCart();
    bumpCart();
  }

  function setQty(key, qty) {
    const item = cart.find((i) => i.key === key);
    if (!item) return;
    item.qty = Math.max(1, Math.min(MAX_QTY, qty));
    saveCart();
    renderCart();
  }

  function removeItem(key) {
    const idx = cart.findIndex((i) => i.key === key);
    if (idx === -1) return;
    const removed = cart[idx];
    const row = el.cartList.querySelector(`[data-key="${CSS.escape(key)}"]`);
    const finish = () => {
      cart = cart.filter((i) => i.key !== key);
      saveCart();
      renderCart();
      // Фокус — на соседний товар или на кнопку закрытия
      const next = el.cartList.querySelectorAll('.cart-item')[Math.min(idx, cart.length - 1)];
      const target = next ? next.querySelector('.cart-item__remove') : $('#cartEmptyBtn');
      if (target) target.focus();
      const { p, v } = lineInfo(removed);
      toast(`«${p.name}», ${v.label} — удалено из корзины`, {
        label: 'Вернуть',
        onClick: () => {
          cart.splice(Math.min(idx, cart.length), 0, removed);
          saveCart();
          renderCart();
        }
      });
    };
    if (row && !reduceMotion.matches) {
      row.classList.add('is-removing');
      setTimeout(finish, 260);
    } else {
      finish();
    }
  }

  function bumpCart() {
    el.cartOpen.classList.remove('is-bump');
    void el.cartOpen.offsetWidth;
    el.cartOpen.classList.add('is-bump');
  }

  function cartItemHTML(item) {
    const { p, v, sum } = lineInfo(item);
    return `<li class="cart-item" data-key="${item.key}">
      <div class="cart-item__media" style="--tint:${tint(p.colors.bag)}">${packSVG(p)}</div>
      <div>
        <p class="cart-item__title">${p.name}</p>
        <p class="cart-item__meta">${v.label} · ${fmt(v.price)}</p>
        <div class="stepper stepper--sm" role="group" aria-label="Количество: ${p.name}, ${v.label}">
          <button type="button" data-action="dec" data-key="${item.key}" aria-label="Уменьшить количество" ${item.qty <= 1 ? 'disabled' : ''}>−</button>
          <output aria-live="polite">${item.qty}</output>
          <button type="button" data-action="inc" data-key="${item.key}" aria-label="Увеличить количество" ${item.qty >= MAX_QTY ? 'disabled' : ''}>+</button>
        </div>
      </div>
      <div class="cart-item__side">
        <span class="cart-item__price">${fmt(sum)}</span>
        <button type="button" class="cart-item__remove" data-action="remove" data-key="${item.key}" aria-label="Удалить из корзины: ${p.name}, ${v.label}">Удалить</button>
      </div>
    </li>`;
  }

  function renderCart() {
    // Запоминаем, где был фокус, чтобы вернуть его после перерисовки
    const active = document.activeElement;
    const focusAction = active && active.dataset ? active.dataset.action : null;
    const focusKey = active && active.dataset ? active.dataset.key : null;

    const qty = totalQty();
    const sum = subtotal();

    el.cartCount.textContent = qty > 99 ? '99+' : qty;
    el.cartCount.classList.toggle('is-visible', qty > 0);
    el.cartBtnLabel.textContent = `Корзина, товаров: ${qty}`;

    const isEmpty = cart.length === 0;
    el.cartList.hidden = isEmpty;
    el.cartEmpty.hidden = !isEmpty;
    el.cartFoot.hidden = isEmpty;
    el.shipping.hidden = isEmpty;

    el.cartList.innerHTML = cart.map(cartItemHTML).join('');
    el.cartSubtotal.textContent = fmt(sum);

    const left = Math.max(0, FREE_DELIVERY - sum);
    const done = left === 0;
    el.shipping.classList.toggle('is-done', done);
    el.shippingText.innerHTML = done
      ? '<strong>Доставка бесплатная</strong> — спасибо, что берёте с запасом!'
      : `До бесплатной доставки осталось <strong>${fmt(left)}</strong>`;
    el.shippingFill.style.width = Math.min(100, (sum / FREE_DELIVERY) * 100) + '%';
    el.shippingBar.setAttribute('aria-valuenow', String(Math.min(sum, FREE_DELIVERY)));
    el.cartDelivery.textContent = done ? 'Бесплатно' : `${fmt(DELIVERY_COST)}, самовывоз — бесплатно`;

    if (focusAction && focusKey) {
      let target = el.cartList.querySelector(`[data-action="${focusAction}"][data-key="${CSS.escape(focusKey)}"]`);
      if (target && target.disabled) {
        target = el.cartList.querySelector(`[data-action="${focusAction === 'dec' ? 'inc' : 'dec'}"][data-key="${CSS.escape(focusKey)}"]`);
      }
      if (target) target.focus();
    }
  }

  function bindCart() {
    el.cartOpen.addEventListener('click', () => openLayer(el.drawer, { opener: el.cartOpen }));

    el.cartList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const key = btn.dataset.key;
      const item = cart.find((i) => i.key === key);
      if (!item) return;
      if (btn.dataset.action === 'inc') setQty(key, item.qty + 1);
      if (btn.dataset.action === 'dec') setQty(key, item.qty - 1);
      if (btn.dataset.action === 'remove') removeItem(key);
    });

    $('#cartClear').addEventListener('click', () => {
      const backup = cart.slice();
      cart = [];
      saveCart();
      renderCart();
      $('#cartEmptyBtn').focus();
      toast('Корзина очищена', {
        label: 'Вернуть',
        onClick: () => { cart = backup; saveCart(); renderCart(); }
      });
    });

    $('#cartEmptyBtn').addEventListener('click', () => {
      closeLayer(el.drawer, { restoreFocus: false });
      const catalog = $('#catalog');
      catalog.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      el.search.focus({ preventScroll: true });
    });

    $('#checkoutOpen').addEventListener('click', () => {
      if (!cart.length) return;
      closeLayer(el.drawer, { restoreFocus: false });
      openCheckout();
    });

    // Карточки каталога
    el.grid.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      if (add) {
        const p = productById[add.dataset.add];
        const v = p.variants[0];
        addToCart(p.id, v.id, 1);
        add.classList.add('is-added');
        add.textContent = 'Добавлено ✓';
        setTimeout(() => {
          add.classList.remove('is-added');
          add.textContent = 'В корзину';
        }, 1400);
        notifyAdded(p, v, 1);
        return;
      }
      const open = e.target.closest('[data-open]');
      if (open) openProduct(open.dataset.open, open);
    });
  }

  function notifyAdded(p, v, qty) {
    toast(`${p.name}, ${v.label}${qty > 1 ? ' × ' + qty : ''} — в корзине`, {
      label: 'Открыть',
      onClick: () => openLayer(el.drawer, { opener: el.cartOpen }),
      success: true
    });
  }

  // Синхронизация между вкладками
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      cart = sanitizeCart(storage.read());
      renderCart();
    }
  });

  /* ==========================================================
     Уведомления
     ========================================================== */
  function toast(text, opts = {}) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.innerHTML = `
      ${opts.success ? '<span class="toast__icon" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : ''}
      <span class="toast__text"></span>`;
    $('.toast__text', node).textContent = text;

    let timer;
    const remove = () => {
      clearTimeout(timer);
      node.classList.add('is-leaving');
      setTimeout(() => node.remove(), motionDelay(300));
    };

    if (opts.label) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opts.label;
      btn.addEventListener('click', () => { remove(); opts.onClick && opts.onClick(); });
      node.appendChild(btn);
    }

    // Не более трёх уведомлений одновременно
    while (el.toastZone.children.length >= 3) el.toastZone.firstElementChild.remove();
    el.toastZone.appendChild(node);
    timer = setTimeout(remove, 4000);
    node.addEventListener('mouseenter', () => clearTimeout(timer));
    node.addEventListener('mouseleave', () => { timer = setTimeout(remove, 2000); });
  }

  /* ==========================================================
     Оформление заказа (демо — без отправки данных)
     ========================================================== */
  const form = el.checkoutForm;
  const fields = {
    name: $('#coName'),
    phone: $('#coPhone'),
    address: $('#coAddress')
  };
  let triedSubmit = false;

  const deliveryMethod = () => (form.querySelector('input[name="delivery"]:checked') || {}).value || 'courier';

  function deliveryPrice(sum, method) {
    if (method === 'pickup' || sum >= FREE_DELIVERY) return 0;
    return DELIVERY_COST;
  }

  function updateCheckoutSummary() {
    const sum = subtotal();
    const method = deliveryMethod();
    const dPrice = deliveryPrice(sum, method);
    $('#coSubtotal').textContent = fmt(sum);
    $('#coDelivery').textContent = dPrice ? fmt(dPrice) : 'Бесплатно';
    $('#coTotal').textContent = fmt(sum + dPrice);

    const isPickup = method === 'pickup';
    $('#addressField').hidden = isPickup;
    $('#pickupInfo').hidden = !isPickup;
    $('#coAddressLabel').textContent = method === 'point' ? 'Адрес пункта выдачи' : 'Адрес доставки';
    fields.address.placeholder = method === 'point' ? 'Город, улица и номер пункта' : 'Город, улица, дом, квартира';
  }

  function formatPhone(value) {
    let d = value.replace(/\D/g, '');
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    let out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  }

  const validators = {
    name(v) {
      const s = v.trim();
      if (!s) return 'Укажите, как к вам обращаться';
      if (s.length < 2) return 'Имя слишком короткое';
      if (!/^[A-Za-zА-Яа-яЁё\s'-]+$/.test(s)) return 'Используйте только буквы, пробел и дефис';
      return '';
    },
    phone(v) {
      const d = v.replace(/\D/g, '');
      if (!d) return 'Укажите телефон, чтобы мы могли подтвердить заказ';
      if (d.length !== 11) return 'Номер должен содержать 11 цифр';
      return '';
    },
    address(v) {
      if (deliveryMethod() === 'pickup') return '';
      const s = v.trim();
      if (!s) return deliveryMethod() === 'point' ? 'Укажите адрес пункта выдачи' : 'Укажите адрес доставки';
      if (s.length < 6) return 'Уточните адрес: город, улица и дом';
      return '';
    }
  };

  function validateField(name) {
    const input = fields[name];
    const msg = validators[name](input.value);
    const err = $('#' + input.getAttribute('aria-describedby'));
    err.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  function resetCheckout() {
    form.reset();
    triedSubmit = false;
    Object.keys(fields).forEach((k) => {
      fields[k].removeAttribute('aria-invalid');
      $('#' + fields[k].getAttribute('aria-describedby')).textContent = '';
    });
    el.checkoutView.hidden = false;
    el.success.hidden = true;
    updateCheckoutSummary();
  }

  function openCheckout() {
    resetCheckout();
    el.checkoutModal.querySelector('.modal__panel').scrollTop = 0;
    openLayer(el.checkoutModal, { opener: el.cartOpen, focus: fields.name });
  }

  function bindCheckout() {
    fields.phone.addEventListener('input', (e) => {
      if (e.inputType && e.inputType.startsWith('delete')) return;
      fields.phone.value = formatPhone(fields.phone.value);
    });
    fields.phone.addEventListener('focus', () => {
      if (!fields.phone.value) fields.phone.value = '+7 (';
    });
    fields.phone.addEventListener('blur', () => {
      if (fields.phone.value.replace(/\D/g, '').length <= 1) fields.phone.value = '';
      else fields.phone.value = formatPhone(fields.phone.value);
    });

    Object.keys(fields).forEach((name) => {
      fields[name].addEventListener('input', () => { if (triedSubmit) validateField(name); });
      fields[name].addEventListener('blur', () => { if (triedSubmit || fields[name].value) validateField(name); });
    });

    $$('input[name="delivery"]', form).forEach((r) => r.addEventListener('change', () => {
      updateCheckoutSummary();
      if (triedSubmit) validateField('address');
    }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      triedSubmit = true;
      const order = ['name', 'phone', 'address'];
      const results = order.map((n) => validateField(n));
      const firstBad = order.find((n, i) => !results[i]);
      if (firstBad) {
        const field = fields[firstBad].closest('.field');
        field.classList.remove('is-shake');
        void field.offsetWidth;
        field.classList.add('is-shake');
        fields[firstBad].focus();
        return;
      }
      showSuccess();
    });

    $('#successClose').addEventListener('click', () => closeLayer(el.checkoutModal));
  }

  function showSuccess() {
    const name = fields.name.value.trim().split(/\s+/)[0];
    const method = deliveryMethod();
    const orderNo = 'З-' + String(Math.floor(10000 + Math.random() * 89999));
    const total = subtotal() + deliveryPrice(subtotal(), method);
    const how = {
      courier: 'курьер привезёт заказ в течение 1–2 дней',
      point: 'заказ приедет в пункт выдачи за 2–5 дней',
      pickup: 'заказ можно будет забрать в мастерской'
    }[method];

    $('#successText').textContent =
      `${name}, номер вашего заказа — ${orderNo}, сумма ${fmt(total)}. В настоящем магазине мы бы перезвонили по номеру ${fields.phone.value}, а ${how}.`;

    cart = [];
    saveCart();
    renderCart();

    el.checkoutView.hidden = true;
    el.success.hidden = false;
    el.success.focus();
  }

  /* ==========================================================
     Первый экран и мелочи
     ========================================================== */
  function renderHero() {
    const picks = ['ethiopia-yirgacheffe', 'blend-morning', 'kenya-nyeri'].map((id) => productById[id]);
    const bean = (style) => `<svg class="hero__bean" style="${style}" viewBox="0 0 24 32"><ellipse cx="12" cy="16" rx="10" ry="14" fill="currentColor"/><path d="M8 4 C15 11 9 20 16 28" stroke="#f7f1e8" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
    $('#heroVisual').innerHTML = `
      <span class="hero__plate"></span>
      ${picks.map((p, i) => `<div class="hero__bag hero__bag--${i + 1}">${packSVG(p)}</div>`).join('')}
      ${bean('left:6%;top:14%;animation-delay:-1s')}
      ${bean('right:10%;top:8%;width:20px;animation-delay:-4s')}
      ${bean('right:2%;top:46%;width:18px;animation-delay:-6s;opacity:.7')}
      ${bean('left:0;top:52%;width:16px;animation-delay:-2.5s;opacity:.6')}`;
  }

  function bindHeader() {
    const onScroll = () => el.header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Запуск ---------- */
  function init() {
    $('#year').textContent = new Date().getFullYear();
    renderHero();
    setupPriceControls();
    bindFilters();
    bindCart();
    bindCheckout();
    bindHeader();
    renderCatalog();
    renderCart();
  }

  init();
})();
