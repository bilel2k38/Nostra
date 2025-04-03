# Catalyst Web3 Game App – Frontend Structure

## Overview
Catalyst is a browser-based Web3 game that runs within a retro arcade-styled UI. It features a wallet-connected game where users stake NST tokens to make strategic moves against an AI agent named MrsBeauty.

---

## Core Pages & Components

### 1. 🏠 Landing Page (`/`)
- Nostra Labs Logo (Top-Left)
- CTA: "Play Catalyst"
- Subnav: Docs | Leaderboard | Connect Wallet

---

### 2. 🕹️ Game Interface (`/play`)
- **Top Bar**
  - Catalyst Logo (Center)
  - Wallet Info (Top-Right)
    - Wallet Balance
    - [Buy NST] Button
  - Playing Balance
    - [Stake NST] Button
    - [Unstake] Button
  - [Rules] Button

- **Chat Interface**
  - MrsBeauty Avatar (Left of Chat)
  - Scrolling Chat History
  - Dialogue from MrsBeauty
  - Input Field for Human Response

- **Decision Buttons**
  - [🟢 Cooperate] Button (Green)
  - [🔴 Defect] Button (Red)

- **Round History**
  - Scrollable list showing:
    - "Round 1: You → C | MrsBeauty → D"

- **Persistent UI Elements**
  - Wallet Connected (Bottom Left)
  - In-Game NST Balance
  - Unstaked NST Balance

---

### 3. 🧾 Rules Modal
- Opens on click of "Rules"
- Explains game mechanics:
  - What is Catalyst?
  - What does Cooperate vs Defect mean?
  - How is scoring calculated?
  - How do you win?

---

## External Dependencies
- **WalletConnect / OnChainKit** – Wallet login
- **Smart Contracts**
  - `NostraToken` – mint, balanceOf
  - `StakingContract` – stake, unstake, getStakedBalance
  - `CatalystContract` – startGame, submitMove, endGame

---

## Notes for Devs
- Prioritize mobile-first layout, then scale to desktop
- Arcade-style UI with pixel fonts, neon glow, CRT overlay optional
- Use loading states when checking balances or submitting moves
