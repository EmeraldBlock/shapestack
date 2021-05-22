import Discord from "discord.js";

import { Command } from "../index.js";
import { randInt, range, safeDelete, sleep, trimNewlines } from "../utils.js";
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
    public done: boolean = false;

    constructor(
        public cards: Array<Card>,
    ) {
        this.handSum = HandSum.fromCards(this.cards);
    }

    static deal(): Hand {
        return new Hand([Card.fromRandom(), Card.fromRandom()]);
    }

    toString(): string {
        return `**${this.bust() ? "BUST" : this.blackjack() ? "BLACKJACK" : this.handSum}** ${this.getCardsAsString()}`;
    }

    getCardsAsString(): string {
        return this.cards.map(card => `\`${card}\``).join(" ");
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
    public hidden: boolean = true;

    constructor(cards: Array<Card>) {
        super(cards);
    }

    static deal(): Dealer {
        return new Dealer([Card.fromRandom(), Card.fromRandom(true)]);
    }

    toString(): string {
        if (this.hidden) {
            const card = this.cards[0];
            return `**${card.rank === Rank.ACE ? `${11}s` : `${this.cards[0].value()}h`}+** ${this.getCardsAsString()}`;
        }
        return super.toString();
    }

    reveal(): Card {
        this.hidden = false;
        this.cards[1].down = false;
        return this.cards[1];
    }
}

class Player {
    constructor(
        public hands: Array<Hand>,
        public user: Discord.User,
        public game: Blackjack,
    ) {}

    static deal(user: Discord.User, game: Blackjack): Player {
        return new Player([Hand.deal()], user, game);
    }

    async move(): Promise<Move> {
        return await new Promise<Move>(resolve => {
            const collector = this.game.channel.createMessageCollector(m => {
                if (m.author.id !== this.user.id) return false;
                const move = getMove(m.content.trim().toLowerCase());
                if (move === Move.INVALID) return false;
                if (m.guild?.me?.permissionsIn(m.channel).has("MANAGE_MESSAGES") ?? false) {
                    void safeDelete(m).then(() => resolve(move));
                } else {
                    resolve(move);
                }
                return true;
            }, { time: Time.MINUTE / Time.MILLI, max: 1 });

            collector.once("end", async (_, reason) => {
                if (reason === "limit") return;
                await this.game.prompt?.edit({ content: "Ended due to inactivity." });
            });
        });
    }
}

class Blackjack {
    public players: Array<Player>;
    public dealer: Dealer;
    public prompt: Discord.Message | undefined;
    public currentHand: Hand | undefined;

    constructor(
        public channel: Discord.Message["channel"],
        public users: Array<Discord.User>,
    ) {}

    getHandIcon(hand: Hand): string {
        if (hand === this.currentHand) {
            return "\\➡️";
        } else if (hand.bust()) {
            return "\\💥";
        } else if (hand.done) {
            return "\\🔒";
        } else {
            return "\\⬛";
        }
    }

    getEmbed(description: string = "**h** to hit, **s** to stand"): Discord.MessageEmbed {
        const playerFields = this.players.map(player => ({
            name: player.user.tag,
            value: player.hands.map(hand => `${this.getHandIcon(hand)} ${hand}`).join("\n"),
        }));
        return new Discord.MessageEmbed({
            color: config.colors.info,
            title: "Blackjack",
            description,
            fields: [
                { name: "Dealer", value: `${this.getHandIcon(this.dealer)} ${this.dealer}` },
                ...playerFields,
            ],
            footer: { text: "See the full rules with `rules blackjack`" },
        });
    }

    async display(description?: string): Promise<void> {
        if (this.prompt === undefined || this.prompt.deleted) {
            this.prompt = await this.channel.send(this.getEmbed(description));
        } else {
            await this.prompt.edit(this.getEmbed(description));
        }
    }

    async dealerMove(): Promise<Move> {
        await sleep(1.5 * Time.SECOND / Time.MILLI);
        const { sum, soft } = this.dealer.handSum;
        if (sum < 17 || sum === 17 && soft) {
            return Move.HIT;
        } else {
            return Move.STAND;
        }
    }

    async runGame(): Promise<void> {
        this.players = this.users.map(user => Player.deal(user, this));
        this.dealer = Dealer.deal();

        if (this.dealer.handSum.sum === BLACKJACK) {
            this.dealer.reveal();
            await this.display(trimNewlines(`
**DEALER BLACKJACK**
${this.players[0].hands[0].handSum.sum === BLACKJACK ? "\\🟨 You tied!" : "\\🟥 You lost!"}
            `));
            return;
        }

        for (const player of this.players) {
            this.currentHand = player.hands[0];
            await this.display();
            player:
            while (true) {
                const move = await player.move();
                switch (move) {
                case Move.HIT: {
                    if (player.hands[0].handSum.sum === BLACKJACK) {
                        await this.display("You can't hit, you've got the best sum!");
                        break;
                    }
                    const card = player.hands[0].hit();
                    if (player.hands[0].bust()) {
                        await this.display(trimNewlines(`
    You draw \`${card}\` and **BUST**
    \\🟥 You lost!
                        `));
                        break player;
                    }
                    await this.display(`You draw \`${card}\``);
                    break;
                }
                case Move.STAND: {
                    break player;
                }
                }
            }
            player.hands[0].done = true;
        }

        this.currentHand = this.dealer;
        await this.display(`Dealer's other card was \`${this.dealer.reveal()}\``);
        dealer:
        while (true) {
            const move = await this.dealerMove();
            switch (move) {
            case Move.HIT: {
                const card = this.dealer.hit();
                if (this.dealer.handSum.sum > BLACKJACK) {
                    this.dealer.done = true;
                    this.currentHand = undefined;
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
        this.dealer.done = true;
        this.currentHand = undefined;

        switch (this.players[0].hands[0].compare(this.dealer)) {
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
        const game = new Blackjack(message.channel, [message.author, ...message.mentions.users.array()]);
        await game.runGame();
    },
});
