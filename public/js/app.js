// ==================== API HELPER ====================
const API = {
  async get(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) { console.error('API Error:', err); return null; }
  },
  async post(url, data) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) { console.error('API Error:', err); return null; }
  }
};

// ==================== UTILITIES ====================
function formatCurrency(num) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num || 0);
}
function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num || 0);
}

let _debounceTimers = {};
function debounce(func, wait) {
  const key = func.name || 'default';
  return function(...args) {
    clearTimeout(_debounceTimers[key]);
    _debounceTimers[key] = setTimeout(() => func.apply(this, args), wait);
  };
}

function getStatusBadge(status) {
  const cls = { 'Shipped':'badge-shipped','Resolved':'badge-resolved','Cancelled':'badge-cancelled','On Hold':'badge-on-hold','Disputed':'badge-disputed','In Process':'badge-in-process' };
  return `<span class="badge ${cls[status] || 'badge-in-process'}">${status}</span>`;
}

// Animated counter
function animateValue(el, start, end, duration = 800) {
  if (!el) return;
  const startTime = performance.now();
  const isFormatted = typeof end === 'string';
  const numEnd = isFormatted ? parseFloat(end.replace(/[^0-9.-]/g, '')) : end;
  const prefix = isFormatted && end.startsWith('$') ? '$' : '';

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(start + (numEnd - start) * eased);
    el.textContent = prefix ? formatCurrency(current) : formatNumber(current);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// Live clock
function updateClock() {
  const el = document.getElementById('headerClock');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
setInterval(updateClock, 1000);
updateClock();

// Keyboard shortcut: Ctrl+K for search
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('globalSearch').focus();
  }
  if (e.key === 'Escape') {
    closeModal();
    document.getElementById('searchDropdown').classList.remove('active');
  }
});

// ==================== CHART CONFIG ====================
const COLORS = {
  palette: ['#818cf8','#22d3ee','#34d399','#fbbf24','#fb7185','#a78bfa','#38bdf8','#f472b6','#fb923c','#a3e635'],
  paletteAlpha: (a = 0.6) => COLORS.palette.map(c => {
    const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  })
};

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 800, easing: 'easeOutQuart' },
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11, weight: 500 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 } },
    tooltip: {
      backgroundColor: 'rgba(8,12,26,0.95)',
      titleColor: '#f8fafc',
      bodyColor: '#94a3b8',
      borderColor: 'rgba(99,102,241,0.2)',
      borderWidth: 1,
      cornerRadius: 10,
      padding: { x: 14, y: 10 },
      titleFont: { family: 'Inter', weight: 700, size: 13 },
      bodyFont: { family: 'Inter', size: 12 },
      displayColors: true,
      boxPadding: 4,
      callbacks: {}
    }
  },
  scales: {
    x: { ticks: { color: '#475569', font: { family: 'Inter', size: 10.5, weight: 500 } }, grid: { color: 'rgba(255,255,255,0.03)', lineWidth: 1 }, border: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#475569', font: { family: 'Inter', size: 10.5, weight: 500 } }, grid: { color: 'rgba(255,255,255,0.03)', lineWidth: 1 }, border: { display: false } }
  }
};

const charts = {};
function createChart(id, config) {
  if (charts[id]) charts[id].destroy();
  const ctx = document.getElementById(id);
  if (!ctx) return null;
  charts[id] = new Chart(ctx.getContext('2d'), config);
  return charts[id];
}

// ==================== NAVIGATION ====================
let currentPage = 'dashboard';

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const target = document.getElementById(`page-${page}`);
  if (target) { target.style.display = 'block'; target.classList.remove('page'); void target.offsetWidth; target.classList.add('page'); }
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nav) nav.classList.add('active');

  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'customers': loadCustomers(); break;
    case 'orders': loadOrders(); break;
    case 'products': loadProducts(); break;
    case 'statistics': loadStatsByCustomer(); break;
    case 'pivot': loadPivotTable(); break;
  }
  document.getElementById('sidebar').classList.remove('active');
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }

// ==================== DASHBOARD ====================
async function loadDashboard() {
  const data = await API.get('/api/stats/overview');
  if (data) {
    animateValue(document.getElementById('kpi-customers'), 0, data.totalCustomers);
    animateValue(document.getElementById('kpi-orders'), 0, data.totalOrders);
    animateValue(document.getElementById('kpi-products'), 0, data.totalProducts);
    animateValue(document.getElementById('kpi-revenue'), 0, '$' + data.totalRevenue);
    animateValue(document.getElementById('kpi-payments'), 0, '$' + data.totalPayments);
  }
  loadRevenueByTime();
  loadRevenueByProductLine();
  loadTopCustomersChart();
  loadOrderStatusChart();
}

