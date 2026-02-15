// ============================
// Simple Blockchain — JavaScript
// Port from Rust implementation
// ============================

class Transaction {
  constructor(from, to, amount) {
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = Date.now();
  }
}

class Block {
  constructor(index, transactions, previousHash = "") {
    this.index = index;
    this.timestamp = new Date().toISOString();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = "";
  }

  async calculateHash() {
    const data = `${this.index}${this.timestamp}${JSON.stringify(this.transactions)}${this.previousHash}${this.nonce}`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async mineBlock(difficulty) {
    const target = "0".repeat(difficulty);
    this.hash = await this.calculateHash();

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = await this.calculateHash();

      // Yield to UI every 1000 iterations to prevent freezing
      if (this.nonce % 1000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return this.hash;
  }
}

class Blockchain {
  constructor() {
    this.chain = [];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 100;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await this.createGenesisBlock();
    this.initialized = true;
  }

  async createGenesisBlock() {
    const genesisTransaction = new Transaction("Genesis", "Genesis", 0);
    const genesisBlock = new Block(0, [genesisTransaction], "0");
    await genesisBlock.mineBlock(this.difficulty);
    this.chain.push(genesisBlock);
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction) {
    if (!transaction.from || !transaction.to) {
      throw new Error("Transaction must include from and to addresses");
    }
    if (transaction.amount <= 0) {
      throw new Error("Transaction amount must be greater than 0");
    }
    this.pendingTransactions.push(transaction);
  }

  async minePendingTransactions(minerAddress) {
    // Add reward transaction
    const rewardTx = new Transaction("System", minerAddress, this.miningReward);
    this.pendingTransactions.push(rewardTx);

    const block = new Block(
      this.chain.length,
      [...this.pendingTransactions],
      this.getLatestBlock().hash,
    );

    await block.mineBlock(this.difficulty);
    this.chain.push(block);
    this.pendingTransactions = [];

    return block;
  }

  getBalance(address) {
    let balance = 0;
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.from === address) balance -= tx.amount;
        if (tx.to === address) balance += tx.amount;
      }
    }
    return balance;
  }

  getAllAddresses() {
    const addresses = new Set();
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.from !== "Genesis" && tx.from !== "System")
          addresses.add(tx.from);
        if (tx.to !== "Genesis") addresses.add(tx.to);
      }
    }
    return [...addresses];
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.previousHash !== previous.hash) {
        return false;
      }
    }
    return true;
  }
}

export { Transaction, Block, Blockchain };
