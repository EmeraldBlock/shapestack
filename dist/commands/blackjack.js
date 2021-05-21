import Discord from "discord.js";
import { Command } from "../index.js";
import { randInt, range, safeDelete, sleep, trimNewlines } from "../utils.js";
import Time from "../time.js";
import config from "../config/config.json";
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
const BLACKJACK = 21;
var Move;
(function (Move) {
    Move[Move["INVALID"] = 0] = "INVALID";
    Move[Move["HIT"] = 1] = "HIT";
    Move[Move["STAND"] = 2] = "STAND";
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
class Card {
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
    constructor(sum, soft) {
        this.sum = sum;
        this.soft = soft;
    }
    static fromCards(cards) {
        const rawSum = cards.reduce((sum, card) => sum + card.value(), 0);
        if (cards.some(card => card.rank === Rank.ACE)) {
            const soft = rawSum + 10 <= BLACKJACK;
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
        if (card.rank === Rank.ACE && this.sum + 11 <= BLACKJACK) {
            this.sum += 11;
            this.soft = true;
        }
        else {
            this.sum += card.value();
        }
        if (this.soft && this.sum > BLACKJACK) {
            this.sum -= 10;
            this.soft = false;
        }
    }
    bust() {
        return this.sum > BLACKJACK;
    }
}
class Hand {
    constructor(cards) {
        this.cards = cards;
        this.handSum = HandSum.fromCards(this.cards);
    }
    static deal() {
        return new Hand([Card.fromRandom(), Card.fromRandom()]);
    }
    toString() {
        return `**${this.blackjack() ? "BJ" : this.handSum}** ${this.cards.map(card => `\`${card}\``).join(" ")}`;
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
        return this.handSum.sum === BLACKJACK && this.cards.length <= 2;
    }
    compare(hand) {
        const ourSum = this.handSum.sum;
        const theirSum = hand.handSum.sum;
        if (ourSum > theirSum) {
            return Result.WIN;
        }
        else if (ourSum < theirSum) {
            return Result.LOSE;
        }
        else {
            if (ourSum !== BLACKJACK) {
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
    constructor(cards) {
        super(cards);
        this.handSumUp = HandSum.fromCards(this.cards.filter(card => !card.down));
    }
    static deal() {
        return new Dealer([Card.fromRandom(), Card.fromRandom(true)]);
    }
    toString() {
        return `**${this.blackjack() && !this.cards.some(card => card.down) ? "BJ" : this.handSumUp}${this.cards.some(card => card.down) ? "+" : ""}** ${this.cards.map(card => `\`${card}\``).join(" ")}`;
    }
    hit(card) {
        card = super.hit(card);
        if (!card.down) {
            this.handSumUp.hit(card);
        }
        return card;
    }
    reveal() {
        this.cards[1].down = false;
        this.handSumUp.hit(this.cards[1]);
        return this.cards[1];
    }
}
class Blackjack {
    constructor(channel, user) {
        this.channel = channel;
        this.user = user;
    }
    getEmbed(description = "**h** to hit, **s** to stand") {
        return new Discord.MessageEmbed({
            color: config.colors.info,
            title: "Blackjack",
            description,
            fields: [
                { name: "Dealer", value: `${this.dealer}` },
                { name: "You", value: `${this.player}` },
            ],
            footer: { text: "See the full rules with `rules blackjack`" },
        });
    }
    async display(description) {
        if (this.prompt === undefined || this.prompt.deleted) {
            this.prompt = await this.channel.send(this.getEmbed(description));
        }
        else {
            await this.prompt.edit(this.getEmbed(description));
        }
    }
    async playerMove() {
        return await new Promise(resolve => {
            const collector = this.channel.createMessageCollector(m => {
                if (m.author.id !== this.user.id)
                    return false;
                const move = getMove(m.content.trim().toLowerCase());
                if (move === Move.INVALID)
                    return false;
                if (m.guild?.me?.permissionsIn(this.channel).has("MANAGE_MESSAGES") ?? false) {
                    void safeDelete(m).then(() => resolve(move));
                }
                else {
                    resolve(move);
                }
                return true;
            }, { time: Time.MINUTE / Time.MILLI, max: 1 });
            collector.once("end", async (_, reason) => {
                if (reason === "limit")
                    return;
                if (this.prompt !== undefined) {
                    await this.prompt.edit({ content: "Ended due to inactivity." });
                }
            });
        });
    }
    async dealerMove() {
        await sleep(1.5 * Time.SECOND / Time.MILLI);
        const { sum, soft } = this.dealer.handSum;
        if (sum < 17 || sum === 17 && soft) {
            return Move.HIT;
        }
        else {
            return Move.STAND;
        }
    }
    async runGame() {
        this.player = Hand.deal();
        this.dealer = Dealer.deal();
        if (this.dealer.handSum.sum === BLACKJACK) {
            this.dealer.reveal();
            await this.display(trimNewlines(`
**DEALER BLACKJACK**
${this.player.handSum.sum === BLACKJACK ? "\\🟨 You tied!" : "\\🟥 You lost!"}
            `));
            return;
        }
        await this.display();
        player: while (true) {
            const move = await this.playerMove();
            switch (move) {
                case Move.HIT: {
                    if (this.player.handSum.sum === BLACKJACK) {
                        await this.display("You can't hit, you've got the best sum!");
                        break;
                    }
                    const card = this.player.hit();
                    if (this.player.handSum.sum > BLACKJACK) {
                        await this.display(trimNewlines(`
You draw \`${card}\` and **BUST**
\\🟥 You lost!
                    `));
                        return;
                    }
                    await this.display(`You draw \`${card}\``);
                    break;
                }
                case Move.STAND: {
                    break player;
                }
            }
        }
        await this.display(`Dealer's other card was \`${this.dealer.reveal()}\``);
        dealer: while (true) {
            const move = await this.dealerMove();
            switch (move) {
                case Move.HIT: {
                    const card = this.dealer.hit();
                    if (this.dealer.handSum.sum > BLACKJACK) {
                        await this.display(trimNewlines(`
Dealer draws \`${card}\` and **BUSTS**
\\🟩 You won!
                    `));
                        return;
                    }
                    await this.display(`Dealer draws \`${card}\``);
                    break;
                }
                case Move.STAND: {
                    break dealer;
                }
            }
        }
        switch (this.player.compare(this.dealer)) {
            case Result.LOSE: {
                await this.display("\\🟥 You lost!");
                break;
            }
            case Result.TIE: {
                await this.display("\\🟨 You tied!");
                break;
            }
            case Result.WIN: {
                await this.display("\\🟩 You won!");
                break;
            }
        }
    }
}
export default new Command({
    name: "blackjack",
    alias: ["bj"],
    desc: `Starts a game of Blackjack.`,
    usage: ``,
    execute: async (message) => {
        const game = new Blackjack(message.channel, message.author);
        await game.runGame();
    },
});