async function loadRevenueByTime() {
  const g = document.getElementById('revenueTimeGroup').value;
  const data = await API.get(`/api/stats/revenue-by-time?groupBy=${g}`);
  if (!data) return;

  const gradient = document.getElementById('revenueTimeChart').getContext('2d');
  const grd = gradient.createLinearGradient(0, 0, 0, 280);
  grd.addColorStop(0, 'rgba(99,102,241,0.25)');
  grd.addColorStop(1, 'rgba(99,102,241,0)');

  createChart('revenueTimeChart', {
    type: 'line',
    data: {
      labels: data.map(d => d.period),
      datasets: [{
        label: 'Doanh thu',
        data: data.map(d => d.totalRevenue),
        borderColor: '#818cf8',
        backgroundColor: grd,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#818cf8',
        pointBorderColor: '#080c1a',
        pointBorderWidth: 2,
        borderWidth: 2.5
      }]
    },
    options: {
      ...chartDefaults,
      plugins: { ...chartDefaults.plugins, legend: { display: false }, tooltip: { ...chartDefaults.plugins.tooltip, callbacks: { label: ctx => ' ' + formatCurrency(ctx.parsed.y) } } },
      scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, ticks: { ...chartDefaults.scales.y.ticks, callback: v => '$' + (v/1000).toFixed(0) + 'k' } } }
    }
  });
}

async function loadRevenueByProductLine() {
  const data = await API.get('/api/stats/revenue-by-product?groupBy=productLine');
  if (!data) return;
  createChart('revenueProductLineChart', {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.productLine),
      datasets: [{ data: data.map(d => d.totalRevenue), backgroundColor: COLORS.palette, borderColor: '#080c1a', borderWidth: 3, hoverOffset: 6 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%', animation: { animateRotate: true, duration: 1000 },
      plugins: { ...chartDefaults.plugins, legend: { position: 'right', labels: { ...chartDefaults.plugins.legend.labels, padding: 10, font: { family: 'Inter', size: 10.5 } } },
        tooltip: { ...chartDefaults.plugins.tooltip, callbacks: { label: ctx => ' ' + ctx.label + ': ' + formatCurrency(ctx.parsed) } } } }
  });
}

async function loadTopCustomersChart() {
  const data = await API.get('/api/stats/revenue-by-customer?limit=10');
  if (!data) return;
  createChart('topCustomersChart', {
    type: 'bar',
    data: {
      labels: data.map(d => d.customerName.length > 22 ? d.customerName.substring(0,22) + '…' : d.customerName),
      datasets: [{ label: 'Doanh thu', data: data.map(d => d.totalRevenue), backgroundColor: COLORS.paletteAlpha(0.5), borderColor: COLORS.palette, borderWidth: 1, borderRadius: 5, borderSkipped: false }]
    },
    options: { ...chartDefaults, indexAxis: 'y',
      plugins: { ...chartDefaults.plugins, legend: { display: false }, tooltip: { ...chartDefaults.plugins.tooltip, callbacks: { label: ctx => ' ' + formatCurrency(ctx.parsed.x) } } },
      scales: { x: { ...chartDefaults.scales.x, ticks: { ...chartDefaults.scales.x.ticks, callback: v => '$' + (v/1000).toFixed(0) + 'k' } }, y: chartDefaults.scales.y }
    }
  });
}

async function loadOrderStatusChart() {
  const data = await API.get('/api/stats/order-status');
  if (!data) return;
  const statusColors = { 'Shipped':'#34d399','Resolved':'#22d3ee','Cancelled':'#fb7185','On Hold':'#fbbf24','Disputed':'#f472b6','In Process':'#818cf8' };
  createChart('orderStatusChart', {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.status),
      datasets: [{ data: data.map(d => d.count), backgroundColor: data.map(d => statusColors[d.status] || '#818cf8'), borderColor: '#080c1a', borderWidth: 3, hoverOffset: 6 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: { ...chartDefaults.plugins, legend: { position: 'right', labels: { ...chartDefaults.plugins.legend.labels, padding: 10, font: { family: 'Inter', size: 10.5 } } } } }
  });
}

// ==================== CUSTOMERS ====================
let customerPage = 1;

