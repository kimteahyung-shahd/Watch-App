// ===================================
// CONFIG - API BASE URL
// ===================================
const IS_LOCAL_API =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = IS_LOCAL_API ? 'http://localhost:3001' : '/api';

const LOCAL_STORE_KEYS = {
    users: 'vv_users',
    bookings: 'vv_bookings',
    messages: 'vv_messages',
    reviews: 'vv_reviews'
};

function getLocalItems(key) {
    try {
        const raw = localStorage.getItem(LOCAL_STORE_KEYS[key]);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function addLocalItem(key, item) {
    const items = getLocalItems(key);
    const withId = {
        ...item,
        id: item.id || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    };
    items.push(withId);
    localStorage.setItem(LOCAL_STORE_KEYS[key], JSON.stringify(items));
    return withId;
}

async function fetchCollection(resource) {
    try {
        const response = await fetch(`${API_URL}/${resource}`, { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`Error fetching ${resource}:`, error);
        return [];
    }
}


// ===================================
// FETCH FUNCTIONS FOR ALL ENDPOINTS
// ===================================

// Get all destinations
async function getDestinations() {
    return fetchCollection('destinations');
}

// Full db file (same folder as the HTML) — avoids wrong data if another app is on localhost:3000
async function loadLocalDbJson() {
    try {
        const url = new URL('db.json', window.location.href);
        const response = await fetch(url.href, { cache: 'no-store' });
        if (!response.ok) return null;
        const db = await response.json();
        return db && typeof db === 'object' ? db : null;
    } catch {
        return null;
    }
}

// Featured destination page (TravelGenie spotlight)
async function getSpotlight() {
    const data = await fetchCollection('spotlight');
    return data.length ? data[0] : null;
}

async function getHotels() {
    return fetchCollection('hotels');
}

async function getExperiences() {
    return fetchCollection('experiences');
}

async function getRestaurants() {
    return fetchCollection('restaurants');
}

// Get all reviews
async function getReviews() {
    if (IS_LOCAL_API) {
        return fetchCollection('reviews');
    }
    const [apiReviews, localReviews] = await Promise.all([
        fetchCollection('reviews'),
        Promise.resolve(getLocalItems('reviews'))
    ]);
    return [...apiReviews, ...localReviews];
}

// Post new booking
async function createBooking(bookingData) {
    if (IS_LOCAL_API) {
        try {
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });
            if (!response.ok) throw new Error('Failed to create booking');
            return await response.json();
        } catch (error) {
            console.error('Error creating booking:', error);
            return null;
        }
    }
    return addLocalItem('bookings', bookingData);
}

// Post new message
async function createMessage(messageData) {
    if (IS_LOCAL_API) {
        try {
            const response = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });
            if (!response.ok) throw new Error('Failed to create message');
            return await response.json();
        } catch (error) {
            console.error('Error creating message:', error);
            return null;
        }
    }
    return addLocalItem('messages', messageData);
}

