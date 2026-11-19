// ==========================================
// TERROIR SPECIALTY COFFEE - CORE APPLICATION
// ==========================================

// ==========================================
// Catalog storage and migration
// ==========================================


const LEGACY_PRODUCT_IMAGES = {
    'prod-special-andy': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
    'prod-1': 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80',
    'prod-2': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    'prod-3': 'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?auto=format&fit=crop&w=800&q=80',
    'prod-4': 'https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=800&q=80',
    'prod-6': 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80'
};

const PRODUCTS_STORAGE_VERSION = 'v4_full_story_catalog';

function getStoredProducts() {
    try {
        const version = localStorage.getItem('products_version');
        const stored = localStorage.getItem('products');
        if (stored && version === PRODUCTS_STORAGE_VERSION) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const migrated = parsed.map(product => {
                    const originalImage = LEGACY_PRODUCT_IMAGES[product.id];
                    if (!originalImage || product.image !== originalImage) return product;
                    const defaultProduct = DEFAULT_PRODUCTS.find(item => item.id === product.id);
                    return { ...product, image: defaultProduct.image };
                });
                if (migrated.some((product, index) => product !== parsed[index])) {
                    saveStoredProducts(migrated);
                }
                return migrated;
            }
        }
    } catch (e) {
        console.warn('Error reading products from localStorage:', e);
    }
    saveStoredProducts(DEFAULT_PRODUCTS);
    try {
        localStorage.setItem('products_version', PRODUCTS_STORAGE_VERSION);
    } catch (e) { }
    return DEFAULT_PRODUCTS;
}

function saveStoredProducts(productsList) {
    try {
        localStorage.setItem('products', JSON.stringify(productsList));
    } catch (e) {
        console.warn('Error saving products to localStorage:', e);
    }
}

// ==========================================
// 2. AI BARISTA QUIZ LOGIC
// ==========================================
let userPreferences = {
    roast: '',
    brew: ''
};

const coffeeDatabase = {
    'light-filter': {
        id: 'prod-1',
        desc: {
            en: "An incredible light roast. Perfect for filter or Turk. Explodes with floral notes of jasmine, bergamot, and sweet black tea.",
            es: "Un increíble tueste ligero. Perfecto para filtro o cafetera turca. Con notas florales de jazmín, bergamota y té negro.",
            ua: "Неймовірна світла кава. Ідеально для фільтра або турки. Розкривається квітковими нотами жасмину, бергамоту та чорного чаю.",
            de: "Jasmin, Bergamotte und schwarzer Tee. Passt gut zu Filterkaffee."
        }
    },
    'light-espresso': {
        id: 'prod-2',
        desc: {
            en: "Light-medium roast. Gives a bright, modern espresso shot with unique notes of strawberry yogurt and white chocolate.",
            es: "Tueste medio-ligero. Espresso moderno y brillante con notas únicas de yogur de fresa y chocolate blanco.",
            ua: "Світло-середнє обсмаження. Яскравий сучасний еспресо з унікальними нотами полуничного йогурту та білого шоколаду.",
            de: "Erdbeere und weisse Schokolade für einen fruchtigen Espresso."
        }
    },
    'dark-filter': {
        id: 'prod-3',
        desc: {
            en: "Medium-dark roast. Smooth and rich body with sweet notes of red apple, milk chocolate, and a clean nutty finish.",
            es: "Tueste medio-oscuro. Cuerpo suave y rico con notas de manzana roja, chocolate con leche y un final a nuez.",
            ua: "Середньо-темне обсмаження. М'який насичений смак із нотами червоного яблука, молочного шоколаду та горіховим післясмаком.",
            de: "Roter Apfel, Milchschokolade und Haselnuss für einen runden Filterkaffee."
        }
    },
    'dark-espresso': {
        id: 'prod-4',
        desc: {
            en: "Classic dark roast profile. Perfect for rich espresso. Low acidity, heavy body, full of rich dark chocolate and toasted nuts.",
            es: "Perfil clásico de tueste oscuro. Perfecto para un espresso denso. Baja acidez, mucho cuerpo y notas a chocolate negro.",
            ua: "Класичне темне обсмаження. Ідеально для насиченого еспресо. Низька кислотність, щільне тіло, ноти гіркого шоколаду.",
            de: "Dunkle Schokolade, geröstete Mandel und Karamell für einen kräftigen Espresso."
        }
    }
};

function initQuiz() {
    const quizButtons = document.querySelectorAll('.quiz-btn');
    quizButtons.forEach(button => {
        button.addEventListener('click', function () {
            const param = this.getAttribute('data-param');
            const value = this.getAttribute('data-value');

            userPreferences[param] = value;

            const step1 = document.getElementById('step-1');
            const step2 = document.getElementById('step-2');

            if (param === 'roast') {
                if (step1) step1.style.display = 'none';
                if (step2) step2.style.display = 'block';
            } else if (param === 'brew') {
                if (step2) step2.style.display = 'none';
                showQuizResult();
                document.getElementById('result-title').focus();
            }
        });
    });

    document.getElementById('quiz-product-btn').addEventListener('click', () => {
        const product = findQuizProduct();
        if (product) openQuickView(product);
    });

    const quizRestartBtn = document.getElementById('quiz-restart-btn');
    if (quizRestartBtn) {
        quizRestartBtn.addEventListener('click', function () {
            const quizResult = document.getElementById('quiz-result');
            const step1 = document.getElementById('step-1');
            const step2 = document.getElementById('step-2');

            if (quizResult) quizResult.style.display = 'none';
            if (step2) step2.style.display = 'none';
            if (step1) step1.style.display = 'block';

            userPreferences = { roast: '', brew: '' };
            step1?.querySelector('button')?.focus();
        });
    }
}

function findQuizProduct() {
    const match = coffeeDatabase[`${userPreferences.roast}-${userPreferences.brew}`];
    return match && getStoredProducts().find(product => product.id === match.id);
}

function showQuizResult() {
    const resultKey = `${userPreferences.roast}-${userPreferences.brew}`;
    const matchedCoffee = coffeeDatabase[resultKey];
    if (!matchedCoffee) return;

    const currentLang = activeLanguage;
    const resultTitle = document.getElementById('result-title');
    const resultDesc = document.getElementById('result-description');
    const quizResult = document.getElementById('quiz-result');

    const product = findQuizProduct();
    const copy = dictionary[currentLang];
    if (resultTitle) resultTitle.textContent = product ? (copy[product.titleKey] || product.title) : copy.quiz_unavailable;
    document.getElementById('quiz-product-btn').hidden = !product;
    if (resultDesc) {
        const reasons = {
en: ['You chose ', 'fruity or floral flavours', 'chocolate or nut flavours', ' and ', 'filter brewing', 'espresso or moka', '. This coffee is a starting point for that combination. '],
es: ['Elegiste ', 'sabores afrutados o florales', 'chocolate o frutos secos', ' y ', 'preparación de filtro', 'espresso o moka', '. Este café encaja como punto de partida. '],
ua: ['Ви обрали ', 'фруктові або квіткові смаки', 'шоколадні або горіхові смаки', ' та ', 'фільтр', 'еспресо або гейзерну кавоварку', '. Ця кава — початок для такого поєднання. '],
de: ['Du hast ', 'fruchtige oder blumige Aromen', 'Schokolade oder Nüsse', ' und ', 'Filterkaffee', 'Espresso oder Mokka', ' gewählt. Dieser Kaffee passt als Ausgangspunkt dazu. ']
};
const words = reasons[currentLang] || reasons.en;
const reason = words[0] + words[userPreferences.roast === 'light' ? 1 : 2] + words[3] + words[userPreferences.brew === 'filter' ? 4 : 5] + words[6];
resultDesc.innerText = product ? reason + (matchedCoffee.desc[currentLang] || matchedCoffee.desc.en) : '';
    }
    if (quizResult) quizResult.style.display = 'block';
}

// ==========================================
// 3. SHOP CATALOG CONTROLLER & SEARCH/FILTER
// ==========================================
let currentCatalogFilter = 'all';
let currentSearchQuery = '';

