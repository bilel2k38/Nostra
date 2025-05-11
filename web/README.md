# Catalyst Game Web UI

A modern web interface for the on-chain Iterated Prisoner's Dilemma game on Base Sepolia.

## Features
- Connect wallet (MetaMask, WalletConnect, Coinbase Wallet)
- Start/join a game, stake NST tokens
- Play round-by-round with move selection
- Real-time game state, round, and payout display
- Support for commit-reveal and timeouts (future upgrade)

## Getting Started
1. `cd web`
2. `npm install`
3. `npm run dev`

## Tech Stack
- React + Vite
- wagmi + RainbowKit (wallet connect)
- ethers.js

---

For advanced features or custom UI, edit the components in `/src`.