async function loadCustomers() {
  const s = document.getElementById('customerSearch').value;
  const c = document.getElementById('customerCountry').value;
  const data = await API.get(`/api/customers?page=${customerPage}&limit=15&search=${encodeURIComponent(s)}&country=${encodeURIComponent(c)}`);
  if (!data) return;
  document.getElementById('customerCount').textContent = `${data.pagination.total} khách hàng`;
  document.getElementById('customerTableBody').innerHTML = data.data.map(c => `
    <tr>
      <td style="color:var(--text-muted);font-weight:600">${c.customerNumber}</td>
      <td><strong style="color:var(--text-white)">${c.customerName}</strong></td>
      <td>${c.contactFirstName} ${c.contactLastName}</td>
      <td style="font-variant-numeric:tabular-nums">${c.phone}</td>
      <td>${c.city}</td>
      <td>${c.country}</td>
      <td style="font-weight:600;font-variant-numeric:tabular-nums">${formatCurrency(c.creditLimit)}</td>
      <td><button class="btn btn-sm btn-secondary" onclick="viewCustomer(${c.customerNumber})">Xem</button></td>
    </tr>`).join('');
  renderPagination('customerPagination', data.pagination, p => { customerPage = p; loadCustomers(); });
}

async function loadCustomerCountries() {
  const c = await API.get('/api/customers/countries');
  if (!c) return;
  const sel = document.getElementById('customerCountry');
  c.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); });
}

async function viewCustomer(id) {
  const d = await API.get(`/api/customers/${id}`);
  if (!d) return;
  document.getElementById('modalTitle').textContent = d.customerName;
  document.getElementById('modalContent').innerHTML = `
    <div class="detail-grid" style="margin-bottom:18px">
      <div class="detail-item"><div class="detail-label">Mã KH</div><div class="detail-value">${d.customerNumber}</div></div>
      <div class="detail-item"><div class="detail-label">Tên KH</div><div class="detail-value">${d.customerName}</div></div>
      <div class="detail-item"><div class="detail-label">Liên hệ</div><div class="detail-value">${d.contactFirstName} ${d.contactLastName}</div></div>
      <div class="detail-item"><div class="detail-label">Điện thoại</div><div class="detail-value">${d.phone}</div></div>
      <div class="detail-item"><div class="detail-label">Địa chỉ</div><div class="detail-value">${d.addressLine1}${d.addressLine2?', '+d.addressLine2:''}</div></div>
      <div class="detail-item"><div class="detail-label">Thành phố</div><div class="detail-value">${d.city}</div></div>
      <div class="detail-item"><div class="detail-label">Quốc gia</div><div class="detail-value">${d.country}</div></div>
      <div class="detail-item"><div class="detail-label">Credit Limit</div><div class="detail-value" style="color:var(--emerald-400)">${formatCurrency(d.creditLimit)}</div></div>
      <div class="detail-item"><div class="detail-label">Sales Rep</div><div class="detail-value">${d.salesRep?d.salesRep.firstName+' '+d.salesRep.lastName:'—'}</div></div>
    </div>
    <h3 style="margin-bottom:10px;font-size:14px;font-weight:700">📦 Đơn hàng (${d.orders?.length||0})</h3>
    <div class="table-wrapper" style="margin-bottom:16px"><table class="data-table"><thead><tr><th>Mã ĐH</th><th>Ngày đặt</th><th>Trạng thái</th><th>Sản phẩm</th></tr></thead><tbody>
      ${(d.orders||[]).map(o => `<tr><td>${o.orderNumber}</td><td>${o.orderDate}</td><td>${getStatusBadge(o.status)}</td><td>${o.orderDetails?.length||0} mặt hàng</td></tr>`).join('')}
    </tbody></table></div>
    ${d.payments?.length?`<h3 style="margin-bottom:10px;font-size:14px;font-weight:700">💳 Thanh toán (${d.payments.length})</h3>
    <div class="table-wrapper"><table class="data-table"><thead><tr><th>Số check</th><th>Ngày</th><th>Số tiền</th></tr></thead><tbody>
      ${d.payments.map(p=>`<tr><td>${p.checkNumber}</td><td>${p.paymentDate}</td><td style="font-weight:600;color:var(--emerald-400)">${formatCurrency(p.amount)}</td></tr>`).join('')}
    </tbody></table></div>`:''}`;
  openModal();
}

// ==================== ORDERS ====================
let orderPage = 1;

