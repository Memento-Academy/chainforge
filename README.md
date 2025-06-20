# Simple Blockchain in Rust 🦀⛓️

A basic blockchain implementation built with Rust, featuring proof-of-work mining, transaction management, and chain validation.

## Features ✨

- **🔗 Blockchain Structure**: Complete block implementation with cryptographic hashing
- **💸 Transaction System**: Send and receive transactions between addresses
- **⛏️ Proof-of-Work Mining**: Configurable difficulty mining algorithm
- **💰 Balance Tracking**: Real-time balance calculation for all addresses
- **✅ Chain Validation**: Integrity verification of the entire blockchain
- **🔒 Immutability**: Tamper detection and prevention

## Quick Start 🚀

### Prerequisites

- Rust 1.70 or higher
- Cargo package manager

### Installation

1. Clone or create a new Rust project:

```bash
cargo new simple_blockchain
cd simple_blockchain
```

2. Add dependencies to `Cargo.toml`:

```toml
[dependencies]
sha2 = "0.10"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
```

3. Replace `src/main.rs` with the blockchain implementation

4. Run the project:

```bash
cargo run
```

## Usage Example 📖

```rust
use simple_blockchain::*;

fn main() {
    // Create a new blockchain
    let mut blockchain = Blockchain::new();

    // Add transactions
    blockchain.add_transaction(Transaction::new(
        "Alice".to_string(),
        "Bob".to_string(),
        50.0,
    ));

    // Mine pending transactions
    blockchain.mine_pending_transactions("Miner1".to_string());

    // Check balances
    println!("Alice's balance: {}", blockchain.get_balance("Alice"));
    println!("Bob's balance: {}", blockchain.get_balance("Bob"));

    // Validate the chain
    println!("Is blockchain valid? {}", blockchain.is_chain_valid());
}
```

## Architecture 🏗️

### Core Components

#### `Transaction`

Represents a transfer of value between two addresses:

```rust
pub struct Transaction {
    pub from: String,
    pub to: String,
    pub amount: f64,
}
```

#### `Block`

Contains transactions and maintains chain integrity:

```rust
pub struct Block {
    pub index: u64,
    pub timestamp: DateTime<Utc>,
    pub transactions: Vec<Transaction>,
    pub previous_hash: String,
    pub hash: String,
    pub nonce: u64,
}
```

#### `Blockchain`

Manages the chain of blocks and mining operations:

```rust
pub struct Blockchain {
    pub chain: Vec<Block>,
    pub difficulty: usize,
    pub pending_transactions: Vec<Transaction>,
    pub mining_reward: f64,
}
```

## Key Methods 🔧

### Mining

```rust
// Mine a block with proof-of-work
block.mine_block(difficulty);

// Mine all pending transactions
blockchain.mine_pending_transactions("miner_address".to_string());
```

### Validation

```rust
// Check if the entire blockchain is valid
let is_valid = blockchain.is_chain_valid();

// Calculate hash for a block
let hash = block.calculate_hash();
```

### Balance Management

```rust
// Get balance for any address
let balance = blockchain.get_balance("Alice");

// Add transaction to pending pool
blockchain.add_transaction(transaction);
```

## Mining Process ⛏️

The blockchain uses a **Proof-of-Work** consensus mechanism:

1. **Transaction Pool**: New transactions are added to a pending pool
2. **Block Creation**: Miner collects pending transactions into a new block
3. **Hash Calculation**: Block hash is calculated using SHA-256
4. **Nonce Iteration**: Nonce is incremented until hash meets difficulty target
5. **Block Addition**: Successfully mined block is added to the chain
6. **Reward Distribution**: Miner receives mining reward

### Difficulty Target

The difficulty determines how many leading zeros the block hash must have:

- Difficulty 1: Hash must start with `0`
- Difficulty 2: Hash must start with `00`
- Difficulty 3: Hash must start with `000`

## Security Features 🔒

### Cryptographic Hashing

- Uses SHA-256 for all hash calculations
- Each block references the previous block's hash
- Any tampering breaks the chain validation

### Immutability

- Changing any transaction requires re-mining all subsequent blocks
- Proof-of-work makes tampering computationally expensive
- Chain validation detects any modifications

### Example Security Check

```rust
// Attempt to modify a transaction
blockchain.chain[1].transactions[0].amount = 999999.0;

// Validation will fail
assert_eq!(blockchain.is_chain_valid(), false);
```

## Configuration ⚙️

### Adjustable Parameters

- **Mining Difficulty**: Change the number of leading zeros required
- **Mining Reward**: Set the reward amount for successful mining
- **Block Size**: Limit the number of transactions per block

```rust
let mut blockchain = Blockchain::new();
blockchain.difficulty = 4;  // Harder mining
blockchain.mining_reward = 50.0;  // Lower reward
```

## Sample Output 📊

```
🚀 Starting Simple Blockchain in Rust

📦 Mining block with pending transactions...
Mining block 1 with difficulty 2...
Block mined! Hash: 00a1b2c3d4e5f6789...

💰 BALANCES:
Alice: -45.0
Bob: 75.0
Charlie: -15.0
Miner1: 100.0

✅ Is blockchain valid? true
```

## Future Enhancements 🚧

### Planned Features

- **REST API**: HTTP endpoints for blockchain interaction
- **Persistence**: Save blockchain state to disk
- **P2P Network**: Multi-node blockchain network
- **Smart Contracts**: Basic contract execution
- **Wallet Integration**: Key management and digital signatures
- **Web Interface**: Browser-based blockchain explorer

### API Endpoints (Future)

```
GET /blockchain          - Get entire blockchain
GET /balance/:address    - Get address balance
POST /transaction        - Submit new transaction
POST /mine              - Mine pending transactions
GET /block/:index       - Get specific block
```

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Performance Considerations 📈

### Optimization Tips

- **Difficulty Scaling**: Start with low difficulty for testing
- **Transaction Batching**: Group multiple transactions per block
- **Memory Management**: Clear processed transactions from memory
- **Parallel Mining**: Implement multi-threaded mining for better performance

### Benchmarks

- **Block Mining**: ~0.1-10 seconds (depending on difficulty)
- **Chain Validation**: O(n) where n = number of blocks
- **Balance Calculation**: O(n\*m) where n = blocks, m = transactions per block

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Rust community for excellent documentation
- Satoshi Nakamoto for the original blockchain concept
- Various blockchain tutorials and educational resources

---

**Built with ❤️ and Rust 🦀**