function renderShopCatalog() {
    const shopGrid = document.getElementById('shop-grid');
    if (!shopGrid) return;

    const currentLang = activeLanguage;
    const langDict = dictionary[currentLang] || dictionary.en;
    const allProducts = getStoredProducts();

    // Filter products
    const filteredProducts = allProducts.filter(product => {
        // Category filter matching
        let matchesFilter = true;
        if (currentCatalogFilter !== 'all') {
            if (currentCatalogFilter === 'special') {
                matchesFilter = !!product.isSpecial || product.id === 'prod-special-andy' || product.category === 'special';
            } else if (currentCatalogFilter === 'bestseller') {
                matchesFilter = product.category === 'bestseller' || (product.badge && product.badge.toLowerCase().includes('best'));
            } else if (currentCatalogFilter === 'new') {
                matchesFilter = product.category === 'new' || (product.badge && product.badge.toLowerCase().includes('new'));
            } else if (currentCatalogFilter === 'single_origin') {
                matchesFilter = product.category === 'single_origin' || (product.badge && product.badge.toLowerCase().includes('single'));
            }
        }

        // Search text matching
        let matchesSearch = true;
        if (currentSearchQuery.trim() !== '') {
            const q = currentSearchQuery.toLowerCase().trim();
            const title = ((product.titleKey && langDict[product.titleKey]) ? langDict[product.titleKey] : product.title).toLowerCase();
            const notes = ((product.notesKey && langDict[product.notesKey]) ? langDict[product.notesKey] : product.notes).toLowerCase();
            matchesSearch = title.includes(q) || notes.includes(q);
        }

        return matchesFilter && matchesSearch;
    });

    shopGrid.innerHTML = '';

    if (filteredProducts.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results-card';
        noResults.innerHTML = `
            <span class="no-results-icon">☕</span>
            <h3 class="no-results-title">${langDict.search_no_results_title || 'No Coffees Found'}</h3>
            <p class="no-results-desc">${langDict.search_no_results_desc || 'Try adjusting your search or filter.'}</p>
            <button type="button" class="btn btn-secondary btn-reset-filter" id="resetFiltersBtn">${langDict.search_reset_btn || 'Show All Coffees'}</button>
        `;
        shopGrid.appendChild(noResults);

        const resetBtn = document.getElementById('resetFiltersBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                currentCatalogFilter = 'all';
                currentSearchQuery = '';
                const searchInput = document.getElementById('catalogSearchInput');
                if (searchInput) searchInput.value = '';
                const chips = document.querySelectorAll('.catalog-filter-chips .filter-chip');
                chips.forEach(c => c.classList.toggle('active', c.getAttribute('data-filter') === 'all'));
                renderShopCatalog();
            });
        }
        return;
    }

    filteredProducts.forEach((product, idx) => {
        const titleText = (product.titleKey && langDict[product.titleKey]) ? langDict[product.titleKey] : product.title;
        const notesText = (product.notesKey && langDict[product.notesKey]) ? langDict[product.notesKey] : product.notes;
        const badgeText = (product.badgeKey && langDict[product.badgeKey]) ? langDict[product.badgeKey] : (product.badge || '');
        const addBtnText = langDict.btn_add_to_bag || 'Add to Bag';
        const qvLabelText = langDict.btn_quick_view || 'Quick View';

        const isSpecialCard = product.isSpecial || product.id === 'prod-special-andy';
        const cardClass = isSpecialCard ? 'product-card special-andy-card reveal-on-scroll' : 'product-card reveal-on-scroll';
        const delayClass = `reveal-delay-${(idx % 4) + 1}`;

        const card = document.createElement('div');
        card.className = `${cardClass} ${delayClass}`;
        card.setAttribute('data-id', product.id);

        card.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image}" alt="${titleText}" class="product-image" loading="lazy">
                ${badgeText ? `<span class="product-badge">${badgeText}</span>` : ''}
                <div class="product-image-overlay">
                    <span class="product-quick-view-badge">
                        <span class="qv-icon">👁</span> ${qvLabelText}
                    </span>
                </div>
            </div>
            <div class="product-info">
                <p class="product-format">${productFormat(product, langDict)}</p>
                <h3 class="product-title">${titleText}</h3>
                <p class="product-notes">${notesText}</p>
                <div class="product-bottom">
                    <span class="product-price">€${Number(product.price).toFixed(2)}</span>
                    <button type="button" class="btn btn-add-to-cart" data-id="${product.id}" data-i18n="btn_add_to_bag">
                        ${addBtnText}
                    </button>
                </div>
            </div>
        `;

        // Entire card click opens Quick View modal (unless clicking Add to Bag)
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-add-to-cart')) {
                return;
            }
            openQuickView(product);
        });

        // Add to Bag click
        const addBtn = card.querySelector('.btn-add-to-cart');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                addProductToCart(product, 1, addBtn);
            });
        }

        shopGrid.appendChild(card);
    });

    initScrollReveal();
}

function initCatalogControls() {
    const searchInput = document.getElementById('catalogSearchInput');
    const clearBtn = document.getElementById('catalogSearchClear');
    const filterChips = document.querySelectorAll('.catalog-filter-chips .filter-chip');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            if (clearBtn) {
                clearBtn.style.display = currentSearchQuery.length > 0 ? 'flex' : 'none';
            }
            renderShopCatalog();
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearchQuery = '';
            clearBtn.style.display = 'none';
            searchInput.focus();
            renderShopCatalog();
        });
    }

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCatalogFilter = chip.getAttribute('data-filter') || 'all';
            renderShopCatalog();
        });
    });
}

// ==========================================
// 4. QUICK VIEW MODAL CONTROLLER
// ==========================================
let quickViewProduct = null;
let quickViewQty = 1;

function openQuickView(product) {
    const overlay = document.getElementById('quickViewOverlay');
    if (!overlay) return;

    quickViewProduct = product;
    quickViewQty = 1;

    const currentLang = activeLanguage;
    const langDict = dictionary[currentLang] || dictionary.en;

    const defaultProd = DEFAULT_PRODUCTS.find(p => p.id === product.id);
    const titleKey = product.titleKey || (defaultProd ? defaultProd.titleKey : null);
    const notesKey = product.notesKey || (defaultProd ? defaultProd.notesKey : null);
    const badgeKey = product.badgeKey || (defaultProd ? defaultProd.badgeKey : null);
    const storyKey = product.storyKey || (defaultProd ? defaultProd.storyKey : null);

    const titleText = (titleKey && langDict[titleKey]) ? langDict[titleKey] : product.title;
    const notesText = (notesKey && langDict[notesKey]) ? langDict[notesKey] : product.notes;
    const badgeText = (badgeKey && langDict[badgeKey]) ? langDict[badgeKey] : (product.badge || '');
    const storyText = (storyKey && langDict[storyKey]) ? langDict[storyKey] : (product.story || (defaultProd && defaultProd.storyKey && langDict[defaultProd.storyKey]) || '');
    const addBtnText = langDict.btn_add_to_bag || 'Add to Bag';
    const storyLabelText = langDict.qv_full_story || 'Full Story';
    const qtyLabelText = langDict.qv_qty || 'Qty';

    const qvTitleEl = document.getElementById('qvTitle');
    const qvPriceEl = document.getElementById('qvPrice');
    const qvNotesEl = document.getElementById('qvNotes');
    const qvStoryEl = document.getElementById('qv-story-text') || document.getElementById('qvStory');
    const qvQtyValEl = document.getElementById('qvQtyValue');
    const qvAddBtnEl = document.getElementById('qvAddBtn');

    document.getElementById('qvFormat').textContent = productFormat(product, langDict);
    if (qvTitleEl) qvTitleEl.textContent = titleText;
    if (qvPriceEl) qvPriceEl.textContent = '€' + Number(product.price).toFixed(2);
    if (qvNotesEl) qvNotesEl.textContent = notesText;
    if (qvStoryEl) qvStoryEl.textContent = storyText;
    if (document.getElementById('qv-story-text')) {
        document.getElementById('qv-story-text').textContent = storyText;
    }
    if (qvQtyValEl) qvQtyValEl.textContent = '1';
    if (qvAddBtnEl) {
        qvAddBtnEl.textContent = addBtnText;
        qvAddBtnEl.className = 'qv-add-btn';
    }

    const storyLabelEl = document.querySelector('.qv-story-label');
    if (storyLabelEl) storyLabelEl.textContent = storyLabelText;
    const qtyLabelEl = document.querySelector('.qv-qty-label');
    if (qtyLabelEl) qtyLabelEl.textContent = qtyLabelText;

    const qvImage = document.getElementById('qvImage');
    if (qvImage) {
        qvImage.src = product.image;
        qvImage.alt = titleText;
    }

    const qvBadge = document.getElementById('qvBadge');
    if (qvBadge) {
        if (badgeText) {
            qvBadge.textContent = badgeText;
            qvBadge.style.display = 'inline-block';
        } else {
            qvBadge.style.display = 'none';
        }
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeQuickView() {
    const overlay = document.getElementById('quickViewOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
    quickViewProduct = null;
    quickViewQty = 1;
}

function initQuickView() {
    const overlay = document.getElementById('quickViewOverlay');
    const closeBtn = document.getElementById('qvCloseBtn');
    const qtyMinusEl = document.getElementById('qvQtyMinus');
    const qtyPlusEl = document.getElementById('qvQtyPlus');
    const addBtnEl = document.getElementById('qvAddBtn');

    if (!overlay) return;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeQuickView();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeQuickView);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) closeQuickView();
    });

    if (qtyMinusEl) {
        qtyMinusEl.addEventListener('click', () => {
            if (quickViewQty > 1) {
                quickViewQty--;
                const el = document.getElementById('qvQtyValue');
                if (el) el.textContent = quickViewQty;
            }
        });
    }

    if (qtyPlusEl) {
        qtyPlusEl.addEventListener('click', () => {
            if (quickViewQty < 20) {
                quickViewQty++;
                const el = document.getElementById('qvQtyValue');
                if (el) el.textContent = quickViewQty;
            }
        });
    }

    if (addBtnEl) {
        addBtnEl.addEventListener('click', () => {
            if (!quickViewProduct) return;
            addProductToCart(quickViewProduct, quickViewQty, null);

            const currentLang = activeLanguage;
            const langDict = dictionary[currentLang] || dictionary.en;

            addBtnEl.textContent = langDict.btn_added || 'Added!';
            addBtnEl.classList.add('added');

            setTimeout(() => {
                closeQuickView();
            }, 600);
        });
    }
}

// ==========================================
// 5. SHOPPING CART SYSTEM
// ==========================================
let cart = [];

function updateCartCount() {
    const cartCounter = document.getElementById('cartCounter');
    let totalItems = 0;
    cart.forEach(item => {
        totalItems += item.quantity;
    });
    if (cartCounter) {
        cartCounter.textContent = totalItems;
    }
}

function addProductToCart(product, quantity = 1, buttonElement = null) {
    const currentLang = activeLanguage;
    const langDict = dictionary[currentLang] || dictionary.en;

    const title = (product.titleKey && langDict[product.titleKey]) ? langDict[product.titleKey] : product.title;
    const price = Number(product.price);

    const existingProduct = cart.find(item => item.id === product.id || item.title === title);

    if (existingProduct) {
        existingProduct.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            title: title,
            price: price,
            image: product.image,
            quantity: quantity
        });
    }

    updateCartCount();
    updateCartUI();

    // Visual button feedback
    if (buttonElement) {
        const addedLabel = langDict.btn_added || "Added!";
        const originalText = buttonElement.innerText;

        buttonElement.innerText = addedLabel;
        buttonElement.classList.add('added');

        setTimeout(() => {
            const currentLangNow = activeLanguage;
            const dictNow = dictionary[currentLangNow] || dictionary.en;
            buttonElement.innerText = dictNow.btn_add_to_bag || originalText;
            buttonElement.classList.remove('added');
        }, 1000);
    }
}

function updateCartUI() {
    const cartSidebarItems = document.getElementById('cart-sidebar-items');
    const cartTotalPriceElement = document.getElementById('cart-total-price');
    if (!cartSidebarItems) return;

    cartSidebarItems.innerHTML = '';
    const currentLang = activeLanguage;
    const langDict = dictionary[currentLang] || dictionary.en;
    const emptyMsg = langDict.cart_empty || "Your bag is empty.";

    if (cart.length === 0) {
        cartSidebarItems.innerHTML = `<p class="empty-cart-msg" data-i18n="cart_empty">${emptyMsg}</p>`;
        if (cartTotalPriceElement) {
            cartTotalPriceElement.innerText = '€0.00';
        }
        return;
    }

    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item-row';
        itemRow.setAttribute('data-index', index);

        itemRow.innerHTML = `
            <div class="cart-item-info">
                <span class="cart-item-name">${item.title}</span>
                <span class="cart-item-price">€${itemTotal.toFixed(2)}</span>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <button type="button" class="btn-qty minus" data-index="${index}">-</button>
                    <span class="qty-count">${item.quantity}</span>
                    <button type="button" class="btn-qty plus" data-index="${index}">+</button>
                </div>
                <button type="button" class="btn-remove-item" data-index="${index}">&times;</button>
            </div>
        `;
        cartSidebarItems.appendChild(itemRow);
    });

    if (cartTotalPriceElement) {
        cartTotalPriceElement.innerText = `€${total.toFixed(2)}`;
    }

    initCartEvents();
}

function initCartEvents() {
    const qtyButtons = document.querySelectorAll('.btn-qty');
    qtyButtons.forEach(button => {
        button.addEventListener('click', function () {
            const index = parseInt(this.getAttribute('data-index'), 10);
            if (isNaN(index) || !cart[index]) return;

            if (this.classList.contains('plus')) {
                cart[index].quantity += 1;
                updateCartCount();
                updateCartUI();
            } else if (this.classList.contains('minus')) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1;
                    updateCartCount();
                    updateCartUI();
                } else {
                    triggerRowRemoval(index);
                }
            }
        });
    });

    const removeButtons = document.querySelectorAll('.btn-remove-item');
    removeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const index = parseInt(this.getAttribute('data-index'), 10);
            if (!isNaN(index)) {
                triggerRowRemoval(index);
            }
        });
    });
}

function triggerRowRemoval(index) {
    const row = document.querySelector(`.cart-item-row[data-index="${index}"]`);
    if (row) {
        row.classList.add('fade-out');
        setTimeout(() => {
            cart.splice(index, 1);
            updateCartCount();
            updateCartUI();
        }, 250);
    } else {
        cart.splice(index, 1);
        updateCartCount();
        updateCartUI();
    }
}

function initCartToggle() {
    const cartIcon = document.getElementById('cartIcon');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const cartOverlay = document.getElementById('cart-overlay');

    if (cartIcon && cartSidebar && cartOverlay) {
        cartIcon.addEventListener('click', function () {
            cartSidebar.classList.add('open');
            cartOverlay.classList.add('open');
        });
    }

    if (closeCartBtn && cartSidebar && cartOverlay) {
        closeCartBtn.addEventListener('click', function () {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('open');
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function () {
            cart = [];
            updateCartCount();
            updateCartUI();
        });
    }

    if (cartOverlay && cartSidebar) {
        cartOverlay.addEventListener('click', function () {
            cartSidebar.classList.remove('open');
            cartOverlay.classList.remove('open');
        });
    }
}

// ==========================================
// 6. PROMO CODE COPY BUTTON
// ==========================================
function initPromoCopy() {
    const copyBtn = document.getElementById('copyPromoBtn');
    const copyText = document.getElementById('copyPromoText');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', () => {
        const code = copyBtn.getAttribute('data-code') || 'TERROIR10';
        navigator.clipboard.writeText(code).then(() => {
            const currentLang = activeLanguage;
            const langDict = dictionary[currentLang] || dictionary.en;

            copyBtn.classList.add('copied');
            if (copyText) copyText.textContent = langDict.story_code_copied || 'Copied!';

            setTimeout(() => {
                copyBtn.classList.remove('copied');
                if (copyText) copyText.textContent = langDict.story_copy_code || 'Copy Code';
            }, 2000);
        }).catch(err => {
            console.warn('Clipboard copy error:', err);
        });
    });
}

// ==========================================
// 7. ADMIN PANEL (AUTH & CRUD)
// ==========================================
function initAdminPanel() {
    const openAdminBtn = document.getElementById('openAdminBtn');
    const adminAuthModal = document.getElementById('adminAuthModal');
    const closeAdminAuthBtn = document.getElementById('closeAdminAuthBtn');
    const adminAuthForm = document.getElementById('adminAuthForm');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const adminAuthError = document.getElementById('adminAuthError');

    const adminDashboardModal = document.getElementById('adminDashboardModal');
    const closeAdminDashBtn = document.getElementById('closeAdminDashBtn');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const addProductForm = document.getElementById('addProductForm');

    if (!openAdminBtn) return;

    openAdminBtn.addEventListener('click', () => {
        if (adminAuthModal) {
            if (adminPasswordInput) adminPasswordInput.value = '';
            if (adminAuthError) adminAuthError.style.display = 'none';
            adminAuthModal.classList.add('open');
            setTimeout(() => {
                if (adminPasswordInput) adminPasswordInput.focus();
            }, 100);
        }
    });

    if (closeAdminAuthBtn && adminAuthModal) {
        closeAdminAuthBtn.addEventListener('click', () => {
            adminAuthModal.classList.remove('open');
        });
    }

    if (adminAuthModal) {
        adminAuthModal.addEventListener('click', (e) => {
            if (e.target === adminAuthModal) {
                adminAuthModal.classList.remove('open');
            }
        });
    }

    if (adminAuthForm) {
        adminAuthForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pwd = adminPasswordInput.value.trim();

            if (pwd === '1234') {
                if (adminAuthError) adminAuthError.style.display = 'none';
                if (adminAuthModal) adminAuthModal.classList.remove('open');
                if (adminDashboardModal) {
                    adminDashboardModal.classList.add('open');
                    renderAdminProductsList();
                }
                adminAuthForm.reset();
            } else {
                if (adminAuthError) {
                    adminAuthError.style.display = 'block';
                    adminAuthError.classList.remove('shakeError');
                    void adminAuthError.offsetWidth;
                    adminAuthError.classList.add('shakeError');
                }
            }
        });
    }

    if (closeAdminDashBtn && adminDashboardModal) {
        closeAdminDashBtn.addEventListener('click', () => {
            adminDashboardModal.classList.remove('open');
        });
    }

    if (adminLogoutBtn && adminDashboardModal) {
        adminLogoutBtn.addEventListener('click', () => {
            adminDashboardModal.classList.remove('open');
        });
    }

    if (adminDashboardModal) {
        adminDashboardModal.addEventListener('click', (e) => {
            if (e.target === adminDashboardModal) {
                adminDashboardModal.classList.remove('open');
            }
        });
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const prodTitle = document.getElementById('prodTitle').value.trim();
            const prodPrice = parseFloat(document.getElementById('prodPrice').value);
            const prodNotes = document.getElementById('prodNotes').value.trim();
            const prodImage = document.getElementById('prodImage').value.trim();
            const prodBadge = document.getElementById('prodBadge').value.trim();

            if (!prodTitle || isNaN(prodPrice) || !prodNotes || !prodImage) {
                alert('Please fill in all fields correctly.');
                return;
            }

            const newProduct = {
                id: 'custom-' + Date.now(),
                title: prodTitle,
                price: prodPrice,
                notes: prodNotes,
                image: prodImage,
                badge: prodBadge,
                category: 'all'
            };

            const list = getStoredProducts();
            list.unshift(newProduct);
            saveStoredProducts(list);

            addProductForm.reset();
            renderShopCatalog();
            renderAdminProductsList();
        });
    }
}

function renderAdminProductsList() {
    const listEl = document.getElementById('adminProductsList');
    if (!listEl) return;

    const products = getStoredProducts();
    const currentLang = activeLanguage;
    const langDict = dictionary[currentLang] || dictionary.en;

    listEl.innerHTML = '';

    if (products.length === 0) {
        listEl.innerHTML = `<p style="color: #888; text-align: center; padding: 20px;">No products found.</p>`;
        return;
    }

    products.forEach(product => {
        const titleText = (product.titleKey && langDict[product.titleKey]) ? langDict[product.titleKey] : product.title;

        const row = document.createElement('div');
        row.className = 'admin-product-row';
        row.innerHTML = `
            <img src="${product.image}" alt="${titleText}" class="admin-prod-thumb" loading="lazy">
            <div class="admin-prod-details">
                <span class="admin-prod-title">${titleText}</span>
                <span class="admin-prod-price">€${Number(product.price).toFixed(2)}</span>
            </div>
            <button type="button" class="btn-admin-delete" data-id="${product.id}" title="Delete product">
                <span>🗑️</span> <span data-i18n="admin_btn_delete">${langDict.admin_btn_delete || 'Delete'}</span>
            </button>
        `;

        const deleteBtn = row.querySelector('.btn-admin-delete');
        deleteBtn.addEventListener('click', () => {
            row.classList.add('fade-out');
            setTimeout(() => {
                let list = getStoredProducts();
                list = list.filter(p => p.id !== product.id);
                saveStoredProducts(list);
                renderShopCatalog();
                renderAdminProductsList();
            }, 250);
        });

        listEl.appendChild(row);
    });
}

// ==========================================
// 8. i18n DICTIONARY
// ==========================================
let activeLanguage = 'en';

const dictionary = {
    en: {
        loc_demo_contact: "Demo contact",
        map_title: "Map of central Madrid",
        map_marker: "Terroir Concept Location",
        map_note: "Illustrative point in Madrid",
        map_open: "Open Madrid in OpenStreetMap",
        nav_menu: "MENU",
        nav_shop: "SHOP",
        nav_story: "STORY",
        nav_barista: "COFFEE FINDER",
        nav_reviews: "REVIEWS",
        nav_location: "LOCATION",

        hero_subtitle: "SPECIALTY COFFEE CONCEPT",
        hero_title: "Crafted by Nature, Perfected by Us",
        hero_desc: "Explore a coffee menu, browse single-origin beans and try the taste quiz.",
        btn_shop: "SHOP BEANS",
        btn_menu: "VIEW MENU",

        // Menu Section
        menu_subtitle: "Freshly Brewed Every Day",
        menu_title: "Barista Menu",
        menu_espresso_desc: "Classic rich shot of espresso with a dense golden crema.",
        menu_cappuccino_desc: "Equal parts of espresso, steamed milk, and velvety milk foam.",
        menu_flatwhite_desc: "Double shot of espresso with microfoam, smooth and strong.",
        menu_latte_title: "Smoked Caramel Latte",
        menu_latte_desc: "Our signature latte with house-made smoked caramel syrup.",

        // Shop Section
        shop_subtitle: "Single-Origin & Blends",
        shop_title: "Whole Bean Coffee",
        badge_special: "SPECIAL",
        badge_bestseller: "Best Seller",
        badge_new: "New",
        badge_single_origin: "Single Origin",
        badge_signature: "Signature",
        filter_all: "All",
        filter_bestseller: "Bestsellers",
        filter_new: "New",
        filter_single_origin: "Single Origin",
        filter_special: "Special",
        search_placeholder: "Search coffee...",
        search_no_results_title: "No Coffees Found",
        search_no_results_desc: "Try adjusting your search terms or filter.",
        search_reset_btn: "Show All Coffees",

        shop_item_andy_title: "Andy's Special Roast #25",
        shop_item1_title: "Ethiopia Yirgacheffe",
        shop_item2_title: "Colombia El Paraiso",
        shop_item3_title: "Guatemala Huehuetenango",
        shop_item4_title: "Brazil Cerrado Mineiro",
        shop_item6_title: "Costa Rica Tarrazu",
        notes_andy: "Blood orange · milk chocolate · caramel",
        notes_ethiopia: "Jasmine · bergamot · black tea",
        notes_colombia: "Strawberry · white chocolate · yogurt",
        notes_guatemala: "Red apple · milk chocolate · hazelnut",
        notes_brazil: "Dark chocolate · toasted almond · caramel",
        notes_costa_rica: "Honey · orange blossom · milk chocolate",
        btn_add_to_bag: "Add to Bag",
        btn_added: "Added!",
        btn_quick_view: "Quick View",

        // Quick View Full Story Descriptions
        qv_full_story: "Full Story",
        qv_qty: "Qty",
        story_andy: "Balanced specialty Arabica roast with rich notes of dark chocolate, sweet caramel, and Spanish red orange. Inspired by our muse from Madrid, created for those who need warmth, care, and flawless coffee on every shift.",
        story_ethiopia: "Classic washed Yirgacheffe with bright floral aroma, jasmine notes, bergamot citrus, and a clean tea-like finish. Perfect for morning filter coffee.",
        story_colombia: "Experimental anaerobic fermentation yielding intense sweet strawberry, white chocolate notes, and creamy yogurt body. Unforgettable specialty experience.",
        story_guatemala: "High-altitude coffee with rich milk chocolate sweetness, red apple acidity, and toasted hazelnut aftertaste. Smooth and comforting.",
        story_brazil: "Classic dark roast with deep dark chocolate, toasted almond, and smooth caramel. Ideal for espresso and milk-based drinks.",
        story_costa_rica: "Sweet volcanic soil roast with notes of orange blossom, wild honey, and smooth milk chocolate. Exceptionally balanced cup.",

        // Brand Story Section
        story_tag: "MADRID & SEVILLE VIBES",
        story_subtitle: "Our Inspiration & Story",
        story_title: "Crafted with Soul, Dedicated to Andy",
        story_desc: "Inspired by Madrid’s café culture and the pleasure of taking good coffee home. Dedicated to our muse from Madrid.",
        story_banner_title: "Demo Tasting Offer",
        story_banner_text: "Use code TERROIR10 for 10% off your first bag",
        story_copy_code: "Copy Code",
        story_code_copied: "Copied!",
        story_signature: "~ Dedicated to Andy, Madrid ~",
        story_badge: "A small tribute, roasted with care",

        // AI Barista Quiz Section
        ai_subtitle: "Coffee Finder",
        ai_title: "Find Your Perfect Match",
        inside_label: "Inside Terroir",
        inside_title: "Where Coffee Becomes Craft",
        inside_caption: "Roasted here. Chosen with care.",
        inside_subtitle: "A place to discover your next coffee.",
        inside_body: "Our atelier brings the roaster, the coffee shelf and the bar together. We select each coffee for its character, then roast it to bring that character into the cup.",
        inside_invite: "Take a seat and taste before you choose. Find a favourite at the bar, then take the same beans home.",
        inside_alt_room: "The atelier, imagined in Madrid",
        inside_alt_barista: "From our bar to your daily ritual",
        pack_250: "250 g",
        line_single: "Single Origin",
        line_limited: "Limited Edition",
        barista_title: "Ask the AI barista",
        barista_topic: "What would you like help with?",
        barista_choose: "Choose a coffee",
        barista_compare: "Compare coffees",
        barista_brew: "Brewing advice",
        barista_question: "Your question",
        barista_placeholder: "For example: I like a smooth coffee for a moka pot.",
        barista_submit: "Ask",
        barista_required: "Write a short question about coffee.",
        barista_wait: "Checking the collection…",
        barista_limit: ["A short coffee break: the request limit is reached. Try again later, or use the quiz above.","The barista needs a breather: too many requests right now. Try again later; the quiz is ready."],
        barista_error: ["The connection has gone a little off the boil. I couldn’t get an answer. Try again, or use the quiz above.","A small hiccup behind the counter: I couldn’t get an answer. Please try again, or use the quiz."],
        barista_privacy: "Your question is sent to Gemini to generate an answer.",
        ai_desc: "Choose the flavours you like and how you brew to find a coffee from the collection.",
        quiz_q1: "1. Which flavours sound good to you?",
        quiz_product: "View this coffee",
        quiz_unavailable: "This coffee is currently unavailable.",
        quiz_opt_light: "Fruity or floral",
        quiz_opt_dark: "Chocolatey or nutty",
        quiz_q2: "2. How do you usually brew your coffee?",
        quiz_opt_filter: "Filter / Cezve (Turk) / Drip",
        quiz_opt_espresso: "Espresso Machine / Moka Pot",
        quiz_match: "Your Perfect Match Is",
        quiz_restart: "Take Quiz Again",

        // Testimonials Section
        reviews_subtitle: "Demo content",
        reviews_title: "What Coffee Lovers Say",
        review1_name: "Elena Rostova",
        review1_role: "Coffee Enthusiast",
        review1_text: `"The Ethiopia Yirgacheffe brewed on V60 here is mind-blowing. Subtle jasmine notes and incredible clarity. Terroir is my daily ritual!"`,
        review2_name: "Marcus Vance",
        review2_role: "Architect & Designer",
        review2_text: "“The coffee finder recommended Colombia El Paraiso, which matched my taste.”",
        review3_name: "Sophia Martinez",
        review3_role: "Food & Travel Critic",
        review3_text: `"Smoked Caramel Latte is hands down the best signature drink in town. Fast delivery of fresh whole bean coffee right to my doorstep."`,

        // Location Section
        location_subtitle: "Visit Our House",
        location_title: "Location & Hours",
        loc_address_title: "Inspiration",
        loc_address_val: "Madrid, Spain",
        loc_address_hint: "Setting for this fictional café",
        loc_hours_title: "Sample Opening Hours",
        loc_hours_val: "Mon - Fri: 07:30 AM - 08:00 PM",
        loc_hours_weekend: "Sat - Sun: 08:30 AM - 09:00 PM",
        loc_contact_title: "Contact Example",

        // Cart Sidebar
        cart_sidebar_title: "Your Bag",
        cart_clear_btn: "Clear All",
        cart_empty: "Your bag is empty.",
        cart_total_label: "Total:",
        cart_checkout: "Demo bag. Orders and payments are unavailable.",

        // Admin & Footer
        admin_access: "Admin Access",
        admin_btn_delete: "Delete",
        footer_rights: "All rights reserved."
    },
    es: {
        loc_demo_contact: "Contacto de demostración",
        map_title: "Mapa del centro de Madrid",
        map_marker: "Ubicación conceptual de Terroir",
        map_note: "Punto ilustrativo en Madrid",
        map_open: "Ver Madrid en OpenStreetMap",
        nav_menu: "MENÚ",
        nav_shop: "TIENDA",
        nav_story: "HISTORIA",
        nav_barista: "BUSCADOR DE CAFÉ",
        nav_reviews: "OPINIONES",
        nav_location: "UBICACIÓN",

        hero_subtitle: "CONCEPTO DE CAFÉ DE ESPECIALIDAD",
        hero_title: "Creado por la Naturaleza, Perfeccionado por Nosotros",
        hero_desc: "Explora la carta, descubre cafés de origen único y prueba el cuestionario de sabores.",
        btn_shop: "COMPRAR CAFÉ",
        btn_menu: "VER MENÚ",

        // Menu Section
        menu_subtitle: "Recién Hecho Cada Día",
        menu_title: "Menú de Barista",
        menu_espresso_desc: "Clásico espresso intenso con una densa crema dorada.",
        menu_cappuccino_desc: "Partes iguales de espresso, leche al vapor y terciopelo de espuma.",
        menu_flatwhite_desc: "Doble shot de espresso con microespuma, suave y fuerte.",
        menu_latte_title: "Latte de Caramelo Ahumado",
        menu_latte_desc: "Nuestro latte insignia con jarabe de caramelo ahumado artesanal.",

        // Shop Section
        shop_subtitle: "Origen Único y Mezclas",
        shop_title: "Café en Grano",
        badge_special: "ESPECIAL",
        badge_bestseller: "MÁS VENDIDO",
        badge_new: "NUEVO",
        badge_single_origin: "Origen Único",
        badge_signature: "Firma",
        filter_all: "Todos",
        filter_bestseller: "Más Vendidos",
        filter_new: "Nuevos",
        filter_single_origin: "Origen Único",
        filter_special: "Especial",
        search_placeholder: "Buscar café...",
        search_no_results_title: "No se Encontraron Cafés",
        search_no_results_desc: "Intenta ajustar los términos de búsqueda o el filtro.",
        search_reset_btn: "Mostrar Todos los Cafés",

        shop_item_andy_title: "Andy's Special Roast #25",
        shop_item1_title: "Ethiopia Yirgacheffe",
        shop_item2_title: "Colombia El Paraiso",
        shop_item3_title: "Guatemala Huehuetenango",
        shop_item4_title: "Brazil Cerrado Mineiro",
        shop_item6_title: "Costa Rica Tarrazu",
        notes_andy: "Naranja sanguina · chocolate con leche · caramelo",
        notes_ethiopia: "Jazmín · bergamota · té negro",
        notes_colombia: "Fresa · chocolate blanco · yogur",
        notes_guatemala: "Manzana roja · chocolate con leche · avellana",
        notes_brazil: "Chocolate negro · almendra tostada · caramelo",
        notes_costa_rica: "Miel · flor de azahar · chocolate con leche",
        btn_add_to_bag: "Añadir a la Bolsa",
        btn_added: "¡Añadido!",
        btn_quick_view: "Vista Rápida",

        // Quick View Full Story Descriptions
        qv_full_story: "Historia Completa",
        qv_qty: "Cant.",
        story_andy: "Tueste equilibrado de Arabica de especialidad con ricas notas de chocolate negro, caramelo dulce y naranja roja española. Inspirado en nuestra musa de Madrid, creado para quienes necesitan calidez, cuidado y un café impecable en cada turno.",
        story_ethiopia: "Clásico Yirgacheffe lavado con brillante aroma floral, notas de jazmín, cítrico de bergamota y un final limpio como el té. Perfecto para café filtrado matutino.",
        story_colombia: "Fermentación anaeróbica experimental que produce intensa fresa dulce, notas de chocolate blanco y cuerpo cremoso de yogur. Una experiencia de especialidad inolvidable.",
        story_guatemala: "Café de gran altitud con rica dulzura de chocolate con leche, acidez de manzana roja y un postgusto tostado a avellana. Suave y reconfortante.",
        story_brazil: "Tueste oscuro clásico con profundo chocolate negro, almendra tostada y caramelo suave. Ideal para espresso y bebidas con leche.",
        story_costa_rica: "Tueste en suelo volcánico dulce con notas de flor de azahar, miel silvestre y chocolate con leche suave. Taza excepcionalmente equilibrada.",

        // Brand Story Section
        story_tag: "ESPÍRITU DE MADRID Y SEVILLA",
        story_subtitle: "Nuestra Inspiración e Historia",
        story_title: "Elaborado con Alma, Dedicado a Andy",
        story_desc: "Inspirado en la cultura de los cafés de Madrid y en el placer de llevarse un buen café a casa. Dedicado a nuestra musa de Madrid.",
        story_banner_title: "Oferta de degustación de muestra",
        story_banner_text: "Usa el código TERROIR10 para un 10% de descuento en tu primera bolsa",
        story_copy_code: "Copiar Código",
        story_code_copied: "¡Copiado!",
        story_signature: "~ Dedicado a Andy, Madrid ~",
        story_badge: "Un pequeño homenaje, tostado con cuidado",

        // AI Barista Quiz Section
        ai_subtitle: "Buscador de café",
        ai_title: "Encuentra tu Café Ideal",
        inside_label: "Dentro de Terroir",
        inside_title: "Donde el café se convierte en artesanía",
        inside_caption: "Tostado aquí. Elegido con cuidado.",
        inside_subtitle: "Un lugar para descubrir tu próximo café.",
        inside_body: "Nuestro atelier reúne el tostadero, la tienda y la barra. Elegimos cada café por su carácter y lo tostamos para llevar ese carácter a la taza.",
        inside_invite: "Siéntate y prueba antes de elegir. Descubre tu favorito en la barra y llévate los mismos granos a casa.",
        inside_alt_room: "El atelier, imaginado en Madrid",
        inside_alt_barista: "De nuestra barra a tu ritual diario",
        pack_250: "250 g",
        line_single: "Origen único",
        line_limited: "Edición limitada",
        barista_title: "Pregunta al barista IA",
        barista_topic: "¿En qué te ayudamos?",
        barista_choose: "Elegir un café",
        barista_compare: "Comparar cafés",
        barista_brew: "Consejos de preparación",
        barista_question: "Tu pregunta",
        barista_placeholder: "Por ejemplo: busco un café suave para cafetera italiana.",
        barista_submit: "Preguntar",
        barista_required: "Escribe una pregunta breve sobre café.",
        barista_wait: "Consultando la colección…",
        barista_limit: ["Una breve pausa para el café: se ha alcanzado el límite de consultas. Vuelve más tarde o prueba el test.","El barista necesita un respiro: hay demasiadas consultas. Vuelve más tarde; el test sigue disponible."],
        barista_error: ["La conexión se ha quedado sin vapor. No pude obtener una respuesta. Inténtalo de nuevo o prueba el test.","Un pequeño contratiempo detrás de la barra: no pude obtener una respuesta. Inténtalo de nuevo o usa el test."],
        barista_privacy: "Tu pregunta se envía a Gemini para generar una respuesta.",
        ai_desc: "Elige tus sabores y tu método de preparación para encontrar un café de la colección.",
        quiz_q1: "1. ¿Qué sabores prefieres?",
        quiz_product: "Ver este café",
        quiz_unavailable: "Este café no está disponible en este momento.",
        quiz_opt_light: "Afrutado o floral",
        quiz_opt_dark: "Chocolate o frutos secos",
        quiz_q2: "2. ¿Cómo sueles preparar tu café?",
        quiz_opt_filter: "Filtro / Cafetera Turca / Goteo",
        quiz_opt_espresso: "Máquina de Espresso / Cafetera Italiana",
        quiz_match: "Tu Café Ideal Es",
        quiz_restart: "Repetir Test",

        // Testimonials Section
        reviews_subtitle: "Contenido de demostración",
        reviews_title: "Lo Que Dicen los Amantes del Café",
        review1_name: "Elena Rostova",
        review1_role: "Entusiasta del Café",
        review1_text: `"El Etiopía Yirgacheffe preparado en V60 aquí es alucinante. Sutiles notas de jazmín y una claridad increíble. ¡Terroir es mi ritual diario!"`,
        review2_name: "Marcus Vance",
        review2_role: "Arquitecto y Diseñador",
        review2_text: "«El buscador de café me recomendó Colombia El Paraiso, justo lo que buscaba».",
        review3_name: "Sophia Martinez",
        review3_role: "Crítica de Gastronomía y Viajes",
        review3_text: `"El Latte de Caramelo Ahumado es sin duda la mejor bebida de autor de la ciudad. Entrega rápida de granos frescos a mi puerta."`,

        // Location Section
        location_subtitle: "Visita Nuestra Cafetería",
        location_title: "Ubicación y Horarios",
        loc_address_title: "Inspiración",
        loc_address_val: "Madrid, España",
        loc_address_hint: "Escenario de esta cafetería ficticia",
        loc_hours_title: "Ejemplo de horario",
        loc_hours_val: "Lun - Vie: 07:30 AM - 08:00 PM",
        loc_hours_weekend: "Sáb - Dom: 08:30 AM - 09:00 PM",
        loc_contact_title: "Ejemplo de contacto",

        // Cart Sidebar
        cart_sidebar_title: "Tu Bolsa",
        cart_clear_btn: "Vaciar todo",
        cart_empty: "Tu bolsa está vacía.",
        cart_total_label: "Total:",
        cart_checkout: "Cesta de demostración. No se aceptan pedidos ni pagos.",

        // Admin & Footer
        admin_access: "Acceso Admin",
        admin_btn_delete: "Eliminar",
        footer_rights: "Todos los derechos reservados."
    },
    ua: {
        loc_demo_contact: "Демонстраційний контакт",
        map_title: "Карта центру Мадрида",
        map_marker: "Концептуальна локація Terroir",
        map_note: "Умовна позначка в Мадриді",
        map_open: "Відкрити Мадрид в OpenStreetMap",
        nav_menu: "МЕНЮ",
        nav_shop: "МАГАЗИН",
        nav_story: "ІСТОРІЯ",
        nav_barista: "ПІДБІР КАВИ",
        nav_reviews: "ВІДГУКИ",
        nav_location: "ЛОКАЦІЯ",

        hero_subtitle: "КОНЦЕПТ КАВ’ЯРНІ СПЕШЕЛТІ",
        hero_title: "Створено Природою, Доведено до Досконалості Нами",
        hero_desc: "Перегляньте меню кав’ярні та каталог зерна або спробуйте тест на кавові вподобання.",
        btn_shop: "КУПИТИ КАВУ",
        btn_menu: "ДИВИТИСЯ МЕНЮ",

        // Menu Section
        menu_subtitle: "Свіжотворена щодня",
        menu_title: "Меню Баристи",
        menu_espresso_desc: "Класичний насичений еспресо з густою золотистою пінкою.",
        menu_cappuccino_desc: "Рівні частини еспресо, збитого молока та оксамитової пінки.",
        menu_flatwhite_desc: "Подвійний еспресо з мікропінкою, м'який та міцний.",
        menu_latte_title: "Копчений Карамельний Латте",
        menu_latte_desc: "Наш фірмовий латте з крафтовим сиропом копченої карамелі.",

        // Shop Section
        shop_subtitle: "Моносорти та Бленди",
        shop_title: "Зернова Кава",
        badge_special: "СПЕЦІАЛЬНИЙ",
        badge_bestseller: "БЕСТСЕЛЕР",
        badge_new: "НОВИНКА",
        badge_single_origin: "Моносорт",
        badge_signature: "Фірмова",
        filter_all: "Всі",
        filter_bestseller: "Бестселери",
        filter_new: "Новинки",
        filter_single_origin: "Моносорти",
        filter_special: "Спеціальні",
        search_placeholder: "Пошук кави...",
        search_no_results_title: "Каву не знайдено",
        search_no_results_desc: "Спробуйте змінити пошуковий запит або фільтр.",
        search_reset_btn: "Показати всі сорти",

        shop_item_andy_title: "Andy's Special Roast #25",
        shop_item1_title: "Ethiopia Yirgacheffe",
        shop_item2_title: "Colombia El Paraiso",
        shop_item3_title: "Guatemala Huehuetenango",
        shop_item4_title: "Brazil Cerrado Mineiro",
        shop_item6_title: "Costa Rica Tarrazu",
        notes_andy: "Червоний апельсин · молочний шоколад · карамель",
        notes_ethiopia: "Жасмин · бергамот · чорний чай",
        notes_colombia: "Полуниця · білий шоколад · йогурт",
        notes_guatemala: "Червоне яблуко · молочний шоколад · фундук",
        notes_brazil: "Темний шоколад · смажений мигдаль · карамель",
        notes_costa_rica: "Мед · цвіт апельсина · молочний шоколад",
        btn_add_to_bag: "Додати в кошик",
        btn_added: "Додано!",
        btn_quick_view: "Швидкий Перегляд",

        // Quick View Full Story Descriptions
        qv_full_story: "Повна Історія",
        qv_qty: "Кількість",
        story_andy: "Збалансоване спешелті обсмаження Arabica з нотами темного шоколаду, солодкої карамелі та червоного апельсина. Натхнення нашою музою з Мадрида, для тих, кому потрібні тепло, турбота і бездоганна кава.",
        story_ethiopia: "Класичний митий Іргачеф з яскравим квітковим ароматом, нотами жасмину, цитрусом бергамоту та чистим чайним фіналом. Ідеальна для ранкової фільтрованої кави.",
        story_colombia: "Експериментальна анаеробна ферментація з інтенсивною солодкою полуницею, нотами білого шоколаду та кремовим йогуртом. Незабутний досвід спешелті.",
        story_guatemala: "Високогірна кава з нотами молочного шоколаду, кислинку червоного яблука та смаженим фундуком. М'яка і затишна.",
        story_brazil: "Класичне темне обсмаження з глибоким чорним шоколадом, смаженим мигдалем і карамеллю. Ідеально для еспресо та молочних напоїв.",
        story_costa_rica: "Напій з вулканічного грунту з нотами квіток апельсина, дикого меду та ніжного молочного шоколаду. Винятково збалансована чашка.",

        // Brand Story Section
        story_tag: "ВАЙБ МАДРИДА ТА СЕВІЛЬЇ",
        story_subtitle: "Наша Історія та Натхнення",
        story_title: "Створено з Душею, Присвячено Енді",
        story_desc: "Нас надихнула культура мадридських кав’ярень і можливість забрати улюблену каву додому. Присвячено нашій музі з Мадрида.",
        story_banner_title: "Демонстраційна пропозиція",
        story_banner_text: "Використовуйте промокод TERROIR10 для знижки 10% на першу пачку",
        story_copy_code: "Скопіювати код",
        story_code_copied: "Скопійовано!",
        story_signature: "~ Присвячено Енді, Мадрид ~",
        story_badge: "Невелика присвята, обсмажена з турботою",

        // AI Barista Quiz Section
        ai_subtitle: "Підбір кави",
        ai_title: "Знайдіть свій ідеальний каву",
        inside_label: "Усередині Terroir",
        inside_title: "Де кава стає ремеслом",
        inside_caption: "Обсмажуємо тут. Обираємо з увагою.",
        inside_subtitle: "Місце, де знаходять свою каву.",
        inside_body: "Наше ательє поєднує обсмажувальню, магазин і кавову стійку. Ми обираємо кожну каву за її характером і розкриваємо його в чашці завдяки обсмаженню.",
        inside_invite: "Сідайте й спробуйте перед покупкою. Знайдіть улюблену каву біля стійки та заберіть таке саме зерно додому.",
        inside_alt_room: "Ательє, уявлене в Мадриді",
        inside_alt_barista: "Від нашої стійки до вашого щоденного ритуалу",
        pack_250: "250 г",
        line_single: "Моносорт",
        line_limited: "Лімітована серія",
        barista_title: "Запитайте ШІ-баристу",
        barista_topic: "З чим вам допомогти?",
        barista_choose: "Підібрати каву",
        barista_compare: "Порівняти каву",
        barista_brew: "Поради із заварювання",
        barista_question: "Ваше запитання",
        barista_placeholder: "Наприклад: шукаю м’яку каву для гейзерної кавоварки.",
        barista_submit: "Запитати",
        barista_required: "Напишіть коротке запитання про каву.",
        barista_wait: "Переглядаємо добірку…",
        barista_limit: ["Коротка кавова перерва: досягнуто ліміту запитів. Спробуйте пізніше або пройдіть тест вище.","Баристі потрібна хвилинка: зараз забагато запитів. Спробуйте пізніше, а тест уже готовий допомогти."],
        barista_error: ["З’єднання трохи охололо: отримати відповідь не вдалося. Спробуйте ще раз або пройдіть тест вище.","Невелика заминка за стійкою: відповідь не надійшла. Спробуйте ще раз або скористайтеся тестом."],
        barista_privacy: "Запитання надсилається до Gemini для формування відповіді.",
        ai_desc: "Оберіть улюблені смаки та спосіб заварювання, щоб знайти каву з нашої добірки.",
        quiz_q1: "1. Які смаки вам подобаються?",
        quiz_product: "Переглянути цю каву",
        quiz_unavailable: "Ця кава наразі недоступна.",
        quiz_opt_light: "Фруктові або квіткові",
        quiz_opt_dark: "Шоколадні або горіхові",
        quiz_q2: "2. Як ви зазвичай заварюєте каву?",
        quiz_opt_filter: "Фільтр / Турка / Крапельна",
        quiz_opt_espresso: "Еспресо-машина / Гейзерна",
        quiz_match: "Ваша Ідеальна Кава",
        quiz_restart: "Пройти тест знову",

        // Testimonials Section
        reviews_subtitle: "Демонстраційний вміст",
        reviews_title: "Що Кажуть Поціновувачі Кави",
        review1_name: "Олена Ростова",
        review1_role: "Кавова Ентузіастка",
        review1_text: `"Ефіопія Іргачеф, заварена на V60 тут — це щось неймовірне. Витончені ноти жасмину та виняткова чистота смаку. Terroir — мій щоденний ритуал!"`,
        review2_name: "Маркус Вейнс",
        review2_role: "Архітектор та Дизайнер",
        review2_text: "«Підбір кави запропонував Colombia El Paraiso, і вона припала мені до смаку».",
        review3_name: "Софія Мартінес",
        review3_role: "Гастрономічний та Тревел-Критик",
        review3_text: `"Копчений Карамельний Латте — безперечно найкращий авторський напій у місті. Швидка доставка свіжої зернової кави прямо до моїх дверей."`,

        // Location Section
        location_subtitle: "Завітайте до Нас",
        location_title: "Локація та Години Роботи",
        loc_address_title: "Натхнення",
        loc_address_val: "Мадрид, Іспанія",
        loc_address_hint: "Місце дії цієї вигаданої кав’ярні",
        loc_hours_title: "Приклад графіка роботи",
        loc_hours_val: "Пн - Пт: 07:30 AM - 08:00 PM",
        loc_hours_weekend: "Сб - Нд: 08:30 AM - 09:00 PM",
        loc_contact_title: "Приклад контакту",

        // Cart Sidebar
        cart_sidebar_title: "Ваш Кошик",
        cart_clear_btn: "Очистити все",
        cart_empty: "Ваш кошик порожній.",
        cart_total_label: "Разом:",
        cart_checkout: "Демонстраційний кошик. Замовлення та оплата недоступні.",

        // Admin & Footer
        admin_access: "Адмін-доступ",
        admin_btn_delete: "Видалити",
        footer_rights: "Всі права захищені."
    }
};

// ==========================================
// 9. LANGUAGE CONTROLLER
// ==========================================
dictionary.de = { ...dictionary.en, ...germanCopy };

const languagePreferenceKey = 'terroir-preferred-language';

function detectLanguage() {
    const requested = new URLSearchParams(location.search).get('lang');
    if (requested && Object.hasOwn(dictionary, requested === 'uk' ? 'ua' : requested)) {
        return requested === 'uk' ? 'ua' : requested;
    }
    try {
        const saved = localStorage.getItem(languagePreferenceKey);
        if (saved && Object.hasOwn(dictionary, saved)) return saved;
    } catch {
        // The site can still follow browser preferences without storage.
    }
    for (const language of navigator.languages) {
        const base = language.toLowerCase().split('-')[0];
        const locale = base === 'uk' ? 'ua' : base;
        if (Object.hasOwn(dictionary, locale)) return locale;
    }
    return 'en';
}

function setLanguage(lang, remember = false) {
    activeLanguage = lang;
    document.documentElement.lang = lang === 'ua' ? 'uk' : lang;
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        element.title = dictionary[lang][element.dataset.i18nTitle];
    });
    if (!dictionary[lang]) return;

    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[lang][key]) {
            el.textContent = dictionary[lang][key];
        }
    });

    const i18nPlaceholders = document.querySelectorAll('[data-i18n-placeholder]');
    i18nPlaceholders.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dictionary[lang] && dictionary[lang][key]) {
            el.placeholder = dictionary[lang][key];
        }
    });

    const currentLangLabel = document.getElementById('currentLangLabel');
    if (currentLangLabel) {
        currentLangLabel.textContent = lang.toUpperCase();
    }

    const langDropdownItems = document.querySelectorAll('.lang-dropdown button');
    langDropdownItems.forEach(opt => {
        const optLang = opt.getAttribute('data-lang');
        opt.setAttribute('aria-current', optLang === lang ? 'true' : 'false');
        if (optLang === lang) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });

    try {
        if (remember) localStorage.setItem(languagePreferenceKey, lang);
    } catch (e) {
        console.warn('LocalStorage error:', e);
    }

    // Refresh dynamic product cards in new language
    renderShopCatalog();

    // Refresh admin list if dashboard is open
    const adminDashboardModal = document.getElementById('adminDashboardModal');
    if (adminDashboardModal && adminDashboardModal.classList.contains('open')) {
        renderAdminProductsList();
    }

    // Update dynamic quiz result if currently visible
    const quizResult = document.getElementById('quiz-result');
    if (quizResult && quizResult.style.display !== 'none') {
        showQuizResult();
    }

    // Refresh Quick View modal content if currently open
    const quickViewOverlay = document.getElementById('quickViewOverlay');
    if (quickViewOverlay && quickViewOverlay.classList.contains('open') && quickViewProduct) {
        openQuickView(quickViewProduct);
    }

    // Update cart empty state if empty
    updateCartUI();
}

function initLanguageDropdown() {
    const wrapper = document.querySelector('.lang-select-wrapper');
    const trigger = document.getElementById('langBtn');

    function setOpen(open) {
        wrapper.classList.toggle('open', open);
        trigger.setAttribute('aria-expanded', String(open));
    }

    trigger.addEventListener('click', () => setOpen(!wrapper.classList.contains('open')));
    document.addEventListener('click', event => {
        if (!wrapper.contains(event.target)) setOpen(false);
    });
    wrapper.addEventListener('keydown', event => {
        if (event.key === 'Escape' && wrapper.classList.contains('open')) {
            setOpen(false);
            trigger.focus();
        }
    });
    wrapper.querySelectorAll('[data-lang]').forEach(option => {
        option.addEventListener('click', () => {
            setLanguage(option.dataset.lang, true);
            setOpen(false);
            trigger.focus();
        });
    });
}

// ==========================================
// 11. SCROLL REVEAL OBSERVER (AOS Effect)
// ==========================================
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll:not(.revealed)');
    if (revealElements.length > 0) {
        if ('IntersectionObserver' in window) {
            const observerOptions = {
                root: null,
                rootMargin: '0px 0px -40px 0px',
                threshold: 0.12
            };

            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            revealElements.forEach(el => revealObserver.observe(el));
        } else {
            revealElements.forEach(el => el.classList.add('revealed'));
        }
    }
}

// ==========================================
// 12. MAIN DOM INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize catalog controls (search & filter chips)
    initCatalogControls();

    // 2. Render shop catalog (all 6 product cards)
    renderShopCatalog();

    // 3. Initialize Quick View modal events
    initQuickView();

    // 4. Initialize Cart sidebar & clear events
    initCartToggle();
    updateCartCount();
    updateCartUI();

    // 5. Initialize AI Barista quiz
    initQuiz();

    // 6. Initialize Promo copy button
    initPromoCopy();

    // 7. Initialize Admin panel
    initAdminPanel();

    // 8. Initialize Language dropdown & apply saved language
    initLanguageDropdown();
    setLanguage(detectLanguage());

    initScrollReveal();
});

function productFormat(product, copy) {
    const original = DEFAULT_PRODUCTS.find(item => item.id === product.id);
    const weight = product.weightGrams || original?.weightGrams;
    const line = product.collectionKey || original?.collectionKey;
    return [weight ? (weight === 250 ? copy.pack_250 : weight + ' g') : '', copy[line] || ''].filter(Boolean).join(' · ');
}