async function loadOrders() {
  const st = document.getElementById('orderStatus').value;
  const sd = document.getElementById('orderStartDate').value;
  const ed = document.getElementById('orderEndDate').value;
  let url = `/api/orders?page=${orderPage}&limit=15`;
  if (st) url += `&status=${encodeURIComponent(st)}`;
  if (sd) url += `&startDate=${sd}`;
  if (ed) url += `&endDate=${ed}`;
  const data = await API.get(url);
  if (!data) return;
  document.getElementById('orderCount').textContent = `${data.pagination.total} đơn hàng`;
  document.getElementById('orderTableBody').innerHTML = data.data.map(o => `
    <tr>
      <td style="font-weight:700;color:var(--indigo-400)">#${o.orderNumber}</td>
      <td>${o.customer?.customerName||'—'}</td>
      <td style="font-variant-numeric:tabular-nums">${o.orderDate}</td>
      <td style="font-variant-numeric:tabular-nums">${o.requiredDate}</td>
      <td style="font-variant-numeric:tabular-nums">${o.shippedDate||'—'}</td>
      <td>${getStatusBadge(o.status)}</td>
      <td><button class="btn btn-sm btn-secondary" onclick="viewOrder(${o.orderNumber})">Xem</button></td>
    </tr>`).join('');
  renderPagination('orderPagination', data.pagination, p => { orderPage = p; loadOrders(); });
}

async function loadOrderStatuses() {
  const s = await API.get('/api/orders/statuses');
  if (!s) return;
  const sel = document.getElementById('orderStatus');
  s.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); });
}

async function viewOrder(id) {
  const d = await API.get(`/api/orders/${id}`);
  if (!d) return;
  const total = d.orderDetails?.reduce((s, i) => s + i.quantityOrdered * i.priceEach, 0) || 0;
  document.getElementById('modalTitle').textContent = `Đơn hàng #${d.orderNumber}`;
  document.getElementById('modalContent').innerHTML = `
    <div class="detail-grid" style="margin-bottom:18px">
      <div class="detail-item"><div class="detail-label">Khách hàng</div><div class="detail-value">${d.customer?.customerName||'—'}</div></div>
      <div class="detail-item"><div class="detail-label">Ngày đặt</div><div class="detail-value">${d.orderDate}</div></div>
      <div class="detail-item"><div class="detail-label">Ngày yêu cầu</div><div class="detail-value">${d.requiredDate}</div></div>
      <div class="detail-item"><div class="detail-label">Ngày giao</div><div class="detail-value">${d.shippedDate||'Chưa giao'}</div></div>
      <div class="detail-item"><div class="detail-label">Trạng thái</div><div class="detail-value">${getStatusBadge(d.status)}</div></div>
      <div class="detail-item"><div class="detail-label">Tổng tiền</div><div class="detail-value" style="color:var(--emerald-400);font-size:18px;font-weight:800">${formatCurrency(total)}</div></div>
    </div>
    ${d.comments?`<p style="margin-bottom:14px;color:var(--text-muted);font-size:12.5px;font-style:italic">📝 ${d.comments}</p>`:''}
    <h3 style="margin-bottom:10px;font-size:14px;font-weight:700">🏷️ Chi tiết sản phẩm</h3>
    <div class="table-wrapper"><table class="data-table"><thead><tr><th>Mã SP</th><th>Tên sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>
      ${(d.orderDetails||[]).map(i=>`<tr><td>${i.productCode}</td><td>${i.product?.productName||'—'}</td><td style="text-align:center">${formatNumber(i.quantityOrdered)}</td><td>${formatCurrency(i.priceEach)}</td><td style="font-weight:700">${formatCurrency(i.quantityOrdered*i.priceEach)}</td></tr>`).join('')}
    </tbody></table></div>`;
  openModal();
}

// ==================== PRODUCTS ====================
let productPage = 1;

async function loadProducts() {
  const s = document.getElementById('productSearch').value;
  const pl = document.getElementById('productLine').value;
  const data = await API.get(`/api/products?page=${productPage}&limit=15&search=${encodeURIComponent(s)}&productLine=${encodeURIComponent(pl)}`);
  if (!data) return;
  document.getElementById('productCount').textContent = `${data.pagination.total} sản phẩm`;
  document.getElementById('productTableBody').innerHTML = data.data.map(p => `
    <tr>
      <td style="color:var(--text-muted);font-weight:600;font-size:11px">${p.productCode}</td>
      <td><strong style="color:var(--text-white)">${p.productName}</strong></td>
      <td>${getStatusBadge(p.productLine)}</td>
      <td>${p.productScale}</td>
      <td style="font-size:12px">${p.productVendor}</td>
      <td style="font-variant-numeric:tabular-nums">${formatNumber(p.quantityInStock)}</td>
      <td style="font-variant-numeric:tabular-nums">${formatCurrency(p.buyPrice)}</td>
      <td style="font-variant-numeric:tabular-nums;font-weight:600">${formatCurrency(p.MSRP)}</td>
      <td><button class="btn btn-sm btn-secondary" onclick="viewProduct('${p.productCode}')">Xem</button></td>
    </tr>`).join('');
  renderPagination('productPagination', data.pagination, p => { productPage = p; loadProducts(); });
}

