from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes
import random
import logging
import asyncio
import json
from datetime import datetime

def log_round(user_id, chat_id, round_num, player_move, ai_move, payoffs, player_balance, ai_balance, ai_strategy):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "user_id": user_id,
        "chat_id": chat_id,
        "round": round_num,
        "player_move": player_move,
        "ai_move": ai_move,
        "payoffs": payoffs,
        "player_balance": player_balance,
        "ai_balance": ai_balance,
        "ai_strategy": ai_strategy,
    }
    with open("game_data.log", "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

API_TOKEN = "7731538657:AAEWqkHrLYWGtgA5HnfOxIk5cTToHcUekLc"  # Telegram bot token

game_states = {}  # chat_id: {round, player_moves, ai_moves, ai_strategy, player_balance}
AI_STRATEGIES = ['Always C', 'Always D', 'TFT']

# User stats: user_id -> dict
user_stats = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logging.info("Entered start() function.")
    keyboard = [
        [InlineKeyboardButton("🕹️ Start Game", callback_data='startgame')],
        [InlineKeyboardButton("📜 Rules", callback_data='rules')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    welcome_text = (
        "🍒 Welcome, Player! I'm MrsBeauty, your game host.\n\n"
        "This is the Nostra Labs playground—where strategy games meet research! 🎮\n\n"
        "Ready to drop your coin and play Catalyst? Hit 🕹️ Start Game to begin, or tap 📜 Rules for a quick tip. Let the games begin! 👾"
    )
    try:
        logging.info("Sending welcome message for /start.")
        if update.message:
            await update.message.reply_text(
                welcome_text,
                reply_markup=reply_markup
            )
        else:
            await context.bot.send_message(
                chat_id=update.effective_chat.id,
                text=welcome_text,
                reply_markup=reply_markup
            )
        logging.info("Welcome message sent successfully.")
    except Exception as e:
        logging.error(f"Error sending welcome message in start(): {e}")

async def startgame(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logging.info(f"[START] startgame() called for chat_id={update.effective_chat.id}")
    chat_id = update.effective_chat.id
    stake = 15  # Maximum possible loss in 5 rounds (worst case: always cooperate, MrsBeauty always defects)
    ai_strategy = random.choice(AI_STRATEGIES)
    # Check if the player just viewed the rules
    just_viewed_rules = False
    just_finished_game = False
    if hasattr(context, 'user_data'):
        if context.user_data.get('just_viewed_rules'):
            just_viewed_rules = True
            context.user_data['just_viewed_rules'] = False  # Reset after use
        if context.user_data.get('just_finished_game'):
            just_finished_game = True
            context.user_data['just_finished_game'] = False  # Reset after use
    game_states[chat_id] = {
        'round': 1,
        'player_moves': [],
        'ai_moves': [],
        'ai_strategy': ai_strategy,
        'player_balance': stake,
        'stake': stake
    }
    logging.info(f"Game started for chat_id={chat_id} with AI strategy {ai_strategy}, stake={stake}")
    logging.info(f"[END] startgame() completed for chat_id={chat_id}")
    # Adaptive first round message
    if just_viewed_rules:
        msg = (
            f"Let's begin!\n\nYou have {stake} $NST at stake. (Don't worry, it's on the house this time.)\n\nRound 1\nWill you Cooperate or Defect?"
        )
    elif just_finished_game:
        msg = (
            f"Back for another round?\n\nYou have {stake} $NST at stake. (Tokens are free for you this time.)\n\nRound 1\nWill you Cooperate or Defect?"
        )
    else:
        msg = (
            f"🍒 Welcome to Catalyst! I'm MrsBeauty, and I'm thrilled to play with you.\n\n"
            f"I've given you 15 $NST to start (free tokens for this round!).\n\n"
            f"Here's how we play:\n"
            f"\n"
            f"- If we both cooperate: we both keep our stake (+$3 each)\n"
            f"- If you cooperate and I defect: you lose $3, I gain $5\n"
            f"- If you defect and I cooperate: you gain $5, I lose $3\n"
            f"- If we both defect: we both keep our stake (+$1 each)\n"
            f"\n"
            f"Try to keep as much of your stake as you can after 5 rounds!\n\n"
            f"Round 1\n\nAre you going to Cooperate or Defect?"
        )
    keyboard = [
        [InlineKeyboardButton("🟢 Cooperate", callback_data='move_C')],
        [InlineKeyboardButton("🔴 Defect", callback_data='move_D')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    try:
        logging.info(f"Sending first round message to chat_id={chat_id}. Message content: {msg}")
        await context.bot.send_message(chat_id=chat_id, text=msg, reply_markup=reply_markup)
    except Exception as e:
        logging.error(f"Error sending first round message: {e}")

async def move_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        query = update.callback_query
        chat_id = query.message.chat_id
        data = query.data
        logging.info(f"Received callback query: chat_id={chat_id}, data={data}")
        print(f"DEBUG: Callback data received: {data}")

        if data == 'startgame':
            # Start the game in this chat
            logging.info("Start game button pressed. Calling startgame().")
            await startgame(update, context)
            await query.answer()
            return

        elif data == 'rules':

            rules_msg = (
                "📜 🍒 MrsBeauty explains the rules!\n\n"
                "Drop your coin (15 $NST) to join me for a game! (This round, your tokens are free!)\n\n"
                "Each round, you and I will secretly pick: 🟢 Cooperate or 🔴 Defect.\n\n"
                "Here's how it works:\n"
                "- If we both cooperate: we both keep our stake (+$3 each)\n"
                "- If you cooperate and I defect: you lose $3, I gain $5\n"
                "- If you defect and I cooperate: you gain $5, I lose $3\n"
                "- If we both defect: we both keep our stake (+$1 each)\n\n"
                "Try to keep as much of your stake as you can after 5 rounds!\n\n"
                "Ready to play? Press 🕹️ Start Game or tap 🔄 New Game to restart. Good luck, challenger! 👾"
            )
            # Mark that the user just viewed rules, so startgame can adapt
            if hasattr(context, 'user_data'):
                context.user_data['just_viewed_rules'] = True
            keyboard = [
                [InlineKeyboardButton("🕹️ Start Game", callback_data='startgame')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.message.reply_text(rules_msg, reply_markup=reply_markup)
            await query.answer()
            return

        # handle player move
        if data in ['move_C', 'move_D']:
            move = data[-1]  # 'C' or 'D'
            move_names = {'C': 'Cooperate', 'D': 'Defect'}
            state = game_states.get(chat_id)
            if not state:
                await context.bot.send_message(chat_id=chat_id, text="No active game. Press Start Game.")
                await query.answer()
                return
            # Log state before move
            logging.info(f"Before move: chat_id={chat_id}, round={state['round']}, player_moves={state['player_moves']}, ai_moves={state['ai_moves']}, ai_strategy={state['ai_strategy']}, player_balance={state['player_balance']}")
            round_num = state['round']
            ai_strategy = state['ai_strategy']
            # Defensive: moves lists should have length == round_num - 1
            if len(state['player_moves']) != round_num - 1 or len(state['ai_moves']) != round_num - 1:
                logging.error(f"State mismatch: player_moves={state['player_moves']}, ai_moves={state['ai_moves']}, round={round_num}")
                await context.bot.send_message(chat_id=chat_id, text="Sorry, there was a game state error. Please /start again.")
                del game_states[chat_id]
                await query.answer()
                return
            # AI move logic
            if ai_strategy == 'Always C':
                ai_move = 'C'
            elif ai_strategy == 'Always D':
                ai_move = 'D'
            elif ai_strategy == 'TFT':
                # Tit-for-Tat: copy player's previous move, default to 'C' if first round
                if len(state['player_moves']) > 0:
                    ai_move = state['player_moves'][-1]
                else:
                    ai_move = 'C'
            else:
                ai_move = 'C'
            player_payoff, ai_payoff = calculate_payoffs(move, ai_move)
            state['player_balance'] += player_payoff
            state['ai_balance'] = state.get('ai_balance', 0) + ai_payoff
            state['player_moves'].append(move)
            state['ai_moves'].append(ai_move)
            # Log round data
            log_round(
                user_id=query.from_user.id,
                chat_id=chat_id,
                round_num=state['round'],
                player_move=move,
                ai_move=ai_move,
                payoffs={"player": player_payoff, "ai": ai_payoff},
                player_balance=state['player_balance'],
                ai_balance=state['ai_balance'],
                ai_strategy=state['ai_strategy'],
            )
            state['round'] += 1  # Advance to next round
            logging.info(f"After move: chat_id={chat_id}, round={state['round']}, player_moves={state['player_moves']}, ai_moves={state['ai_moves']}, player_balance={state['player_balance']}")
            if state['round'] <= 5 and state['player_balance'] > 0:
                # MrsBeauty: lively, playful feedback!
                def mrs_beauty_comment(player_move, ai_move):
                    if player_move == 'C' and ai_move == 'C':
                        return "Look at us, two angels! But will it last? 😇"
                    elif player_move == 'C' and ai_move == 'D':
                        return "Ouch, you trusted me? Darling, never trust a beauty with secrets! 💅"
                    elif player_move == 'D' and ai_move == 'C':
                        return "You played me! I might have to step up my game. "
                    else:  # both D
                        return "Two rebels in the room! At least we're honest about it. "
                comment = mrs_beauty_comment(move, ai_move)
                result_text = (
                    f"🍒 I just made my move! You picked {move_names[move]}, and I picked {move_names[ai_move]}!\n"
                    f"This round, you {'earned' if player_payoff >= 0 else 'lost'} ${abs(player_payoff)}.\n"
                    f"Your remaining stake: {state['player_balance']} $NST\n"
                    f"{comment}\n\n"
                )
                prompt = result_text + f"Ready for Round {state['round']}? Will you Cooperate or Defect this time?"
                keyboard = [
                    [InlineKeyboardButton("🟢 Cooperate", callback_data='move_C')],
                    [InlineKeyboardButton("🔴 Defect", callback_data='move_D')]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                # Robust retry logic for network errors
                max_retries = 3
                for attempt in range(1, max_retries + 1):
                    try:
                        await context.bot.send_message(chat_id=chat_id, text=prompt, reply_markup=reply_markup)
                        break
                    except Exception as e:
                        logging.error(f"Error sending round prompt (attempt {attempt}): {e}")
                        if attempt == max_retries:
                            await context.bot.send_message(chat_id=chat_id, text="Network error: Could not send your move result after several tries. Please try again later.")
                        else:
                            await asyncio.sleep(2 * attempt)
                
            elif state['player_balance'] <= 0:
                # Player lost their entire stake
                msg = (
                    "Oh no! You've lost your entire stake.\n"
                    "Better luck next time! Want to try again and outsmart MrsBeauty?"
                )
                # Mark that the user just finished a game, so startgame can adapt
                if hasattr(context, 'user_data'):
                    context.user_data['just_finished_game'] = True
                keyboard = [
                    [InlineKeyboardButton("🔄 New Game", callback_data='startgame')]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                await context.bot.send_message(chat_id=chat_id, text=msg, reply_markup=reply_markup)
                del game_states[chat_id]
                await query.answer()
                return
            else:
                # Friendly strategy explanation
                if ai_strategy == 'Always C':
                    strategy_explanation = "I always chose to cooperate, no matter what you did!"
                elif ai_strategy == 'Always D':
                    strategy_explanation = "I always chose to defect, every single round!"
                elif ai_strategy == 'TFT':
                    strategy_explanation = ("I simply copied your previous move each round—if you cooperated, I did too; if you defected, so did I!")
                else:
                    strategy_explanation = "I was just playing randomly this time!"
                
                msg = (
                    f"🍒 That's a wrap, superstar!\n\n"
                    f"In the final round, you went with {move_names[move]}, and I picked {move_names[ai_move]}.\n\n"
                    f"Your final balance: {state['player_balance']} $NST.\n\n"
                    f"Want to know my secret? {strategy_explanation}\n\n"
                    f"How much of your stake did you manage to keep? Did you outsmart me, or did I scoop up your tokens?\n\n"
                    f"Press 🔄 New Game if you want to challenge me again!"
                )
                # Add New Game button
                keyboard = [
                    [InlineKeyboardButton("🔄 New Game", callback_data='startgame')]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                max_retries = 3
                for attempt in range(1, max_retries + 1):
                    try:
                        await context.bot.send_message(chat_id=chat_id, text=msg, reply_markup=reply_markup)
                        break
                    except Exception as e:
                        logging.error(f"Error sending end-of-game message (attempt {attempt}): {e}")
                        if attempt == max_retries:
                            await context.bot.send_message(chat_id=chat_id, text="Network error: Could not send the end-of-game message after several tries. Please try again later.")
                        else:
                            await asyncio.sleep(2 * attempt)
                
                # --- Update user stats ---
                user_id = query.from_user.id
                stats = user_stats.get(user_id, {
                    'games': 0,
                    'wins': 0,
                    'losses': 0,
                    'highest': 15,
                    'last_result': None
                })
                stats['games'] += 1
                final_balance = state['player_balance']
                if final_balance > 15:
                    stats['wins'] += 1
                elif final_balance < 15:
                    stats['losses'] += 1
                if final_balance > stats['highest']:
                    stats['highest'] = final_balance
                stats['last_result'] = {
                    'balance': final_balance,
                    'rounds': state['round'],
                    'win': final_balance > 15,
                }
                user_stats[user_id] = stats
                # --- End stats update ---
                del game_states[chat_id]
            await query.answer()
            return
    except Exception as e:
        logging.error(f"Exception in move_handler: {e}")
        if update.callback_query:
            await update.callback_query.answer(text="An error occurred. Please try again.", show_alert=True)
        elif update.effective_chat:
            await context.bot.send_message(chat_id=update.effective_chat.id, text="An error occurred. Please try again later.")


# MrsBeauty: lively, playful feedback!
def mrs_beauty_comment(player_move, ai_move):
    if player_move == 'C' and ai_move == 'C':
        return ("🍒 Look at us, two angels! We both cooperated and scored big. But will it last? 😇\n")
    elif player_move == 'C' and ai_move == 'D':
        return ("🍒 Ouch, you trusted me? I played Defect and you lost $3. Darling, never trust a beauty with secrets! 💅\n")
    elif player_move == 'D' and ai_move == 'C':
        return ("🍒 You played Defect while I cooperated. You gain $5, I lose $3. You played me! I might have to step up my game. 😉\n")
    else:  # both D
        return ("🍒 Two rebels in the arcade! We both defected and get just $1 each. At least we're honest about it. 😏\n")


def calculate_payoffs(player, ai):
    # Classic repeated Prisoner's Dilemma payoffs (harsher sucker penalty)
    if player == 'C' and ai == 'C':
        return 3, 3  # Reward: Both cooperate, +$3 each
    elif player == 'C' and ai == 'D':
        return -5, 7  # Sucker, Temptation: Player loses $5, AI gains $7
    elif player == 'D' and ai == 'C':
        return 7, -5  # Temptation, Sucker: Player gains $7, AI loses $5
    else:  # both D
        return 1, 1  # Punishment: Both defect, +$1 each


from telegram import BotCommand

async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    stats = user_stats.get(user_id)
    if not stats:
        msg = "🍒 No stats yet! Play a game with me and I'll keep track of your results."
    else:
        games = stats['games']
        wins = stats['wins']
        losses = stats['losses']
        win_rate = (wins / games * 100) if games else 0
        highest = stats['highest']
        last = stats['last_result']
        highest_earning = highest - 15
        last_result_str = "No games played yet."
        if last:
            earning = last['balance'] - 15
            outcome = "Win!" if last['win'] else ("Loss" if last['balance'] < 15 else "Broke even!")
            last_result_str = f"Last game: {outcome} (Earning: {earning:+} $NST, Balance: {last['balance']} $NST after {last['rounds']} rounds)"
        msg = (
            f"🍒 Your Stats with MrsBeauty:\n\n"
            f"Total games played: {games}\n"
            f"Wins: {wins}\n"
            f"Losses: {losses}\n"
            f"Win rate: {win_rate:.1f}%\n"
            f"Highest earning: {highest_earning:+} $NST\n"
            f"{last_result_str}\n\n"
            f"Keep playing and see if you can beat your record! 🕹️"
        )
    if update.message:
        await update.message.reply_text(msg)
    else:
        await context.bot.send_message(chat_id=update.effective_chat.id, text=msg)

async def set_bot_commands(application):
    commands = [
        BotCommand("start", "Start the game or restart MrsBeauty"),
        BotCommand("rules", "See the rules"),
        BotCommand("about", "About Nostra Labs"),
        BotCommand("stats", "Your stats with MrsBeauty"),
    ]
    await application.bot.set_my_commands(commands)

async def about(update: Update, context: ContextTypes.DEFAULT_TYPE):
    about_text = (
        "Welcome to the Nostra Labs playground! We're building a platform where strategy games meet cutting-edge research.\n\n"
        "Our vision is to use games like Catalyst (the game you're playing a simulation of right now!) as \"living laboratories.\" By observing how players interact and make decisions in games with real stakes (simulated here with $NST!), we gather valuable insights into trust, cooperation, and strategy. This data helps fuel Decentralized Science (DeSci) and provides unique behavioral insights to make future Web3 systems (like tokenomics and governance models) more resilient, efficient, and secure.\n\n"
        "Your host in this game is MrsBeauty. As your host, MrsBeauty is here to make things interesting! She's an AI designed to challenge you, adapt the game based on how you play, and maybe keep you guessing a little. Her playful style is all part of the fun – and part of how Nostra Labs studies strategy in action!\n\n"
        "Think of it as playing games for collective progress! 👾\n\n"
        "Learn more at: nostralabs.org"
    )
    if update.message:
        await update.message.reply_text(about_text)
    else:
        await context.bot.send_message(chat_id=update.effective_chat.id, text=about_text)

async def rules(update: Update, context: ContextTypes.DEFAULT_TYPE):
    rules_msg = (
        "📜 🍒 MrsBeauty explains the rules!\n\n"
        "Drop your coin (15 $NST) to join me for a game! (This round, your tokens are free!)\n\n"
        "Each round, you and I will secretly pick: 🟢 Cooperate or 🔴 Defect.\n\n"
        "Here's how it works:\n"
        "- If we both cooperate: we both keep our stake (+$3 each)\n"
        "- If you cooperate and I defect: you lose $3, I gain $5\n"
        "- If you defect and I cooperate: you gain $5, I lose $3\n"
        "- If we both defect: we both keep our stake (+$1 each)\n\n"
        "You have 5 rounds to maximize your $NST.\n\n"
        "Ready to play? Hit 🕹️ Start Game below!"
    )
    if update.message:
        await update.message.reply_text(rules_msg)
    else:
        await context.bot.send_message(chat_id=update.effective_chat.id, text=rules_msg)

def main():
    print("Bot is starting...")

    async def post_init(application):
        await set_bot_commands(application)

    app = ApplicationBuilder().token(API_TOKEN).post_init(post_init).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("about", about))
    app.add_handler(CommandHandler("rules", rules))
    app.add_handler(CommandHandler("stats", stats))
    app.add_handler(CallbackQueryHandler(move_handler, pattern=None))  # Register last to catch all callback queries

    app.run_polling()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
