// ===============================
// ===== CHECK LOGIN =====
if (window.location.pathname.includes("index.html") || window.location.pathname.includes("issue.html")) {
    if (localStorage.getItem("isLoggedIn") !== "true") {
        window.location.href = "index.html";
    }
}

function logout() {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "index.html";
}

// ===============================
// STORAGE
// ===============================
let inventory = JSON.parse(localStorage.getItem("inventory")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];
let issueHistory = JSON.parse(localStorage.getItem("issueHistory")) || [];

// ===============================
// SAVE TO LOCAL STORAGE
// ===============================
function saveData() {
    localStorage.setItem("inventory", JSON.stringify(inventory));
    localStorage.setItem("history", JSON.stringify(history));
    localStorage.setItem("issueHistory", JSON.stringify(issueHistory));
}

// ===============================
// DASHBOARD FUNCTIONS
// ===============================
function addItem() {
    const nameInput = document.getElementById("itemName");
    const quantityInput = document.getElementById("itemQuantity");
    const unitInput = document.getElementById("itemUnit");

    if (!nameInput || !quantityInput || !unitInput) return;

    const name = nameInput.value.trim();
    const quantity = parseInt(quantityInput.value);
    const unit = unitInput.value;

    if (!name || quantity <= 0 || isNaN(quantity)) {
        alert("Enter valid item and quantity");
        return;
    }

    inventory.push({ name, quantity, unit });
    saveData();
    renderItems();
    updateStats();

    nameInput.value = "";
    quantityInput.value = "";
}

function renderItems() {
    const list = document.getElementById("inventoryList");
    if (!list) return; // only index.html

    const search = document.getElementById("search")?.value.toLowerCase() || "";
    list.innerHTML = "";

    inventory.forEach((item, index) => {
        if (!item.name.toLowerCase().includes(search)) return;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.name}</td>
            <td class="${item.quantity <= 5 ? "low-stock" : ""}">${item.quantity} ${item.unit}</td>
            <td class="controls">
                <button class="icon-btn restock" onclick="openModal(${index}, 'restock')">
                    <i data-lucide="package"></i>
                </button>
                <button class="icon-btn issue" onclick="openModal(${index}, 'issue')">
                    <i data-lucide="edit"></i>
                </button>
                <button class="icon-btn delete" onclick="deleteItem(${index})">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;
        list.appendChild(row);
    });

    renderHistory();
    lucide.createIcons();
}

function deleteItem(index) {
    inventory.splice(index, 1);
    saveData();
    renderItems();
    updateStats();
}

// ===============================
// MODAL / RESTOCK / ISSUE
// ===============================
function openModal(index, action) {
    const qtyStr = prompt(action === "restock" ? "Enter quantity to restock:" : "Enter quantity to issue:");
    if (!qtyStr || isNaN(qtyStr)) return;

    const qty = parseInt(qtyStr);
    if (qty <= 0) return;

    const item = inventory[index];
    if (!item) return;

    if (action === "restock") {
        item.quantity += qty;
        addHistory(item.name, "Restock", qty);
    } else if (action === "issue") {
        if (qty > item.quantity) {
            alert("Not enough stock");
            return;
        }
        item.quantity -= qty;
        addHistory(item.name, "Issue", qty);
        addIssueHistory(item.name, qty);
    }

    saveData();
    renderItems();
    updateStats();
}

// ===============================
// HISTORY
// ===============================
function addHistory(name, action, qty) {
    history.unshift({
        name,
        action,
        quantity: qty,
        date: new Date().toLocaleString()
    });
}