async function loadProductLines() {
  const l = await API.get('/api/products/lines');
  if (!l) return;
  const sel = document.getElementById('productLine');
  l.forEach(v => { const o = document.createElement('option'); o.value = v.productLine; o.textContent = v.productLine; sel.appendChild(o); });
}

async function viewProduct(code) {
  const d = await API.get(`/api/products/${code}`);
  if (!d) return;
  document.getElementById('modalTitle').textContent = d.productName;
  document.getElementById('modalContent').innerHTML = `
    <div class="detail-grid" style="margin-bottom:18px">
      <div class="detail-item"><div class="detail-label">Mã SP</div><div class="detail-value">${d.productCode}</div></div>
      <div class="detail-item"><div class="detail-label">Dòng SP</div><div class="detail-value">${d.productLine}</div></div>
      <div class="detail-item"><div class="detail-label">Tỉ lệ</div><div class="detail-value">${d.productScale}</div></div>
      <div class="detail-item"><div class="detail-label">Nhà SX</div><div class="detail-value">${d.productVendor}</div></div>
      <div class="detail-item"><div class="detail-label">Tồn kho</div><div class="detail-value">${formatNumber(d.quantityInStock)}</div></div>
      <div class="detail-item"><div class="detail-label">Giá nhập</div><div class="detail-value">${formatCurrency(d.buyPrice)}</div></div>
      <div class="detail-item"><div class="detail-label">MSRP</div><div class="detail-value" style="color:var(--emerald-400);font-weight:700">${formatCurrency(d.MSRP)}</div></div>
      <div class="detail-item"><div class="detail-label">Đơn hàng</div><div class="detail-value">${d.orderDetails?.length||0} đơn</div></div>
    </div>
    <p style="color:var(--text-secondary);font-size:12.5px;line-height:1.7">${d.productDescription}</p>`;
  openModal();
}

// ==================== STATISTICS ====================
function switchStatsTab(tab) {
  document.querySelectorAll('#page-statistics .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#page-statistics .tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
  switch (tab) {
    case 'byCustomer': loadStatsByCustomer(); break;
    case 'byTime': loadStatsByTime(); break;
    case 'byProduct': loadStatsByProduct(); break;
    case 'byCountry': loadStatsByCountry(); break;
  }
}

async function loadStatsByCustomer() {
  const limit = document.getElementById('statsCustomerLimit')?.value || 20;
  const data = await API.get(`/api/stats/revenue-by-customer?limit=${limit}`);
  if (!data) return;
  createChart('statsCustomerChart', {
    type: 'bar',
    data: {
      labels: data.map(d => d.customerName.length > 25 ? d.customerName.substring(0,25)+'…' : d.customerName),
      datasets: [{ label: 'Doanh thu', data: data.map(d => d.totalRevenue), backgroundColor: COLORS.paletteAlpha(0.5), borderColor: COLORS.palette, borderWidth: 1, borderRadius: 5, borderSkipped: false }]
    },
    options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } },
      scales: { ...chartDefaults.scales, x: { ...chartDefaults.scales.x, ticks: { ...chartDefaults.scales.x.ticks, maxRotation: 45 } }, y: { ...chartDefaults.scales.y, ticks: { ...chartDefaults.scales.y.ticks, callback: v => '$'+(v/1000).toFixed(0)+'k' } } } }
  });
  document.getElementById('statsCustomerTableBody').innerHTML = data.map((d, i) => `
    <tr><td style="color:var(--text-dim);font-weight:700">${i+1}</td><td><strong style="color:var(--text-white)">${d.customerName}</strong></td><td>${d.country}</td><td>${d.city}</td><td style="text-align:center">${formatNumber(d.totalOrders)}</td><td style="text-align:center">${formatNumber(d.totalQuantity)}</td><td style="font-weight:700;color:var(--emerald-400)">${formatCurrency(d.totalRevenue)}</td></tr>
  `).join('');
}