// Post new review
async function createReview(reviewData) {
    if (IS_LOCAL_API) {
        try {
            const response = await fetch(`${API_URL}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });
            if (!response.ok) throw new Error('Failed to create review');
            return await response.json();
        } catch (error) {
            console.error('Error creating review:', error);
            return null;
        }
    }
    return addLocalItem('reviews', reviewData);
}

// Get all users
async function getUsers() {
    if (IS_LOCAL_API) {
        return fetchCollection('users');
    }
    const [apiUsers, localUsers] = await Promise.all([
        fetchCollection('users'),
        Promise.resolve(getLocalItems('users'))
    ]);
    return [...apiUsers, ...localUsers];
}

// Post new user (signup)
async function createUser(userData) {
    if (IS_LOCAL_API) {
        try {
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!response.ok) throw new Error('Failed to create user');
            return await response.json();
        } catch (error) {
            console.error('Error creating user:', error);
            return null;
        }
    }
    return addLocalItem('users', userData);
}

// ===================================
// DESTINATION PAGE FUNCTIONS
// ===================================

// Load and display destinations dynamically

// ===================================
// BOOKING MODAL FUNCTIONS
// ===================================

function openBookingModal(destinationId, destinationName, price, priceUnitLabel, bookingKind) {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    const kind = bookingKind === 'table' ? 'table' : 'stay';
    const kindInput = document.getElementById('bookingKind');
    if (kindInput) kindInput.value = kind;

    const titleEl = document.getElementById('bookingModalTitle');
    if (titleEl) {
        titleEl.textContent = kind === 'table' ? 'Reserve a table' : 'Book Your Stay';
    }

    document.getElementById('destName').textContent = destinationName;
    document.getElementById('destinationId').value = destinationId;

    const priceMeta = document.getElementById('bookingPriceMeta');
    const tableNote = document.getElementById('bookingTableNote');
    const unitEl = document.getElementById('destPriceUnit');
    const peopleInput = document.getElementById('numberOfPeople');

    if (kind === 'table') {
        if (priceMeta) priceMeta.classList.add('hidden');
        if (tableNote) tableNote.classList.remove('hidden');
        document.getElementById('destPrice').textContent = '0';
        document.getElementById('totalPrice').textContent = '0.00';
        if (unitEl) unitEl.textContent = '';
    } else {
        if (priceMeta) priceMeta.classList.remove('hidden');
        if (tableNote) tableNote.classList.add('hidden');
        const base = parseFloat(String(price)) || 0;
        document.getElementById('destPrice').textContent = String(base);
        const n = peopleInput ? parseInt(peopleInput.value, 10) || 1 : 1;
        document.getElementById('totalPrice').textContent = (base * n).toFixed(2);
        if (unitEl) {
            unitEl.textContent = priceUnitLabel || 'per person';
        }
    }

    const dateLbl = document.getElementById('bookingDateFieldLabel');
    if (dateLbl) dateLbl.textContent = kind === 'table' ? 'Preferred date' : 'Check-in date';
    const guestsLbl = document.getElementById('bookingGuestsFieldLabel');
    if (guestsLbl) guestsLbl.textContent = kind === 'table' ? 'Party size' : 'Guests';

    const totalBlock = document.getElementById('bookingTotalBlock');
    if (totalBlock) totalBlock.classList.toggle('hidden', kind === 'table');

    const footer = document.getElementById('bookingFormFooter');
    if (footer) {
        footer.classList.toggle('justify-end', kind === 'table');
        footer.classList.toggle('justify-between', kind !== 'table');
    }

    const submitBtn = document.getElementById('bookingSubmitBtn');
    if (submitBtn) {
        submitBtn.textContent = kind === 'table' ? 'Request table' : 'Confirm Booking';
    }

    modal.classList.remove('hidden');
}

function showRestaurantMenu(menuText) {
    const modal = document.getElementById('menuTextModal');
    const body = document.getElementById('menuTextBody');
    if (!modal || !body) return;
    const t = menuText != null && String(menuText).trim() ? String(menuText) : "Menu is not listed online. Contact the restaurant for today's dishes.";
    body.textContent = t;
    modal.classList.remove('hidden');
}

function closeMenuTextModal() {
    const modal = document.getElementById('menuTextModal');
    if (modal) modal.classList.add('hidden');
}

function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Handle booking form submission
document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const kindEl = document.getElementById('bookingKind');
            const bookingKind = kindEl && kindEl.value === 'table' ? 'table' : 'stay';

            const bookingData = {
                destinationId: document.getElementById('destinationId').value,
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                travelDate: document.getElementById('travelDate').value,
                numberOfPeople: document.getElementById('numberOfPeople').value,
                totalPrice: document.getElementById('totalPrice').textContent,
                bookingDate: new Date().toISOString(),
                bookingKind
            };

            const result = await createBooking(bookingData);
            if (result) {
                showToast(
                    bookingKind === 'table' ? 'Table request sent! The restaurant will confirm by email.' : 'Booking confirmed! We will be in touch soon.',
                    'success'
                );
                bookingForm.reset();
                closeBookingModal();
            } else {
                showToast('Failed to create booking. Please try again.', 'error');
            }
        });
    }
});

// Update total price based on number of people
document.addEventListener('DOMContentLoaded', function() {
    const numberOfPeopleInput = document.getElementById('numberOfPeople');
    if (numberOfPeopleInput) {
        numberOfPeopleInput.addEventListener('change', function() {
            const kindEl = document.getElementById('bookingKind');
            if (kindEl && kindEl.value === 'table') {
                document.getElementById('totalPrice').textContent = '0.00';
                return;
            }
            const basePrice = parseFloat(document.getElementById('destPrice').textContent);
            const numberOfPeople = parseInt(this.value, 10);
            const totalPrice = basePrice * numberOfPeople;
            document.getElementById('totalPrice').textContent = totalPrice.toFixed(2);
        });
    }
});

// ===================================
// TRAVEL DESTINATION PAGE (spotlight + hotels from API)
// ===================================

async function loadTravelDestinationPage() {

    const root = document.getElementById('travelDestinationApp');
    if (!root) return;

    let spotlight;
    let hotels;
    let experiences;
    let restaurants;

    spotlight = await getSpotlight();
    hotels = await getHotels();
    experiences = await getExperiences();
    restaurants = await getRestaurants();

    const shell = root.querySelector('[data-spotlight-shell]');
    const empty = document.getElementById('travelPageEmpty');

    if (!spotlight) {
        shell?.classList.add('hidden');
        empty?.classList.remove('hidden');
        return;
    }

    shell?.classList.remove('hidden');
    empty?.classList.add('hidden');

    const hero = document.getElementById('spotlightHero');
    if (hero) {
        hero.style.backgroundImage =
            `linear-gradient(to top, rgba(0,0,0,.65), rgba(0,0,0,.2)), url('${spotlight.heroImage}')`;
    }

    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('spotlightRegion', spotlight.region || '');
    setText('spotlightRating', String(spotlight.rating ?? ''));
    setText('spotlightReviewLabel', spotlight.reviewLabel || 'Reviews');
    setText('spotlightTitle', spotlight.name || '');
    setText('spotlightDescription', spotlight.description || '');
    setText('spotlightTemp', `${spotlight.tempC}°C / ${spotlight.tempF}°F`);
    setText('spotlightBestTime', spotlight.bestTime || '');
    setText('spotlightCurrency', spotlight.currency || '');
    setText('spotlightLanguages', spotlight.languages || '');
    setText('spotlightHotelCount', String(hotels.length));

    // FILTER UI removed for spotlight-based filters
    const filtersEl = document.getElementById('experienceFilters');
    if (filtersEl && Array.isArray(spotlight.experienceFilters)) {
        filtersEl.innerHTML = spotlight.experienceFilters
            .map(f =>
                `<span class="px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-[var(--tg-teal)] border border-[var(--tg-teal)]/20">${escapeHtml(f)}</span>`
            )
            .join('');
    }

    // HOTELS
    const hotelsRow = document.getElementById('hotelsRow');
    if (hotelsRow) {
        if (!hotels.length) {
            hotelsRow.innerHTML =
                '<p class="col-span-full text-center text-stone-500 py-8">No hotels available right now.</p>';
        } else {
            hotelsRow.innerHTML = '';
            hotels.forEach(h => {
                const card = document.createElement('article');
                card.className =
                    'tg-card rounded-2xl overflow-hidden bg-white shadow-sm border border-stone-100 flex flex-col';

                card.innerHTML = `
                    <div class="relative h-48 shrink-0">
                        <img src="${escapeAttr(h.image_url || h.image || '')}" class="w-full h-full object-cover">
                        <span class="absolute top-3 right-3 bg-white/95 text-stone-800 text-sm font-bold px-2 py-1 rounded-lg shadow">
                            ★ ${Number(h.rating).toFixed(1)}
                        </span>
                    </div>
                    <div class="p-4 flex flex-col flex-1">
                        <h3 class="font-bold text-stone-900 text-lg">${escapeHtml(h.name || '')}</h3>
                        <p class="text-sm text-stone-500 mt-1">${escapeHtml(h.location || '')}</p>
                        <p class="text-sm font-semibold text-[var(--tg-teal)] mt-3">
                            FROM $${Number(h.price)} / night
                        </p>
                        <button class="mt-4 w-full py-2.5 rounded-xl font-semibold text-white tg-btn-peach text-sm">
                            Book Now
                        </button>
                    </div>
                `;

                card.querySelector('button')?.addEventListener('click', () => {
                    openBookingModal(String(h.id), h.name, Number(h.price), 'per night');
                });

                hotelsRow.appendChild(card);
            });
        }
    }
    const expFeatured = document.getElementById('experienceFeatured');
    const expGrid = document.getElementById('experienceSmallGrid');
    if (experiences.length && expFeatured && expGrid) {
        let featured = experiences.find((e) => e.featured);
        const rest = featured ? experiences.filter((e) => e.id !== featured.id) : experiences.slice(1);
        if (!featured) featured = experiences[0];

        const unit = featured.priceUnit || 'person';
        expFeatured.innerHTML = `
            <div class="relative h-full min-h-[280px] rounded-2xl overflow-hidden">
                <img src="${escapeAttr(featured.image_url || featured.image || '')}" alt="" class="absolute inset-0 w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
                <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 class="text-2xl font-bold">${escapeHtml(featured.name || '')}</h3>
                    <p class="text-sm text-white/90 mt-2 line-clamp-2">${escapeHtml(featured.description || '')}</p>
                    <div class="flex items-center justify-between mt-4 gap-3">
                        <span class="font-semibold">$${Number(featured.price)}/${unit}</span>
                        <button type="button" class="px-4 py-2 rounded-xl bg-white/20 backdrop-blur text-sm font-semibold border border-white/40 hover:bg-white/30">Details</button>
                    </div>
                </div>
            </div>`;
        expGrid.innerHTML = rest
            .map(
                (e) => `
            <div class="tg-card rounded-2xl overflow-hidden bg-white border border-stone-100 shadow-sm flex flex-col">
                <div class="h-28 shrink-0">
                    <img src="${escapeAttr(e.image_url || e.image || '')}" alt="" class="w-full h-full object-cover">
                </div>
                <div class="p-3 flex-1 flex flex-col">
                    <h4 class="font-bold text-stone-900 text-sm">${escapeHtml(e.name || '')}</h4>
                    <p class="text-sm font-semibold text-[var(--tg-teal)] mt-auto pt-2">$${Number(e.price)}</p>
                </div>
            </div>`
            )
            .join('');
    } else if (expFeatured && expGrid) {
        expFeatured.innerHTML = '';
        expGrid.innerHTML = '<p class="col-span-full text-stone-500 text-sm">No experiences listed yet.</p>';
    }

    const restList = document.getElementById('restaurantsList');
    if (restList) {
        if (!restaurants.length) {
            restList.innerHTML = '<p class="text-stone-500 py-6">No dining listings yet.</p>';
        } else {
            restList.innerHTML = restaurants
                .map(
                    (r) => `
            <div class="tg-card flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-white border border-stone-100 shadow-sm" data-restaurant-id="${escapeAttr(r.id)}">
                <div class="w-full sm:w-28 h-28 shrink-0 rounded-xl overflow-hidden">
                    <img src="${escapeAttr(r.image_url || r.image || '')}" alt="" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                        <h3 class="font-bold text-stone-900">${escapeHtml(r.name || '')}</h3>
                        <span class="text-amber-500 text-sm">★ ${Number(r.rating).toFixed(1)}</span>
                    </div>
                    <p class="text-sm text-stone-600 mt-1">${escapeHtml(r.description || '')}</p>
                    <p class="text-xs font-semibold text-stone-400 mt-2 tracking-wide">${escapeHtml(r.categoryLabel || '')}${r.priceLevel ? ' • ' + escapeHtml(r.priceLevel) : ''}</p>
                </div>
                <div class="flex sm:flex-col gap-2 shrink-0 justify-end">
                    <button type="button" data-restaurant-action="menu" class="px-4 py-2 rounded-xl text-sm font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200">Menu</button>
                    <button type="button" data-restaurant-action="book-table" class="px-4 py-2 rounded-xl text-sm font-semibold text-white tg-btn-teal">Book Table</button>
                </div>
            </div>`
                )
                .join('');

            restaurants.forEach((r) => {
                const rid = String(r.id);                
                const card = restList.querySelector(`[data-restaurant-id="${rid}"]`);
                if (!card) return;
                const menuBtn = card.querySelector('[data-restaurant-action="menu"]');
                const bookBtn = card.querySelector('[data-restaurant-action="book-table"]');
                if (menuBtn) {
                    menuBtn.addEventListener('click', () => showRestaurantMenu(r.menuText));
                }
                if (bookBtn) {
                    bookBtn.addEventListener('click', () => openBookingModal(String(r.id), r.name || 'Restaurant', 0, '', 'table'));
                }
            });
        }
    }
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function escapeAttr(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

// ===================================
// CONTACT FORM FUNCTIONS
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const messageData = {
                fullName: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                subject: document.getElementById('contactSubject').value,
                message: document.getElementById('contactMessage').value,
                timestamp: new Date().toISOString()
            };

            const result = await createMessage(messageData);
            if (result) {
                showToast('Message sent! We will contact you soon.', 'success');
                contactForm.reset();
            } else {
                showToast('Failed to send message. Please try again.', 'error');
            }
        });
    }
});

// ===================================
// REVIEWS SECTION FUNCTIONS
// ===================================

async function loadReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    container.innerHTML = '<p class="col-span-full text-center text-gray-500">Loading reviews...</p>';

    const reviews = await getReviews();

    if (reviews.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center text-gray-500">No reviews yet.</p>';
        return;
    }

    container.innerHTML = '';
    reviews.forEach(review => {
        const stars = '⭐'.repeat(review.rating);
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md p-6';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold text-amber-900">${review.name}</h3>
                <span class="text-yellow-500">${stars}</span>
            </div>
            <p class="text-gray-600 text-sm mb-3">Destination: <strong>${review.destination}</strong></p>
            <p class="text-gray-700">${review.comment}</p>
        `;
        container.appendChild(card);
    });
}

// ===================================
// LOGIN & SIGNUP FUNCTIONS
// ===================================

// Handle signup form
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const fullName = document.getElementById('signupName').value;

            if (!fullName || !email || !password) {
                showToast('Please fill in name, email, and password.', 'warning');
                return;
            }

            const userData = {
                name: fullName,
                email: email,
                password: password
            };

            const result = await createUser(userData);
            if (result) {
                showToast('Account created. You can now sign in.', 'success');
                signupForm.reset();
                // Redirect to login
                window.location.href = 'login.html';
            } else {
                showToast('Signup failed. Please try again.', 'error');
            }
        });
    }
});