function renderHistory() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    historyList.innerHTML = "";
    history.forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${entry.name}</td>
            <td>${entry.action}</td>
            <td>${entry.quantity}</td>
            <td>${entry.date}</td>
        `;
        historyList.appendChild(row);
    });
}

function clearHistory() {
    if (!confirm("Clear all history?")) return;
    history = [];
    saveData();
    renderHistory();
}

// ===============================
// STATS
// ===============================
function updateStats() {
    const statProducts = document.getElementById("statProducts");
    if (!statProducts) return;

    const statValue = document.getElementById("statValue");
    const statLowStock = document.getElementById("statLowStock");
    const statOutStock = document.getElementById("statOutStock");

    statProducts.innerText = inventory.length;

    let totalValue = 0, lowStock = 0, outStock = 0;
    inventory.forEach(item => {
        if (item.quantity <= 5 && item.quantity > 0) lowStock++;
        if (item.quantity === 0) outStock++;
        totalValue += (item.quantity || 0) * (item.price || 100);
    });

    statLowStock.innerText = lowStock;
    statOutStock.innerText = outStock;
    statValue.innerText = "₱" + totalValue.toLocaleString();
}
// DASHBOARD ISSUE HISTORY
function renderDashboardCards() {
    const totalIssuesEl = document.getElementById("totalIssues");
    const productsIssuedEl = document.getElementById("productsIssued");
    const recentIssuesEl = document.getElementById("recentIssues");

    if (!totalIssuesEl || !productsIssuedEl || !recentIssuesEl) return;

    // Total number of issue transactions
    const totalIssues = issueHistory.length;

    // Total quantity issued
    const totalProducts = issueHistory.reduce((sum, entry) => {
        return sum + Number(entry.quantity || 0);
    }, 0);

    // Count today's issues
    const today = new Date().toLocaleDateString();
    const todayIssues = issueHistory.filter(entry => {
        const entryDate = new Date(entry.dateTime).toLocaleDateString();
        return entryDate === today;
    }).length;

    totalIssuesEl.textContent = totalIssues;
    productsIssuedEl.textContent = totalProducts;
    recentIssuesEl.textContent = todayIssues;
}
// ===============================
// TOGGLE HISTORY
// ===============================
function toggleHistory() {
    const panel = document.getElementById("historyPanel");
    const btn = document.getElementById("toggleHistoryBtn");
    if (!panel || !btn) return;

    const isHidden = window.getComputedStyle(panel).display === "none";
    panel.style.display = isHidden ? "block" : "none";
    btn.innerText = isHidden ? "Hide History" : "Show History";
}

// ===============================
// ISSUE PAGE FUNCTIONS
// ===============================
function goToIssuePage() {
    window.location.href = "issue.html";
}


function renderIssueHistory() {
    const tbody = document.getElementById("issueHistoryList");
    if (!tbody) return;

    tbody.innerHTML = "";
    issueHistory.forEach(entry => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${entry.itemName}</td>
            <td>${entry.quantity}</td>
            <td>${entry.dateTime}</td>
        `;
        tbody.appendChild(tr);
    });
}

function addIssueHistory(name, qty) {
    const record = { itemName: name, quantity: qty, dateTime: new Date().toLocaleString() };
    issueHistory.push(record);
    saveData();
    renderIssueHistory();
}

function issueItem() {
    const itemSelect = document.getElementById("issueItemName");
    const quantityEl = document.getElementById("issueQuantity");

    const itemName = itemSelect.value;
    const quantity = parseInt(quantityEl.value);

    if (!itemName || quantity <= 0 || isNaN(quantity)) {
        alert("Enter a valid quantity");
        return;
    }

    const item = inventory.find(i => i.name === itemName);
    if (!item) {
        alert("Item not found in inventory");
        return;
    }

    if (quantity > item.quantity) {
        alert("Not enough stock");
        return;
    }

    // Deduct from inventory
    item.quantity -= quantity;

    // Add to history
    addHistory(item.name, "Issue", quantity);
    addIssueHistory(item.name, quantity);

    // Save
    saveData();

    // Refresh page elements
    renderItems();
    updateStats();
    renderIssueHistory();
    populateIssueDropdown(); // refresh dropdown with new stock

    // Clear input
    quantityEl.value = "";
}

// ===============================
// LOGIN
// ===============================
function login(event) {
    event.preventDefault();
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    if (user === "jay" && pass === "123") {
        localStorage.setItem("isLoggedIn", "true");
        window.location.href = "dashboard.html";
    } else if (user === "markee" && pass === "123") {
        localStorage.setItem("isLoggedIn", "true");
        window.location.href = "dashboard.html";
    }
     else {
        document.getElementById("loginError").textContent = "Invalid username or password";
    }
}

// ===============================
// INITIALIZATION
// ===============================
lucide.createIcons();
renderItems();
updateStats();
renderIssueHistory();