async function loadStatsByTime() {
  const g = document.getElementById('statsTimeGroup')?.value||'month';
  const y = document.getElementById('statsTimeYear')?.value||'';
  const data = await API.get(`/api/stats/revenue-by-time?groupBy=${g}&year=${y}`);
  if (!data) return;

  const ctx = document.getElementById('statsTimeChart').getContext('2d');
  const grd = ctx.createLinearGradient(0,0,0,380);
  grd.addColorStop(0, 'rgba(99,102,241,0.2)');
  grd.addColorStop(1, 'rgba(99,102,241,0)');

  createChart('statsTimeChart', {
    type: 'bar',
    data: {
      labels: data.map(d => d.period),
      datasets: [
        { label: 'Doanh thu', data: data.map(d => d.totalRevenue), backgroundColor: COLORS.paletteAlpha(0.45), borderColor: COLORS.palette, borderWidth: 1, borderRadius: 5, borderSkipped: false, yAxisID: 'y' },
        { label: 'Số đơn hàng', data: data.map(d => d.totalOrders), type: 'line', borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.08)', pointBackgroundColor: '#22d3ee', pointBorderColor: '#080c1a', pointBorderWidth: 2, tension: 0.4, borderWidth: 2.5, pointRadius: 3, yAxisID: 'y1' }
      ]
    },
    options: { ...chartDefaults, scales: { x: chartDefaults.scales.x, y: { ...chartDefaults.scales.y, position: 'left', ticks: { ...chartDefaults.scales.y.ticks, callback: v => '$'+(v/1000).toFixed(0)+'k' } }, y1: { ...chartDefaults.scales.y, position: 'right', grid: { drawOnChartArea: false } } } }
  });
  document.getElementById('statsTimeTableBody').innerHTML = data.map(d => `
    <tr><td><strong>${d.period}</strong></td><td style="text-align:center">${formatNumber(d.totalOrders)}</td><td style="text-align:center">${formatNumber(d.totalQuantity)}</td><td style="font-weight:700;color:var(--emerald-400)">${formatCurrency(d.totalRevenue)}</td></tr>
  `).join('');
}

async function loadStatsByProduct() {
  const pl = await API.get('/api/stats/revenue-by-product?groupBy=productLine');
  if (pl) {
    createChart('statsProductLineChart', {
      type: 'pie',
      data: { labels: pl.map(d => d.productLine), datasets: [{ data: pl.map(d => d.totalRevenue), backgroundColor: COLORS.palette, borderColor: '#080c1a', borderWidth: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { ...chartDefaults.plugins, legend: { position: 'bottom', labels: { ...chartDefaults.plugins.legend.labels, padding: 10 } } } }
    });
    document.getElementById('statsProductTableBody').innerHTML = pl.map(d => `
      <tr><td><strong>${d.productLine}</strong></td><td style="text-align:center">${formatNumber(d.totalProducts)}</td><td style="text-align:center">${formatNumber(d.totalOrders)}</td><td style="text-align:center">${formatNumber(d.totalQuantity)}</td><td style="font-weight:700;color:var(--emerald-400)">${formatCurrency(d.totalRevenue)}</td></tr>
    `).join('');
  }
  const tp = await API.get('/api/stats/revenue-by-product?limit=10');
  if (tp) {
    createChart('statsTopProductChart', {
      type: 'bar',
      data: { labels: tp.map(d => d.productName.length > 22 ? d.productName.substring(0,22)+'…' : d.productName), datasets: [{ label: 'Doanh thu', data: tp.map(d => d.totalRevenue), backgroundColor: COLORS.paletteAlpha(0.5), borderColor: COLORS.palette, borderWidth: 1, borderRadius: 5, borderSkipped: false }] },
      options: { ...chartDefaults, indexAxis: 'y', plugins: { ...chartDefaults.plugins, legend: { display: false } }, scales: { x: { ...chartDefaults.scales.x, ticks: { ...chartDefaults.scales.x.ticks, callback: v => '$'+(v/1000).toFixed(0)+'k' } }, y: chartDefaults.scales.y } }
    });
  }
}

async function loadStatsByCountry() {
  const data = await API.get('/api/stats/revenue-by-country');
  if (!data) return;
  createChart('statsCountryChart', {
    type: 'bar',
    data: {
      labels: data.map(d => d.country),
      datasets: [{ label: 'Doanh thu', data: data.map(d => d.totalRevenue), backgroundColor: COLORS.paletteAlpha(0.45), borderColor: COLORS.palette.concat(COLORS.palette), borderWidth: 1, borderRadius: 5, borderSkipped: false }]
    },
    options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } },
      scales: { ...chartDefaults.scales, x: { ...chartDefaults.scales.x, ticks: { ...chartDefaults.scales.x.ticks, maxRotation: 45 } }, y: { ...chartDefaults.scales.y, ticks: { ...chartDefaults.scales.y.ticks, callback: v => '$'+(v/1000).toFixed(0)+'k' } } } }
  });
  document.getElementById('statsCountryTableBody').innerHTML = data.map((d, i) => `
    <tr><td style="color:var(--text-dim);font-weight:700">${i+1}</td><td><strong>${d.country}</strong></td><td style="text-align:center">${formatNumber(d.totalCustomers)}</td><td style="text-align:center">${formatNumber(d.totalOrders)}</td><td style="font-weight:700;color:var(--emerald-400)">${formatCurrency(d.totalRevenue)}</td></tr>
  `).join('');
}

