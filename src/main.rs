use sha2::{Digest, Sha256};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::fmt;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Transaction {
    pub from: String,
    pub to: String,
    pub amount: f64,
}

impl Transaction {
    pub fn new(from: String, to: String, amount: f64) -> Self {
        Transaction { from, to, amount }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Block {
    pub index: u64,
    pub timestamp: DateTime<Utc>,
    pub transactions: Vec<Transaction>,
    pub previous_hash: String,
    pub hash: String,
    pub nonce: u64,
}

impl Block {
    pub fn new(index: u64, transactions: Vec<Transaction>, previous_hash: String) -> Self {
        let timestamp = Utc::now();
        let mut block = Block {
            index,
            timestamp,
            transactions,
            previous_hash,
            hash: String::new(),
            nonce: 0,
        };
        block.hash = block.calculate_hash();
        block
    }

    pub fn calculate_hash(&self) -> String {
        let data = format!(
            "{}{}{}{}{}",
            self.index,
            self.timestamp.timestamp(),
            serde_json::to_string(&self.transactions).unwrap_or_default(),
            self.previous_hash,
            self.nonce
        );
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    pub fn mine_block(&mut self, difficulty: usize) {
        let target = "0".repeat(difficulty);
        println!("Mining block {} with difficulty {}...", self.index, difficulty);
        
        while &self.hash[..difficulty] != target {
            self.nonce += 1;
            self.hash = self.calculate_hash();
        }
        
        println!("Block mined! Hash: {}", self.hash);
    }
}

impl fmt::Display for Block {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Block #{}\nTimestamp: {}\nPrevious Hash: {}\nHash: {}\nNonce: {}\nTransactions: {}",
            self.index,
            self.timestamp.format("%Y-%m-%d %H:%M:%S UTC"),
            self.previous_hash,
            self.hash,
            self.nonce,
            self.transactions.len()
        )
    }
}

#[derive(Debug)]
pub struct Blockchain {
    pub chain: Vec<Block>,
    pub difficulty: usize,
    pub pending_transactions: Vec<Transaction>,
    pub mining_reward: f64,
}

impl Blockchain {
    pub fn new() -> Self {
        let mut blockchain = Blockchain {
            chain: Vec::new(),
            difficulty: 2,
            pending_transactions: Vec::new(),
            mining_reward: 100.0,
        };
        blockchain.create_genesis_block();
        blockchain
    }

    fn create_genesis_block(&mut self) {
        let genesis_transactions = vec![Transaction::new(
            "Genesis".to_string(),
            "Genesis".to_string(),
            0.0,
        )];
        
        let mut genesis_block = Block::new(0, genesis_transactions, "0".to_string());
        genesis_block.mine_block(self.difficulty);
        self.chain.push(genesis_block);
    }

    pub fn get_latest_block(&self) -> &Block {
        self.chain.last().unwrap()
    }

    pub fn add_transaction(&mut self, transaction: Transaction) {
        self.pending_transactions.push(transaction);
    }

    pub fn mine_pending_transactions(&mut self, mining_reward_address: String) {
        let reward_transaction = Transaction::new(
            "System".to_string(),
            mining_reward_address,
            self.mining_reward,
        );
        self.pending_transactions.push(reward_transaction);

        let mut block = Block::new(
            self.chain.len() as u64,
            self.pending_transactions.clone(),
            self.get_latest_block().hash.clone(),
        );

        block.mine_block(self.difficulty);
        self.chain.push(block);
        self.pending_transactions.clear();
    }

    pub fn get_balance(&self, address: &str) -> f64 {
        let mut balance = 0.0;

        for block in &self.chain {
            for transaction in &block.transactions {
                if transaction.from == address {
                    balance -= transaction.amount;
                }
                if transaction.to == address {
                    balance += transaction.amount;
                }
            }
        }

        balance
    }

    pub fn is_chain_valid(&self) -> bool {
        for i in 1..self.chain.len() {
            let current_block = &self.chain[i];
            let previous_block = &self.chain[i - 1];

            if current_block.hash != current_block.calculate_hash() {
                return false;
            }

            if current_block.previous_hash != previous_block.hash {
                return false;
            }
        }
        true
    }

    pub fn display_chain(&self) {
        println!("\n=== BLOCKCHAIN ===");
        for block in &self.chain {
            println!("{}", block);
            println!("Transactions:");
            for transaction in &block.transactions {
                println!("  {} -> {}: {}", transaction.from, transaction.to, transaction.amount);
            }
            println!("{}", "-".repeat(50));
        }
    }
}

fn main() {
    println!("🚀 Starting Simple Blockchain in Rust");
    
    // Create blockchain
    let mut blockchain = Blockchain::new();
    
    // Add transactions
    blockchain.add_transaction(Transaction::new(
        "Alice".to_string(),
        "Bob".to_string(),
        50.0,
    ));
    
    blockchain.add_transaction(Transaction::new(
        "Bob".to_string(),
        "Charlie".to_string(),
        25.0,
    ));
    
    // Mine block
    println!("\n📦 Mining block with pending transactions...");
    blockchain.mine_pending_transactions("Miner1".to_string());
    
    // Add more transactions
    blockchain.add_transaction(Transaction::new(
        "Charlie".to_string(),
        "Alice".to_string(),
        10.0,
    ));
    
    blockchain.add_transaction(Transaction::new(
        "Alice".to_string(),
        "Bob".to_string(),
        5.0,
    ));
    
    // Mine another block
    println!("\n📦 Mining second block...");
    blockchain.mine_pending_transactions("Miner2".to_string());
    
    // Display blockchain
    blockchain.display_chain();
    
    // Check balances
    println!("\n💰 BALANCES:");
    println!("Alice: {}", blockchain.get_balance("Alice"));
    println!("Bob: {}", blockchain.get_balance("Bob"));
    println!("Charlie: {}", blockchain.get_balance("Charlie"));
    println!("Miner1: {}", blockchain.get_balance("Miner1"));
    println!("Miner2: {}", blockchain.get_balance("Miner2"));
    
    // Validate blockchain
    println!("\n✅ Is blockchain valid? {}", blockchain.is_chain_valid());
    
    // Try to modify a block (immutability demonstration)
    println!("\n🔧 Attempting to modify a block...");
    if let Some(block) = blockchain.chain.get_mut(1) {
        block.transactions[0].amount = 1000.0;
    }
    
    println!("✅ Is blockchain valid after modification? {}", blockchain.is_chain_valid());
}