## 1. Introduction

Welcome to the Proof of Concept for **Nostra Labs Catalyst**.

Nostra Labs is building a novel behavioral intelligence platform for the Web3 ecosystem. By fusing adaptive AI agents with engaging strategy games based on established game theory, we create dynamic 'living laboratories'. These environments generate unique, large-scale data on human decision-making under real incentives – data currently missing but crucial for the next stage of decentralized development. Our insights directly fuel Decentralized Science (DeSci) research and empower developers to build more resilient, empirically-validated dApps, protocols, and economies.

This PoC demonstrates the core gameplay loop of our flagship game, **Catalyst**, through a **Web Application interface**.

## 2. PoC Scope & Objectives

The primary objectives of this PoC are to:

* Demonstrate the core Iterated Prisoner's Dilemma (IPD) game mechanics between a human player and an AI opponent (MrsBeauty) via a web interface.
* Simulate economic stakes ($NST) and track player balances within the web app.
* Implement basic AI strategies for MrsBeauty.
* Log game interactions (choices, payoffs, AI strategy) to showcase the *type* of behavioral data Nostra Labs aims to generate.
* Provide an engaging and understandable initial player experience on the web.

This PoC focuses on off-chain logic and simulated tokens to rapidly prototype the core interaction. Full Web3 integration (smart contracts, on-chain staking, wallet integration) and advanced adaptive AI are part of our subsequent MVP roadmap.

## 3. Key Features Demonstrated

* **Web Application Interface:** Players interact with the game via buttons and displays in a web browser.
* **1-vs-1 Gameplay:** Human player against an AI host ("MrsBeauty").
* **Iterated Prisoner's Dilemma (IPD):** A 5-round game where players choose to "Cooperate" or "Defect" each round.
* **Simulated Stakes & Payoffs:**
    * Initial Stake: **15 $NST** (simulated).
    * Payoff Matrix: **T=4, R=3, P=-1, S=-3**
        * T (Temptation - Defect while opponent Cooperates): You +4 $NST, AI -3 $NST
        * R (Reward - Both Cooperate): You +3 $NST, AI +3 $NST
        * P (Punishment - Both Defect): You -1 $NST, AI -1 $NST
        * S (Sucker - Cooperate while opponent Defects): You -3 $NST, AI +4 $NST
* **Basic AI Strategies:** MrsBeauty randomly uses one of several predefined strategies for each game (e.g., Tit For Tat, Always Cooperate, Always Defect).
* **Game State Tracking:** The web application manages and displays the game state (round number, player/AI moves, balance, game log).
* **Data Logging:** Round-by-round interactions, including player choices, AI choices, AI strategy used, payoffs, and player balance, are logged (simulated as console output or simple file for PoC) – representing the raw behavioral data output.
* **Basic Player Stats:** (If implemented in PoC) Tracking of games played, wins/losses, etc.

## 4. How to Interact / What it Demonstrates

This PoC is a Web Application. Interaction involves:
1.  Opening the web application in a browser.
2.  Connecting a wallet (simulated or real, depending on PoC stage).
3.  Minting test $NST (if applicable for PoC).
4.  Clicking buttons to "Stake $NST" and "Start Game".
5.  Making "Cooperate" or "Defect" choices via on-screen buttons.
6.  Observing MrsBeauty's responses in the chat interface and game outcomes in the game log/status areas.

The PoC demonstrates:
* The feasibility of the core game loop within a web interface.
* The engagement potential of the IPD with an AI persona and visual feedback.
* The *type* of granular behavioral data that can be captured from these interactions, forming the basis of our value proposition for researchers and Web3 projects.

## 5. Value Proposition (Demonstrated by PoC)

This PoC hints at our core value:
* **For Researchers:** Provides a glimpse into how Nostra Labs can generate unique, incentivized human behavioral data in strategic settings, suitable for studying cooperation, trust, risk, and human-AI interaction.
* **For Web3 Builders:** Shows a mechanism for testing how users might interact with systems under different incentive structures, laying the groundwork for future simulations of tokenomics or governance.

## 6. Future Goals (Beyond PoC)

This PoC is the first step. Our roadmap includes:
* Full Web3 integration (smart contracts for on-chain staking and potentially game logic, real wallet integration).
* Implementing advanced adaptive AI for MrsBeauty and other AI agents (The Oracle, Curator, Treasurer).
* Expanding game modes (PvP, multi-player dilemmas, other game theory scenarios).
* Building out the data analytics pipeline and researcher access portal.
* Enhancing the UI/UX of the Web Application.


This README aims to give anyone (including ourselves, or potential early reviewers) a clear understanding of what this current Web App PoC achieves and where it fits into our larger vision.
