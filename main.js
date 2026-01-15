const gridContainer = document.getElementById('productGrid');
const pCount = document.getElementById('pCount');

// --- GLOBAL VARIABLES ---
let currentProduct = null;
let finalOrderID = "0000"; // Global Variable

// --- 1. AUTOMATIC FILTERS GENERATOR ---
function generateDynamicFilters() {
    const availablePacks = new Set();
    productsData.forEach(p => {
        if (p.isPack) availablePacks.add(p.packText);
        else availablePacks.add("Single");
    });

    const comboContainer = document.getElementById('dynamicComboContainer');
    if(comboContainer) {
        comboContainer.innerHTML = ''; 
        availablePacks.forEach(packName => {
            const label = document.createElement('label');
            label.className = 'check-row';
            label.innerHTML = `<input type="checkbox" class="combo-checkbox" value="${packName}"> ${packName}`;
            comboContainer.appendChild(label);
        });
    }

    if (productsData.length > 0) {
        const prices = productsData.map(p => p.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const rangeStep = 200; 
        
        let currentStart = Math.floor(minPrice / 50) * 50; 
        const priceContainer = document.getElementById('dynamicPriceContainer');
        if(priceContainer) {
            priceContainer.innerHTML = '';
            while (currentStart < maxPrice) {
                let currentEnd = currentStart + rangeStep - 1;
                const btn = document.createElement('button');
                btn.className = 'pill';
                btn.innerText = `₹${currentStart} - ₹${currentEnd}`;
                btn.setAttribute('data-min', currentStart);
                btn.setAttribute('data-max', currentEnd);
                btn.onclick = function() { this.classList.toggle('selected'); };
                priceContainer.appendChild(btn);
                currentStart += rangeStep;
            }
        }
    }
}

// --- 2. RENDER PRODUCTS ---
function renderProducts(data) {
    gridContainer.innerHTML = "";
    if(pCount) pCount.innerText = data.length;

    if (data.length === 0) {
        gridContainer.innerHTML = `<div style="grid-column: span 2; text-align:center; padding:50px 0; color:#888;">No Products Found</div>`;
        return;
    }

    data.forEach(product => {
        let badgeHtml = product.isPack ? `<div class="pack-badge">${product.packText}</div>` : '';
        let mrp = product.mrp || product.price; 
        let discountPercent = Math.round(((mrp - product.price) / mrp) * 100);

        const card = document.createElement('div'); 
        card.className = 'product-card';
        card.style.cursor = 'pointer';

        // Click Event -> Open Choice Modal
        card.onclick = function() {
            openChoiceModal(product);
        };

        card.innerHTML = `
            <div class="image-box">
                <img src="${product.image}" alt="Img" onerror="this.src='https://via.placeholder.com/150'">
                ${badgeHtml}
            </div>
            <div class="info-box">
                <div class="p-title">${product.title}</div>
                <div class="price-container">
                    <span class="final-price">₹${product.price}</span>
                    <span class="original-price">${mrp}</span>
                    <span class="discount-percent">${discountPercent}% off</span>
                </div>
                <div class="p-delivery">Free Delivery</div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <span class="rating-badge">${product.rating} <i class="fa-solid fa-star" style="font-size:8px;"></i></span>
                    <span style="font-size:11px; color:#888;">(${product.reviews})</span>
                </div>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

// --- 3. FILTER LOGIC ---
function applyFilters() {
    const sortVal = document.querySelector('input[name="sort"]:checked').value;
    const ratingChecks = Array.from(document.querySelectorAll('#ratingTab input:checked')).map(cb => parseFloat(cb.value));
    const selectedPriceBtns = document.querySelectorAll('.pill.selected');
    const selectedCombos = Array.from(document.querySelectorAll('.combo-checkbox:checked')).map(cb => cb.value);

    let filteredData = productsData.filter(product => {
        let passRating = true;
        if (ratingChecks.length > 0) passRating = ratingChecks.some(r => product.rating >= r);
        let passPrice = true;
        if (selectedPriceBtns.length > 0) {
            passPrice = Array.from(selectedPriceBtns).some(btn => {
                let min = parseFloat(btn.getAttribute('data-min'));
                let max = parseFloat(btn.getAttribute('data-max'));
                return product.price >= min && product.price <= max;
            });
        }
        let passCombo = true;
        if (selectedCombos.length > 0) {
            if (!product.isPack && selectedCombos.includes("Single")) passCombo = true;
            else if (product.isPack && selectedCombos.includes(product.packText)) passCombo = true;
            else passCombo = false;
        }
        return passRating && passPrice && passCombo;
    });

    if (sortVal === 'low') filteredData.sort((a, b) => a.price - b.price);
    else if (sortVal === 'high') filteredData.sort((a, b) => b.price - a.price);
    else if (sortVal === 'rating') filteredData.sort((a, b) => b.rating - a.rating);

    renderProducts(filteredData);
    closeSortModal();
    closeFilterModal();
}

// --- 4. MODAL HANDLERS ---
function openSortModal() { document.getElementById('sortModal').classList.add('active'); }
function closeSortModal() { document.getElementById('sortModal').classList.remove('active'); }
function openFilterModal(tabName) {
    document.getElementById('filterModal').classList.add('active');
    if(tabName === 'price') switchFilterTab('priceTab', document.querySelectorAll('.sidebar-item')[1]);
    else if(tabName === 'rating') switchFilterTab('ratingTab', document.querySelectorAll('.sidebar-item')[0]);
    else if(tabName === 'all') switchFilterTab('ratingTab', document.querySelectorAll('.sidebar-item')[0]);
}
function closeFilterModal() { document.getElementById('filterModal').classList.remove('active'); }
function switchFilterTab(tabId, element) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    element.classList.add('active');
}
function clearAllFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
    document.querySelector('input[value="relevance"]').checked = true;
    renderProducts(productsData);
    closeFilterModal();
}
document.querySelectorAll('input[name="sort"]').forEach(radio => radio.addEventListener('change', applyFilters));


// ==========================================
// --- 5. ORDER SYSTEM LOGIC (CORRECTED) ---
// ==========================================

// Step A: Open Choice Modal
function openChoiceModal(product) {
    currentProduct = product;
    document.getElementById('choiceTitle').innerText = product.title;
    document.getElementById('choiceModal').classList.add('active');
}
function closeChoiceModal() {
    document.getElementById('choiceModal').classList.remove('active');
}

// Step B: Direct Buy Link
function proceedDirect() {
    if(currentProduct) {
        window.open(currentProduct.productLink, '_blank');
        closeChoiceModal();
    }
}

// Step C: Open WhatsApp Form
function openWaForm() {
    closeChoiceModal();
    
    // 1. Set ID to Global Variable
    finalOrderID = Math.floor(1000 + Math.random() * 9000); 
    
    // 2. Update HTML
    document.getElementById('waOrderId').innerText = finalOrderID;
    
    // 3. Fill Product Data
    document.getElementById('waProduct').value = currentProduct.title;
    document.getElementById('waUnitPrice').innerText = currentProduct.price;
    document.getElementById('waQty').value = 1;
    document.getElementById('waTotal').innerText = currentProduct.price;
    
    // 4. Reset User Fields
    document.getElementById('waName').value = '';
    document.getElementById('waMobile').value = '';
    document.getElementById('waAddress').value = '';
    
    document.getElementById('waOrderModal').classList.add('active');
}

function closeWaForm() {
    document.getElementById('waOrderModal').classList.remove('active');
}

// Calculate Total
function updateWaTotal() {
    let qty = document.getElementById('waQty').value;
    if(qty < 1) { qty = 1; document.getElementById('waQty').value = 1; }
    let total = qty * currentProduct.price;
    document.getElementById('waTotal').innerText = total;
}

// Step D: Send Message to WhatsApp (SHORT & CLEAN FORMAT)
function sendToWhatsapp() {
    // ----------------------------------------------------
    // Apna Number Yahan Dalein (No + sign)
    // ----------------------------------------------------
    const adminNumber = "917074056259"; 

    // 1. Get Data
    const name = document.getElementById('waName').value.trim();
    const mobile = document.getElementById('waMobile').value.trim();
    const address = document.getElementById('waAddress').value.trim();
    const qty = document.getElementById('waQty').value;
    const total = document.getElementById('waTotal').innerText;
    
    // ID from Global Variable
    const orderNum = finalOrderID;

    // Validation
    if(name === "" || mobile === "" || address === "") {
        alert("Please fill Name, Mobile Number and Address!");
        return;
    }

    // 2. Message Format (Short & Clean - No Image Link)
    let msg = `*NEW ORDER - #${orderNum}* 🛍️\n` +
              `---------------------------\n` +
              `*PRODUCT DETAILS:*\n` +
              `*Name:* ${currentProduct.title}\n` +
              `*Price:* ₹${currentProduct.price}  x  *Qty:* ${qty}\n` +
              `*Bill:* ₹${total}\n` +
              `*Link:* ${currentProduct.productLink}\n` +
              `---------------------------\n` +
              `*CUSTOMER INFO:*\n` +
              `*Name:* ${name}\n` +
              `*Mobile:* ${mobile}\n` +
              `*Address:* ${address}\n` +
              `---------------------------\n` +
              `*PAYMENT INSTRUCTION:*\n` +
              `✅ *I know Payment is First.*\n` +
              `🚀 Please share QR Code fast, I will send screenshot after payment!`;

    // 3. Encode Message
    let encodedMsg = encodeURIComponent(msg);

    // 4. Open WhatsApp
    const url = `https://wa.me/${adminNumber}?text=${encodedMsg}`;
    window.open(url, '_blank');
    
    closeWaForm();
}

// --- INITIALIZE ---
window.onload = function() {
    generateDynamicFilters();
    renderProducts(productsData);

    // Screen Loading remove logic
    setTimeout(() => {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
            setTimeout(() => { welcomeScreen.style.display = 'none'; }, 500);
        }
    }, 3000); 
};