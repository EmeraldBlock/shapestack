import Discord from "discord.js";
import { Command } from "../index.js";
import { randInt, range, safeDelete, sleep, toEnglishList, trimNewlines } from "../utils.js";
import Time from "../time.js";
import config from "../config/config.json";
import { BotError, AggregateBotError } from "../errors.js";
var Suit;
(function (Suit) {
    Suit[Suit["CLUBS"] = 0] = "CLUBS";
    Suit[Suit["DIAMONDS"] = 1] = "DIAMONDS";
    Suit[Suit["HEARTS"] = 2] = "HEARTS";
    Suit[Suit["SPADES"] = 3] = "SPADES";
    Suit[Suit["length"] = 4] = "length";
})(Suit || (Suit = {}));
const suitToString = [
    "♣",
    "♦",
    "♥",
    "♠",
];
var Rank;
(function (Rank) {
    Rank[Rank["ACE"] = 0] = "ACE";
    Rank[Rank["_2"] = 1] = "_2";
    Rank[Rank["_3"] = 2] = "_3";
    Rank[Rank["_4"] = 3] = "_4";
    Rank[Rank["_5"] = 4] = "_5";
    Rank[Rank["_6"] = 5] = "_6";
    Rank[Rank["_7"] = 6] = "_7";
    Rank[Rank["_8"] = 7] = "_8";
    Rank[Rank["_9"] = 8] = "_9";
    Rank[Rank["_10"] = 9] = "_10";
    Rank[Rank["JACK"] = 10] = "JACK";
    Rank[Rank["QUEEN"] = 11] = "QUEEN";
    Rank[Rank["KING"] = 12] = "KING";
    Rank[Rank["length"] = 13] = "length";
})(Rank || (Rank = {}));
const rankToString = [
    "A",
    ...range(2, 11),
    "J",
    "Q",
    "K",
];
const PERFECT = 21;
var Move;
(function (Move) {
    Move[Move["INVALID"] = 0] = "INVALID";
    Move[Move["TIMEOUT"] = 1] = "TIMEOUT";
    Move[Move["QUIT"] = 2] = "QUIT";
    Move[Move["HIT"] = 3] = "HIT";
    Move[Move["STAND"] = 4] = "STAND";
    Move[Move["DOUBLE"] = 5] = "DOUBLE";
    Move[Move["SPLIT"] = 6] = "SPLIT";
    Move[Move["SURRENDER"] = 7] = "SURRENDER";
})(Move || (Move = {}));
function getMove(content) {
    switch (content) {
        case "h":
        case "hit": {
            return Move.HIT;
        }
        case "s":
        case "stand": {
            return Move.STAND;
        }
        case "d":
        case "double":
        case "double down": {
            return Move.DOUBLE;
        }
        case "p":
        case "split": {
            return Move.SPLIT;
        }
        case "r":
        case "surrender": {
            return Move.SURRENDER;
        }
        case "q":
        case "quit": {
            return Move.QUIT;
        }
        default: {
            return Move.INVALID;
        }
    }
}
var Result;
(function (Result) {
    Result[Result["LOSE"] = 0] = "LOSE";
    Result[Result["TIE"] = 1] = "TIE";
    Result[Result["WIN"] = 2] = "WIN";
})(Result || (Result = {}));
const resultToEmoji = [
    "🟥",
    "🟨",
    "🟩",
];
const resultToMultiplier = [
    -1,
    0,
    1,
];
var Status;
(function (Status) {
    Status[Status["WAIT"] = 0] = "WAIT";
    Status[Status["CURRENT"] = 1] = "CURRENT";
    Status[Status["SURRENDER"] = 2] = "SURRENDER";
    Status[Status["BUST"] = 3] = "BUST";
    Status[Status["STAND"] = 4] = "STAND";
})(Status || (Status = {}));
const statusToEmoji = [
    "⬛",
    "➡️",
    "🏳️",
    "💥",
    "🔒",
];
class Card {
    suit;
    rank;
    down;
    constructor(suit, rank, down = false) {
        this.suit = suit;
        this.rank = rank;
        this.down = down;
    }
    static fromId(id, down) {
        return new Card(Math.floor(id / Rank.length), id % Rank.length, down);
    }
    static fromRandom(down) {
        return Card.fromId(randInt(Suit.length * Rank.length), down);
    }
    toString() {
        return this.down ? "??" : `${suitToString[this.suit]}${rankToString[this.rank]}`;
    }
    value() {
        if (this.rank >= Rank._10) {
            return 10;
        }
        else {
            return this.rank + 1;
        }
    }
}
class HandSum {
    sum;
    soft;
    constructor(sum, soft) {
        this.sum = sum;
        this.soft = soft;
    }
    static fromCards(cards) {
        const rawSum = cards.reduce((sum, card) => sum + card.value(), 0);
        if (cards.some(card => card.rank === Rank.ACE)) {
            const soft = rawSum + 10 <= PERFECT;
            return new HandSum(soft ? rawSum + 10 : rawSum, soft);
        }
        else {
            return new HandSum(rawSum, false);
        }
    }
    toString() {
        return `${this.sum}${this.soft ? "s" : "h"}`;
    }
    hit(card) {
        if (card.rank === Rank.ACE && this.sum + 11 <= PERFECT) {
            this.sum += 11;
            this.soft = true;
        }
        else {
            this.sum += card.value();
        }
        if (this.soft && this.sum > PERFECT) {
            this.sum -= 10;
            this.soft = false;
        }
    }
    bust() {
        return this.sum > PERFECT;
    }
}
class Hand {
    cards;
    handSum;
    status = Status.WAIT;
    constructor(cards) {
        this.cards = cards;
        this.handSum = HandSum.fromCards(this.cards);
    }
    static deal() {
        return new this([Card.fromRandom(), Card.fromRandom()]);
    }
    toString() {
        return `**${this.bust() ? "BUST" : this.blackjack() ? "BLACKJACK" : this.handSum}** ${this.getCardsAsString()}`;
    }
    getCardsAsString() {
        return this.cards.map(card => `\`${card}\``).join(" ");
    }
    hit(card = Card.fromRandom()) {
        this.cards.push(card);
        this.handSum.hit(card);
        return card;
    }
    bust() {
        return this.handSum.bust();
    }
    blackjack() {
        return this.handSum.sum === PERFECT && this.cards.length <= 2;
    }
    compare(hand) {
        if (hand.bust()) {
            return Result.WIN;
        }
        const ourSum = this.handSum.sum;
        const theirSum = hand.handSum.sum;
        if (ourSum > theirSum) {
            return Result.WIN;
        }
        else if (ourSum < theirSum) {
            return Result.LOSE;
        }
        else {
            if (ourSum !== PERFECT) {
                return Result.TIE;
            }
            const ourBJ = this.cards.length <= 2;
            const theirBJ = hand.cards.length <= 2;
            if (ourBJ && !theirBJ) {
                return Result.WIN;
            }
            else if (!ourBJ && theirBJ) {
                return Result.LOSE;
            }
            else {
                return Result.TIE;
            }
        }
    }
}
class Dealer extends Hand {
    hidden = true;
    constructor(cards) {
        super(cards);
        this.status = Status.WAIT;
    }
    static() {
        return new this([Card.fromRandom(), Card.fromRandom(true)]);
    }
    toString() {
        if (this.hidden) {
            const card = this.cards[0];
            return `**${card.rank === Rank.ACE ? `${11}s` : `${this.cards[0].value()}h`}+** ${this.getCardsAsString()}`;
        }
        return super.toString();
    }
    reveal() {
        this.hidden = false;
        this.cards[1].down = false;
        return this.cards[1];
    }
}
class PlayerHand extends Hand {
    bet = 100;
    result;
    constructor(cards) {
        super(cards);
    }
    resolve(hand) {
        return this.result ?? (this.result = this.compare(hand));
    }
    betToString() {
        switch (this.result) {
            case Result.LOSE: {
                return `**-${this.bet}**`;
            }
            case Result.TIE: {
                return `**~~${this.bet}~~**`;
            }
            case Result.WIN: {
                return `**+${this.bet}**`;
            }
            default: {
                return `_${this.bet}_`;
            }
        }
    }
    toString() {
        return `${super.toString()} ${this.betToString()}`;
    }
}
class Player {
    hands;
    user;
    channel;
    quit = false;
    constructor(hands, user, channel) {
        this.hands = hands;
        this.user = user;
        this.channel = channel;
    }
    static deal(user, channel) {
        return new Player([PlayerHand.deal()], user, channel);
    }
    quitGame() {
        this.quit = true;
        active.get(this.channel.id).delete(this.user.id);
    }
    async move() {
        return await new Promise(resolve => {
            const collector = this.channel.createMessageCollector(m => {
                if (m.author.id !== this.user.id)
                    return false;
                const move = getMove(m.content.trim().toLowerCase());
                if (move === Move.INVALID)
                    return false;
                if (m.guild?.me?.permissionsIn(m.channel).has("MANAGE_MESSAGES") ?? false) {
                    void safeDelete(m).then(() => resolve(move));
                }
                else {
                    resolve(move);
                }
                return true;
            }, { time: Time.MINUTE / Time.MILLI, max: 1 });
            collector.once("end", (_, reason) => {
                if (reason === "limit")
                    return;
                resolve(Move.TIMEOUT);
            });
        });
    }
}
class Blackjack {
    channel;
    users;
    players;
    dealer;
    embed;
    prompt;
    prev;
    constructor(channel, users) {
        this.channel = channel;
        this.users = users;
    }
    resolveAll() {
        this.players.forEach(player => player.hands.forEach(hand => hand.resolve(this.dealer)));
    }
    getUserIds() {
        return this.players.filter(player => !player.quit).map(player => player.user.id);
    }
    getEmbed(next, rules) {
        return new Discord.MessageEmbed({
            color: config.colors.info,
            title: "Blackjack",
            description: trimNewlines(`
${this.prev}
${next}${rules ? `
**h**it, **s**tand, **d**ouble down, s**p**lit, or su**r**render` : ""}
            `),
            fields: [
                { name: "Dealer", value: `${statusToEmoji[this.dealer.status]} ${this.dealer}` },
                ...this.players.map(player => ({
                    name: `${player.quit ? `~~${player.user.tag}~~` : player.user.tag} (*${player.hands.filter(hand => hand.result === undefined).reduce((sum, hand) => sum + hand.bet, 0)}* , **${player.hands.filter(hand => hand.result !== undefined).reduce((sum, hand) => sum + hand.bet * resultToMultiplier[hand.result], 0)}**)`,
                    value: player.hands.map(hand => `${hand.result !== undefined && hand.status === Status.STAND
                        ? resultToEmoji[hand.result]
                        : statusToEmoji[hand.status]} ${hand}`).join("\n"),
                })),
            ],
            footer: { text: "See the full rules with `rules blackjack`" },
        });
    }
    async display(embed) {
        if (this.prompt === undefined || this.prompt.deleted) {
            this.prompt = await this.channel.send(embed);
        }
        else {
            await this.prompt.edit(embed);
        }
    }
    async displayEmbed(next, rules) {
        await this.display(this.getEmbed(next, rules));
    }
    async delay() {
        await sleep(1.5 * Time.SECOND / Time.MILLI);
    }
    async dealerMove() {
        await this.delay();
        const { sum, soft } = this.dealer.handSum;
        if (sum < 17 || sum === 17 && soft) {
            return Move.HIT;
        }
        else {
            return Move.STAND;
        }
    }
    async runGame() {
        this.players = this.users.map(user => Player.deal(user, this.channel));
        this.dealer = Dealer.deal();
        this.prev = "Hands dealt.";
        if (this.dealer.cards[0].value() === 10 || this.dealer.cards[0].rank === Rank.ACE) {
            await this.displayEmbed("Dealer to peek at card...", false);
            await this.delay();
            if (this.dealer.handSum.sum === PERFECT) {
                this.dealer.reveal();
                this.prev = "**DEALER BLACKJACK**";
                this.resolveAll();
                await this.displayEmbed("Game end!", false);
                return;
            }
            this.prev = "Dealer did not have a blackjack.";
        }
        for (const player of this.players) {
            const mention = player.user.toString();
            for (let h = 0; h < player.hands.length; ++h) {
                const hand = player.hands[h];
                hand.status = Status.CURRENT;
                hand: while (true) {
                    await this.displayEmbed(`${mention} to move...`, true);
                    const move = await player.move();
                    if (hand.handSum.sum === PERFECT && ![Move.STAND, Move.QUIT, Move.TIMEOUT].includes(move)) {
                        this.prev = "You can't do that, you've got the best sum!";
                        continue;
                    }
                    switch (move) {
                        case Move.HIT: {
                            const card = hand.hit();
                            if (hand.bust()) {
                                hand.status = Status.BUST;
                                this.prev = `${mention} draws \`${card}\` and **BUSTS**.`;
                                hand.result = Result.LOSE;
                                break hand;
                            }
                            this.prev = `${mention} draws \`${card}\`.`;
                            break;
                        }
                        case Move.STAND: {
                            hand.status = Status.STAND;
                            this.prev = `${mention} stands.`;
                            break hand;
                        }
                        case Move.DOUBLE: {
                            hand.bet *= 2;
                            const card = hand.hit();
                            if (hand.bust()) {
                                hand.status = Status.BUST;
                                this.prev = `${mention} doubles down and draws \`${card}\` and **BUSTS**.`;
                                hand.result = Result.LOSE;
                                break hand;
                            }
                            hand.status = Status.STAND;
                            this.prev = `${mention} doubles down and draws \`${card}\`.`;
                            break hand;
                        }
                        case Move.SPLIT: {
                            if (hand.cards.length > 2) {
                                this.prev = "You can only split on the first turn of your hand!";
                                break;
                            }
                            if (hand.cards[0].value() !== hand.cards[1].value()) {
                                this.prev = "You can only split if your cards have the same value!";
                                break;
                            }
                            player.hands.splice(h + 1, 0, new PlayerHand([hand.cards.pop()]));
                            hand.handSum = HandSum.fromCards(hand.cards);
                            this.prev = `${mention} splits their hand and draws \`${hand.hit()}\` and \`${player.hands[h + 1].hit()}\`.`;
                            break;
                        }
                        case Move.SURRENDER: {
                            if (hand.cards.length > 2) {
                                this.prev = "You can only surrender on the first turn of your hand!";
                                break;
                            }
                            hand.bet /= 2;
                            hand.status = Status.SURRENDER;
                            hand.result = Result.LOSE;
                            this.prev = `${mention} surrenders their hand.`;
                            break hand;
                        }
                        case Move.QUIT: {
                            for (; h < player.hands.length; ++h) {
                                player.hands[h].status = Status.STAND;
                            }
                            player.quitGame();
                            this.prev = `${mention} has quit.`;
                            break hand;
                        }
                        case Move.TIMEOUT: {
                            for (; h < player.hands.length; ++h) {
                                player.hands[h].status = Status.STAND;
                            }
                            player.quitGame();
                            this.prev = `${mention} has been skipped due to inactivity.`;
                            break hand;
                        }
                    }
                }
            }
        }
        this.dealer.status = Status.CURRENT;
        await this.displayEmbed(`Dealer to reveal card...`, false);
        await sleep(1.5 * Time.SECOND / Time.MILLI);
        this.prev = `Dealer's other card was \`${this.dealer.reveal()}\`.`;
        if (this.players.some(player => player.hands.some(hand => !hand.bust()))) {
            dealer: while (true) {
                await this.displayEmbed(`Dealer to move...`, false);
                const move = await this.dealerMove();
                switch (move) {
                    case Move.HIT: {
                        const card = this.dealer.hit();
                        if (this.dealer.handSum.sum > PERFECT) {
                            this.dealer.status = Status.BUST;
                            this.prev = `Dealer draws \`${card}\` and **BUSTS**.`;
                            break dealer;
                        }
                        this.prev = `Dealer draws \`${card}\`.`;
                        break;
                    }
                    case Move.STAND: {
                        this.dealer.status = Status.STAND;
                        this.prev = `Dealer stands.`;
                        break dealer;
                    }
                }
            }
            this.resolveAll();
        }
        else {
            this.dealer.status = Status.WAIT;
        }
        await this.displayEmbed("Game end!", false);
    }
}
const active = new Map();
export default new Command({
    name: "blackjack",
    alias: ["bj"],
    desc: `Starts a game of Blackjack.`,
    usage: ``,
    execute: async (message) => {
        const playerUsers = message.mentions.users.has(message.author.id)
            ? message.mentions.users.array()
            : [message.author, ...message.mentions.users.array()];
        const botErrors = [];
        if (playerUsers.some(user => user.id === message.client.user.id)) {
            botErrors.push(new BotError("No AI support", "I don't know how to play Blackjack!"));
        }
        const playerBots = playerUsers.filter(user => user.bot && user.id !== message.client.user.id);
        if (playerBots.length > 0) {
            const list = toEnglishList(playerBots.map(user => user.toString()));
            const predicate = playerBots.length === 1 ? "is a bot" : "are bots";
            botErrors.push(new BotError("Bots not allowed", `${list} ${predicate}!`));
        }
        const playerIds = playerUsers.map(user => user.id);
        const currentIds = active.get(message.channel.id) ?? new Set();
        if (currentIds.size > 0 && playerIds.some(id => currentIds.has(id))) {
            const conflictIds = playerIds.filter(id => currentIds.has(id));
            const list = toEnglishList(conflictIds.map(id => id === message.author.id ? "You" : `<@${id}>`));
            const verb = conflictIds[0] !== message.author.id && conflictIds.length === 1 ? "is" : "are";
            botErrors.push(new BotError("Already playing", `${list} ${verb} already playing Blackjack in this channel!`));
        }
        if (botErrors.length > 0) {
            throw AggregateBotError.fromBotErrors(botErrors);
        }
        active.set(message.channel.id, new Set([...currentIds, ...playerIds]));
        const game = new Blackjack(message.channel, playerUsers);
        await game.runGame();
        const endPlayerIds = game.getUserIds();
        const ids = active.get(message.channel.id);
        if (endPlayerIds.length === ids.size) {
            active.delete(message.channel.id);
        }
        else {
            endPlayerIds.forEach(id => ids.delete(id));
        }
    },
});
//# sourceMappingURL=blackjack.js.map