async function loadYearsFilter() {
  const y = await API.get('/api/stats/years');
  if (!y) return;
  const sel = document.getElementById('statsTimeYear');
  if (sel) y.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); });
}

// ==================== PIVOT TABLE ====================
let pivotLoaded = false;
async function loadPivotTable() {
  if (pivotLoaded) return;
  const container = document.getElementById('pivotContainer');
  try {
    const data = await API.get('/api/stats/pivot-data');
    if (!data?.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><h3>Không có dữ liệu</h3></div>'; return; }

    // Convert string values to numbers for aggregation
    const cleaned = data.map(row => ({
      ...row,
      quantityOrdered: Number(row.quantityOrdered) || 0,
      priceEach: parseFloat(row.priceEach) || 0,
      lineTotal: parseFloat(row.lineTotal) || 0,
      buyPrice: parseFloat(row.buyPrice) || 0,
      profit: parseFloat(row.profit) || 0,
      orderYear: String(row.orderYear),
      orderMonth: String(row.orderMonth),
      orderQuarter: 'Q' + row.orderQuarter
    }));

    container.innerHTML = '';
    jQuery('#pivotContainer').pivotUI(cleaned, {
      rows: ['productLine'],
      cols: ['orderYear'],
      vals: ['lineTotal'],
      aggregatorName: 'Sum',
      rendererName: 'Table',
      unusedAttrsVertical: true
    });
    pivotLoaded = true;
  } catch (err) {
    console.error('Pivot error:', err);
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Lỗi tải Pivot Table</h3><p style="color:var(--text-muted);margin-top:8px">' + err.message + '</p></div>';
    pivotLoaded = false;
  }
}

// ==================== GLOBAL SEARCH ====================
const searchInput = document.getElementById('globalSearch');
const searchDropdown = document.getElementById('searchDropdown');

searchInput.addEventListener('input', debounce(async function() {
  const q = this.value.trim();
  if (q.length < 2) { searchDropdown.classList.remove('active'); return; }
  const data = await API.get(`/api/search?q=${encodeURIComponent(q)}`);
  if (!data) return;
  let html = '';
  if (data.customers?.length) {
    html += `<div class="search-result-section"><div class="search-result-section-title">👥 Khách hàng</div>
      ${data.customers.map(c => `<div class="search-result-item" onclick="navigateTo('customers');viewCustomer(${c.customerNumber});searchDropdown.classList.remove('active')">
        <div class="result-icon" style="background:rgba(99,102,241,0.1);color:var(--indigo-400)">👤</div>
        <div class="result-text"><div class="result-title">${c.customerName}</div><div class="result-sub">${c.city}, ${c.country}</div></div></div>`).join('')}</div>`;
  }
  if (data.orders?.length) {
    html += `<div class="search-result-section"><div class="search-result-section-title">📦 Đơn hàng</div>
      ${data.orders.map(o => `<div class="search-result-item" onclick="navigateTo('orders');viewOrder(${o.orderNumber});searchDropdown.classList.remove('active')">
        <div class="result-icon" style="background:rgba(6,182,212,0.1);color:var(--cyan-400)">📋</div>
        <div class="result-text"><div class="result-title">#${o.orderNumber}</div><div class="result-sub">${o.customer?.customerName||''} · ${o.status}</div></div></div>`).join('')}</div>`;
  }
  if (data.products?.length) {
    html += `<div class="search-result-section"><div class="search-result-section-title">🏷️ Sản phẩm</div>
      ${data.products.map(p => `<div class="search-result-item" onclick="navigateTo('products');viewProduct('${p.productCode}');searchDropdown.classList.remove('active')">
        <div class="result-icon" style="background:rgba(16,185,129,0.1);color:var(--emerald-400)">🚗</div>
        <div class="result-text"><div class="result-title">${p.productName}</div><div class="result-sub">${p.productLine} · ${formatCurrency(p.MSRP)}</div></div></div>`).join('')}</div>`;
  }
  if (!html) html = '<div style="padding:24px;text-align:center;color:var(--text-dim);font-size:13px">Không tìm thấy kết quả</div>';
  searchDropdown.innerHTML = html;
  searchDropdown.classList.add('active');
}, 300));

document.addEventListener('click', e => { if (!e.target.closest('.header-search')) searchDropdown.classList.remove('active'); });

// ==================== MODAL ====================
function openModal() { document.getElementById('detailModal').classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeModal() { document.getElementById('detailModal').classList.remove('active'); document.body.style.overflow = ''; }
document.getElementById('detailModal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });

// ==================== PAGINATION ====================
function renderPagination(id, pag, cb) {
  const el = document.getElementById(id);
  if (!el || pag.totalPages <= 1) { if (el) el.innerHTML = ''; return; }
  const { page: p, totalPages: tp } = pag;
  let html = `<button class="pagination-btn" ${p<=1?'disabled':''}>‹</button>`;
  const s = Math.max(1, p-2), e = Math.min(tp, p+2);
  if (s > 1) { html += `<button class="pagination-btn">1</button>`; if (s > 2) html += '<span class="pagination-info">…</span>'; }
  for (let i = s; i <= e; i++) html += `<button class="pagination-btn ${i===p?'active':''}">${i}</button>`;
  if (e < tp) { if (e < tp-1) html += '<span class="pagination-info">…</span>'; html += `<button class="pagination-btn">${tp}</button>`; }
  html += `<button class="pagination-btn" ${p>=tp?'disabled':''}>›</button>`;
  el.innerHTML = html;
  el.querySelectorAll('.pagination-btn:not(:disabled)').forEach(btn => {
    const n = parseInt(btn.textContent);
    if (!isNaN(n)) btn.onclick = () => cb(n);
    else if (btn.textContent === '‹') btn.onclick = () => cb(p-1);
    else if (btn.textContent === '›') btn.onclick = () => cb(p+1);
  });
}

// ==================== CHATBOT ====================
function toggleChatbot() {
  const p = document.getElementById('chatbotPanel');
  p.classList.toggle('active');
  if (p.classList.contains('active')) { document.getElementById('chatInput').focus(); loadChatSuggestions(); }
}

async function loadChatSuggestions() {
  const data = await API.get('/api/chatbot/suggestions');
  if (!data) return;
  document.getElementById('chatSuggestions').innerHTML = data.slice(0,6).map(s =>
    `<button class="chat-suggestion-btn" onclick="sendChatMessage('${s}')">${s}</button>`).join('');
}

async function sendChat() { const i = document.getElementById('chatInput'); const m = i.value.trim(); if (!m) return; i.value = ''; sendChatMessage(m); }

async function sendChatMessage(msg) {
  const el = document.getElementById('chatMessages');
  el.innerHTML += `<div class="chat-msg user">${msg}</div>`;
  el.scrollTop = el.scrollHeight;
  const lid = 'l'+Date.now();
  el.innerHTML += `<div class="chat-msg bot" id="${lid}"><div class="spinner" style="width:18px;height:18px;border-width:2px"></div></div>`;
  el.scrollTop = el.scrollHeight;
  const data = await API.post('/api/chatbot', { message: msg });
  const le = document.getElementById(lid);
  if (data) {
    let r = data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    le.innerHTML = r;
    if (data.suggestions?.length) le.innerHTML += `<div class="chat-suggestions" style="margin-top:8px">${data.suggestions.map(s=>`<button class="chat-suggestion-btn" onclick="sendChatMessage('${s}')">${s}</button>`).join('')}</div>`;
  } else le.innerHTML = '❌ Không thể kết nối.';
  el.scrollTop = el.scrollHeight;
}

// ==================== INIT ====================
async function init() {
  loadDashboard();
  loadCustomerCountries();
  loadOrderStatuses();
  loadProductLines();
  loadYearsFilter();
}
init();
