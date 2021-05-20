import Discord from "discord.js";

import { Command } from "../index.js";
import { randInt, range, sleep, trimNewlines } from "../utils.js";
import Time from "../time.js";

import config from "../config/config.json";

enum Suit {
    CLUBS,
    DIAMONDS,
    HEARTS,
    SPADES,
    length,
}
const suitToString = [
    "♣",
    "♦",
    "♥",
    "♠",
];

enum Rank {
    ACE,
    _2,
    _3,
    _4,
    _5,
    _6,
    _7,
    _8,
    _9,
    _10,
    JACK,
    QUEEN,
    KING,
    length,
}
const rankToString = [
    "A",
    ...range(2, 11),
    "J",
    "Q",
    "K",
];

const BLACKJACK = 21;

enum Move {
    INVALID,
    HIT,
    STAND,
}

function getMove(content: string): Move {
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

enum Result {
    LOSE,
    TIE,
    WIN,
}

class Card {
    constructor(
        public suit: Suit,
        public rank: Rank,
        public down: boolean = false,
    ) {}

    static fromId(id: number, down?: boolean): Card {
        return new Card(Math.floor(id / Rank.length), id % Rank.length, down);
    }

    static fromRandom(down?: boolean): Card {
        return Card.fromId(randInt(Suit.length * Rank.length), down);
    }

    toString(): string {
        return this.down ? "??" : `${suitToString[this.suit]}${rankToString[this.rank]}`;
    }

    value(): number {
        if (this.rank >= Rank._10) {
            return 10;
        } else {
            return this.rank + 1;
        }
    }
}

class HandSum {
    constructor(
        public sum: number,
        public soft: boolean,
    ) {}

    static fromCards(cards: Array<Card>): HandSum {
        const rawSum = cards.reduce((sum, card) => sum + card.value(), 0);
        if (cards.some(card => card.rank === Rank.ACE)) {
            const soft = rawSum+10 <= BLACKJACK;
            return new HandSum(soft ? rawSum+10 : rawSum, soft);
        } else {
            return new HandSum(rawSum, false);
        }
    }

    toString(): string {
        return `${this.sum}${this.soft ? "s" : "h"}`;
    }

    hit(card: Card): void {
        if (card.rank === Rank.ACE && this.sum+11 <= BLACKJACK) {
            this.sum += 11;
            this.soft = true;
        } else {
            this.sum += card.value();
        }
        if (this.soft && this.sum > BLACKJACK) {
            this.sum -= 10;
            this.soft = false;
        }
    }

    bust(): boolean {
        return this.sum > BLACKJACK;
    }
}

class Hand {
    public handSum: HandSum;

    constructor(
        public cards: Array<Card>,
    ) {
        this.handSum = HandSum.fromCards(this.cards);
    }

    static deal(): Hand {
        return new Hand([Card.fromRandom(), Card.fromRandom()]);
    }

    toString(): string {
        return `**${this.blackjack() ? "BJ" : this.handSum}** ${this.cards.map(card => `\`${card}\``).join(" ")}`;
    }

    hit(card: Card = Card.fromRandom()): Card {
        this.cards.push(card);
        this.handSum.hit(card);
        return card;
    }

    bust(): boolean {
        return this.handSum.bust();
    }

    blackjack(): boolean {
        return this.handSum.sum === BLACKJACK && this.cards.length <= 2;
    }

    compare(hand: Hand) {
        const ourSum = this.handSum.sum;
        const theirSum = hand.handSum.sum;
        if (ourSum > theirSum) {
            return Result.WIN;
        } else if (ourSum < theirSum) {
            return Result.LOSE;
        } else {
            if (ourSum !== BLACKJACK) {
                return Result.TIE;
            }
            const ourBJ = this.cards.length <= 2;
            const theirBJ = hand.cards.length <= 2;
            if (ourBJ && !theirBJ) {
                return Result.WIN;
            } else if (!ourBJ && theirBJ) {
                return Result.LOSE;
            } else {
                return Result.TIE;
            }
        }
    }
}

class Dealer extends Hand {
    public handSumUp: HandSum;

    constructor(cards: Array<Card>) {
        super(cards);
        this.handSumUp = HandSum.fromCards(this.cards.filter(card => !card.down));
    }

    static deal(): Dealer {
        return new Dealer([Card.fromRandom(), Card.fromRandom(true)]);
    }

    toString(): string {
        return `**${this.blackjack() && !this.cards.some(card => card.down) ? "BJ" : this.handSumUp}${this.cards.some(card => card.down) ? "+" : ""}** ${this.cards.map(card => `\`${card}\``).join(" ")}`;
    }

    hit(card?: Card): Card {
        card = super.hit(card);
        if (!card.down) {
            this.handSumUp.hit(card);
        }
        return card;
    }

    reveal(): Card {
        this.cards[1].down = false;
        this.handSumUp.hit(this.cards[1]);
        return this.cards[1];
    }
}

class Blackjack {
    public player: Hand;
    public dealer: Dealer;
    public prompt: Discord.Message;

    constructor(
        public channel: Discord.Message["channel"],
        public user: Discord.User,
    ) {}

    async display(description: string = "**h** to hit, **s** to stand"): Promise<void> {
        this.prompt = await this.channel.send(new Discord.MessageEmbed({
            color: config.colors.info,
            title: "Blackjack",
            description,
            fields: [
                { name: "Dealer", value: `${this.dealer}` },
                { name: "You", value: `${this.player}` },
            ],
            footer: { text: "See the full rules with `rules blackjack`" },
        }));
    }

    async playerMove(): Promise<Move> {
        return await new Promise<Move>(resolve => {
            const collector = this.channel.createMessageCollector(m => {
                if (m.author.id !== this.user.id) return false;
                const move = getMove(m.content.trim().toLowerCase());
                if (move === Move.INVALID) return false;
                resolve(move);
                return true;
            }, { time: Time.MINUTE / Time.MILLI, max: 1 });

            collector.once("end", async (_, reason) => {
                if (reason === "limit") return;
                await this.prompt.edit({ content: "Ended due to inactivity." });
            });
        });
    }

    async dealerMove(): Promise<Move> {
        await sleep(Time.SECOND / Time.MILLI);
        const { sum, soft } = this.dealer.handSum;
        if (sum < 17 || sum === 17 && soft) {
            return Move.HIT;
        } else {
            return Move.STAND;
        }
    }

    async runGame(): Promise<void> {
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
        player:
        while (true) {
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
        dealer:
        while (true) {
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
    desc:
`Starts a game of Blackjack.`,
    usage:
``,
    execute: async message => {
        const game = new Blackjack(message.channel, message.author);
        await game.runGame();
    },
});
