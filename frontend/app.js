import { Blockchain, Transaction } from './blockchain.js';

// ============================
// State
// ============================
let blockchain;

// ============================
// Init
// ============================
async function init() {
  blockchain = new Blockchain();
  showMiningOverlay('Creating genesis block...');
  await blockchain.init();
  hideMiningOverlay();
  renderChain();
  updateStatusBar();
  showToast('Blockchain initialized with genesis block', 'info');
}

// ============================
// UI Rendering
// ============================
function renderChain() {
  const container = document.getElementById('chainContainer');
  container.innerHTML = '';

  // Render blocks in reverse order (newest first)
  for (let i = blockchain.chain.length - 1; i >= 0; i--) {
    const block = blockchain.chain[i];
    const isGenesis = i === 0;

    const card = document.createElement('div');
    card.className = `block-card${isGenesis ? ' genesis' : ''}`;

    const time = new Date(block.timestamp).toLocaleString();

    card.innerHTML = `
      <div class="block-header">
        <div class="block-index">
          <span class="block-number">${isGenesis ? 'GENESIS' : `#${block.index}`}</span>
          <span class="block-label">${isGenesis ? 'Origin Block' : `Block ${block.index}`}</span>
        </div>
        <span class="block-time">${time}</span>
      </div>
      <div class="block-hashes">
        <div class="hash-row">
          <span class="hash-label">Hash</span>
          <span class="hash-value">${block.hash}</span>
        </div>
        <div class="hash-row">
          <span class="hash-label">Prev Hash</span>
          <span class="hash-value">${block.previousHash}</span>
        </div>
        <div class="hash-row">
          <span class="hash-label">Nonce</span>
          <span class="nonce-badge">${block.nonce.toLocaleString()}</span>
        </div>
      </div>
      <div class="block-transactions">
        <div class="block-transactions-title">Transactions (${block.transactions.length})</div>
        ${block.transactions.map(tx => {
          const isReward = tx.from === 'System';
          const isGenesisTx = tx.from === 'Genesis';
          return `
            <div class="tx-item ${isReward ? 'tx-reward' : ''}" >
              <span class="tx-from">${isGenesisTx ? 'Genesis' : tx.from}</span>
              <span class="tx-arrow">&#x2192;</span>
              <span class="tx-to">${tx.to}</span>
              <span class="tx-amount">${isGenesisTx ? '-' : tx.amount.toFixed(2)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.appendChild(card);
  }
}

function renderBalances() {
  const grid = document.getElementById('balancesGrid');
  const addresses = blockchain.getAllAddresses();

  if (addresses.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>Balances will appear after mining</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = addresses.map(addr => {
    const balance = blockchain.getBalance(addr);
    const isNegative = balance < 0;
    return `
      <div class="balance-card">
        <div class="balance-address">${addr}</div>
        <div class="balance-value ${isNegative ? 'negative' : ''}">${balance.toFixed(2)}</div>
      </div>
    `;
  }).join('');
}

function renderPending() {
  const list = document.getElementById('pendingList');
  const pending = blockchain.pendingTransactions;

  if (pending.length === 0) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = `
    <div class="block-transactions-title">Pending transactions</div>
    ${pending.map(tx => `
      <div class="tx-item">
        <span class="tx-from">${tx.from}</span>
        <span class="tx-arrow">&#x2192;</span>
        <span class="tx-to">${tx.to}</span>
        <span class="tx-amount">${tx.amount.toFixed(2)}</span>
      </div>
    `).join('')}
  `;
}

function updateStatusBar() {
  document.getElementById('blockCount').textContent = blockchain.chain.length;
  document.getElementById('difficultyValue').textContent = blockchain.difficulty;
  document.getElementById('rewardValue').textContent = blockchain.miningReward;
  document.getElementById('pendingCount').textContent = blockchain.pendingTransactions.length;

  const isValid = blockchain.isChainValid();
  const validEl = document.getElementById('chainValid');
  validEl.textContent = isValid ? 'Yes' : 'No';
  validEl.style.color = isValid ? 'var(--accent-cyan)' : 'var(--accent-red)';

  const validationResult = document.getElementById('validationResult');
  if (isValid) {
    validationResult.className = 'validation-result valid';
    validationResult.textContent = 'Chain integrity verified';
  } else {
    validationResult.className = 'validation-result invalid';
    validationResult.textContent = 'Chain integrity compromised';
  }
}

// ============================
// Actions
// ============================
function handleTransactionSubmit(e) {
  e.preventDefault();

  const from = document.getElementById('txFrom').value.trim();
  const to = document.getElementById('txTo').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);

  if (!from || !to || isNaN(amount) || amount <= 0) {
    showToast('Please fill all fields with valid values', 'error');
    return;
  }

  if (from === to) {
    showToast('Sender and receiver must be different', 'error');
    return;
  }

  try {
    blockchain.addTransaction(new Transaction(from, to, amount));
    showToast(`Transaction added: ${from} → ${to} (${amount})`, 'success');
    document.getElementById('transactionForm').reset();
    updateStatusBar();
    renderPending();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function mineBlock() {
  const minerAddress = document.getElementById('minerAddress').value.trim();

  if (!minerAddress) {
    showToast('Please enter a miner address', 'error');
    return;
  }

  if (blockchain.pendingTransactions.length === 0) {
    showToast('No pending transactions to mine', 'error');
    return;
  }

  const mineBtn = document.getElementById('mineBtn');
  mineBtn.disabled = true;
  showMiningOverlay(`Mining block #${blockchain.chain.length}...`);

  try {
    const block = await blockchain.minePendingTransactions(minerAddress);
    hideMiningOverlay();
    renderChain();
    renderBalances();
    renderPending();
    updateStatusBar();
    showToast(`Block #${block.index} mined successfully! Nonce: ${block.nonce.toLocaleString()}`, 'success');
  } catch (err) {
    hideMiningOverlay();
    showToast(`Mining failed: ${err.message}`, 'error');
  } finally {
    mineBtn.disabled = false;
  }
}

// Make mineBlock available globally for onclick
window.mineBlock = mineBlock;

// ============================
// Mining Overlay
// ============================
function showMiningOverlay(message) {
  const overlay = document.getElementById('miningOverlay');
  const status = document.getElementById('miningStatus');
  status.textContent = message || 'Finding valid hash';
  overlay.classList.add('active');
}

function hideMiningOverlay() {
  document.getElementById('miningOverlay').classList.remove('active');
}

// ============================
// Toast Notifications
// ============================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================
// Event Listeners
// ============================
document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);

// Start
init();