// Handle login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value.trim();
            if (!email || !password) {
                showToast('Please enter your email and password.', 'warning');
                return;
            }

            const users = await getUsers();
            const user = users.find(u =>
                u.email.toLowerCase() === email &&
                u.password === password
            );
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                showToast(`Welcome back, ${user.name || 'traveler'}!`, 'success');
                window.location.href = 'home.html';
            } else {
                showToast('Invalid email or password.', 'error');
            }
        });
    }
});
// ===================================
// UI - TOAST NOTIFICATIONS
// ===================================

function showToast(message, type = 'info', opts = {}) {
    const durationMs = typeof opts.duration === 'number' ? opts.duration : 8000;
    let root = document.getElementById('toastRoot');

    if (!root) {
        root = document.createElement('div');
        root.id = 'toastRoot';
        root.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(root);
    }

    const toast = document.createElement('div');
    toast.className =
        'pointer-events-auto w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-lg overflow-hidden bg-white';

    const accent =
        type === 'success'
            ? 'bg-emerald-500'
            : type === 'error'
              ? 'bg-rose-500'
              : type === 'warning'
                ? 'bg-amber-500'
                : 'bg-sky-500';

    const title =
        type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Notice' : 'Info';

    toast.innerHTML = `
        <div class="flex">
            <div class="w-2 ${accent}"></div>
            <div class="flex-1 p-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <p class="text-sm font-bold text-stone-900">${escapeHtml(title)}</p>
                        <p class="text-sm text-stone-600 mt-1 break-words">${escapeHtml(message || '')}</p>
                    </div>
                    <button type="button" aria-label="Close" class="shrink-0 text-stone-400 hover:text-stone-700 leading-none text-xl -mt-1">×</button>
                </div>
            </div>
        </div>
    `;

    const closeBtn = toast.querySelector('button');
    const remove = () => {
        toast.classList.add('opacity-0', 'translate-y-1');
        setTimeout(() => toast.remove(), 300);
    };

    toast.classList.add('transition', 'duration-200');
    root.appendChild(toast);

    closeBtn?.addEventListener('click', remove);
    if (durationMs > 0) {
        window.setTimeout(remove, durationMs);
    }
}

// Check if user is logged in
function checkUserLogin() {
    const currentUser = localStorage.getItem('currentUser');
    const userInfo = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtnDesk = document.getElementById('loginBtnDesk');
    const logoutBtnDesk = document.getElementById('logoutBtnDesk');

    if (!currentUser) return;

    let user;
    try {
        user = JSON.parse(currentUser);
    } catch {
        return;
    }

    if (userInfo) userInfo.textContent = `Welcome, ${user.name}!`;
    if (loginBtn) loginBtn.classList.add('hidden');
    if (loginBtnDesk) loginBtnDesk.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (logoutBtnDesk) logoutBtnDesk.classList.remove('hidden');
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    showToast('Logged out successfully.', 'success');
    setTimeout(() => { window.location.href = 'login.html'; }, 3000);
}

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    checkUserLogin();
    if (document.getElementById('travelDestinationApp')) {
        loadTravelDestinationPage();
    }
    
    if (document.getElementById('reviewsContainer')) {
        loadReviews();
    }
});