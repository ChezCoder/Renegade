import Scene, { DrawOptions } from "./Scene";

export type WeightMap = {[key: string]: number};

export interface SimpleVector2 {
    x: number
    y: number
}

export interface SimpleForce {
    magnitude: number
    radians: number
}

/**
 * Class representing an x and y value in euclidean geometry
 * 
 * Converting to a force will use it's x and y vectors as the force's x and y vectors
 */
export class Vector2 {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public distanceTo(vector: Vector2): number {
        return Math.sqrt(((this.x - vector.x) ** 2) + ((this.y - vector.y) ** 2));
    }

    public toForce(fromVector: Vector2 = Vector2.ORIGIN): Force {
        return new Force(Math.atan2(this.y - fromVector.y, this.x - fromVector.x), this.distanceTo(fromVector));
    }

    public add(vector: Vector2): void {
        this.x += vector.x;
        this.y += vector.y;
    }

    public addForce(force: Force): void {
        this.add(force.toVector());
    }

    public static difference(from: Vector2, to: Vector2): Vector2 {
        return new Vector2(to.x - from.x, to.y - from.y);
    }

    public static dot(vector1: Vector2, vector2: Vector2): Vector2 {
        return new Vector2(vector1.x * vector2.x, vector1.y * vector2.y);
    }

    public clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    public simplify(): SimpleVector2 {
        return {
            x: this.x,
            y: this.y
        }
    }

    public static get ORIGIN(): Vector2 {
        return new Vector2(0, 0);
    }

    public static add(vector1: Vector2, vector2: Vector2): Vector2 {
        return new Vector2(vector1.x + vector2.x, vector1.y + vector2.y);
    }

    public equals(other: Vector2) {
        return this.x == other.x && this.y == other.y;
    }
}

/**
 * Class representing a force with magnitude and radians.
 * 
 * Manipulate individual x and y vectors with Force#setVectors()
 */
export class Force {
    public radians: number;
    public magnitude: number;

    constructor(radians: number, magnitude: number) {
        this.radians = radians;
        this.magnitude = magnitude;
    }

    public toVector(): Vector2 {
        return new Vector2(Math.cos(this.radians) * this.magnitude, Math.sin(this.radians) * this.magnitude);
    }

    public setVectors(vectors: SimpleVector2) {
        const force = new Vector2(vectors.x, vectors.y).toForce(Vector2.ORIGIN);
        this.magnitude = force.magnitude;
        this.radians = force.radians;
    }

    public clone(): Force {
        return new Force(this.radians, this.magnitude);
    }

    public add(force: Force): void {
        const resultant = Vector2.add(this.toVector(), force.toVector()).toForce(Vector2.ORIGIN);
        this.radians = resultant.radians;
        this.magnitude = resultant.magnitude;
    }

    public simplify(): SimpleForce {
        return {
            magnitude: this.magnitude,
            radians: this.radians
        }
    }

    get degrees(): number {
        return Angle.toDegrees(this.radians);
    }

    set degrees(degrees: number) {
        this.radians = Angle.toRadians(degrees);
    }

    public equals(other: Force) {
        return this.radians == other.radians && this.magnitude == other.magnitude;
    }

    public static add(force1: Force, force2: Force): Force {
        return Vector2.add(force1.toVector(), force2.toVector()).toForce(Vector2.ORIGIN);
    }
}

/**
 * Utility class for converting between radians (0 - 2π) and degrees (0 - 360).
 * 
 * Values are unclamped
 */
export namespace Angle {
    export function toRadians(degrees: number) {
        return degrees * (Math.PI / 180);
    }

    export function toDegrees(radians: number) {
        return radians * (180 / Math.PI);
    }
}

export namespace Random {
    export function random(min: number = 0, max: number = 100) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    export function weightedRandom(weightMap: WeightMap): string {
        let dcWeightMap: WeightMap = {};
        Object.assign(dcWeightMap, weightMap);
    
        let sum = 0;
        let random = Math.random();
    
        for (let i in dcWeightMap) {
            sum += dcWeightMap[i];
    
            if (random <= sum)
                return i;
        }
    
        return Object.keys(dcWeightMap).filter(item => dcWeightMap[item] == (Math.max(...Object.values(dcWeightMap))))[0];
    }
    
    export function sample<T>(array: T[], amount: number = 1): T[] {
        return array.sort(() => 0.5 - Math.random()).slice(0, amount);
    }
}

export namespace TextHelper {
    export function measureTextMetrics(ctx: CanvasRenderingContext2D, text: string, font: string): TextMetrics {
        const oldFont = ctx.font;
        ctx.font = font;
        const textm = ctx.measureText(text);
        ctx.font = oldFont;
        return textm;
    }
    
    export function measureTextHeight(ctx: CanvasRenderingContext2D, text: string, font: string): number {
        const metrics = measureTextMetrics(ctx, text, font);
        return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }
    
    export function measureTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string): number {
        return measureTextMetrics(ctx, text, font).width;
    }

    export function writeCenteredTextAt(scene: Scene, text: string, options: Partial<DrawOptions>, font: string = scene.app.zoom * 30 + "px Arial") {
        const width = measureTextWidth(scene.app.ctx, text, font);
        const height = measureTextHeight(scene.app.ctx, text, font);

        options.draw = (ctx: CanvasRenderingContext2D) => {
            ctx.font = font;
            if (options.strokeStyle) ctx.strokeText(text, -width / 2, height / 2);
            if (options.fillStyle) ctx.fillText(text, -width / 2, height / 2);
        };

        scene.draw(options as DrawOptions);
    }
}

export namespace Utils {
    export function rbgToHex(red: number, blue: number, green: number): string {
        return `#${prefixSpacing(red.toString(16), "0", 2)}${prefixSpacing(blue.toString(16), "0", 2)}${prefixSpacing(green.toString(16), "0", 2)}`;
    }

    export function rbgaToHex(red: number, blue: number, green: number, alpha: number): string {
        return `#${prefixSpacing(red.toString(16), "0", 2)}${prefixSpacing(blue.toString(16), "0", 2)}${prefixSpacing(green.toString(16), "0", 2)}${prefixSpacing((Math.round(255 * alpha)).toString(16), "0", 2)}`;
    }

    export function clamp(n: number, min: number = 0, max: number = 1): number {
        return Math.max(min, Math.min(n, max));
    }

    export function wrapClamp(n: number, min: number = 0, max: number = 1): number {
        const clamped = clamp(n, min, max);
        min--;
        max++;

        if (clamped === n) {
            return clamped;
        } else {
            const difference = clamped - n;
            if (difference < 0)
                return wrapClamp(min - difference, min, max);
            return wrapClamp(max - difference, min, max);
        }
    }

    export function prefixSpacing(text: string, prefix: string, length: number): string {
        if (text.length >= length) return text;
        return prefix.repeat(length - text.length) + text;
    }

    export function suffixSpacing(text: string, suffix: string, length: number): string {
        if (text.length >= length) return text;
        return text + suffix.repeat(length - text.length);
    }

    export function between(n: number, min: number, max: number): boolean {
        return n >= min && n <= max;
    }

    export function normalize(n: number, max: number = 1, min: number = 0): number {
        return (n - min) / (max - min);
    }

    export function isPositionOnLine(pos: Vector2, linePos1: Vector2, linePos2: Vector2, fault: number = 1): boolean {
        const posFromLinePoints = pos.distanceTo(linePos1) + pos.distanceTo(linePos2);
        const lineLength = linePos1.distanceTo(linePos2);
        return between(posFromLinePoints, lineLength - fault, lineLength + fault);
    }
    
    export function isLineIntersectingLine(lp1: Vector2, lp2: Vector2, lp3: Vector2, lp4: Vector2): boolean {
        let a = lp1.x,
            b = lp1.y,
            c = lp2.x,
            d = lp2.y,
            p = lp3.x,
            q = lp3.y,
            r = lp4.x,
            s = lp4.y;
    
        var det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) {
            return false;
        } else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    
    }

    export function isPointInRectangle(point: Vector2, rectPos: Vector2, width: number, height: number): boolean {
        return between(point.x, rectPos.x, rectPos.x + width) && between(point.y, rectPos.y, rectPos.y + height);
    }
    
    export function isPointInPolygon(point: Vector2, polygon: Vector2[], globalWidth: number, globalHeight: number): boolean {
        let xIntersections = 0;
        let yIntersections = 0;
        let testLineX = [point, new Vector2(globalWidth, point.y)];
        let testLineY = [point, new Vector2(point.x, globalHeight)];
    
        polygon.forEach((position, posi) => {
            if (posi == (polygon.length - 1)) return;
            
            if (isLineIntersectingLine(testLineX[0], testLineX[1], position, polygon[posi + 1]))
                xIntersections++;
            
            if (isLineIntersectingLine(testLineY[0], testLineY[1], position, polygon[posi + 1]))
                yIntersections++;
        });
    
        return (xIntersections % 2 === 1) && (yIntersections % 2 === 1);
    }
    
    export function isPointInCircle(point: Vector2, circle: Vector2, radius: number) {
        if (radius === 0) return false;
        var dx = circle.x - point.x;
        var dy = circle.y - point.y;
        return dx * dx + dy * dy <= radius;
    }

    export function isLineInCircle(lineSegment: [Vector2, Vector2], circle: Vector2, radius: number) {
        let t: Vector2 = new Vector2(0, 0);
        let nearest: Vector2 = new Vector2(0, 0);
    
        if (isPointInCircle(lineSegment[0], circle, radius) || isPointInCircle(lineSegment[1], circle, radius)) {
            return true
        }
    
        let x1 = lineSegment[0].x,
            y1 = lineSegment[0].y,
            x2 = lineSegment[1].x,
            y2 = lineSegment[1].y,
            cx = circle.x,
            cy = circle.y
    
        let dx = x2 - x1;
        let dy = y2 - y1;
        let lcx = cx - x1;
        let lcy = cy - y1;
        let dLen2 = dx * dx + dy * dy;
        let px = dx;
        let py = dy;
    
        if (dLen2 > 0) {
            let dp = (lcx * dx + lcy * dy) / dLen2;
            px *= dp;
            py *= dp;
        }
    
        if (!nearest) nearest = t;
        nearest.x = x1 + px;
        nearest.y = y1 + py;
    
        let pLen2 = px * px + py * py;
        return isPointInCircle(nearest, circle, radius) && pLen2 <= dLen2 && (px * dx + py * dy) >= 0;
    }
    
    export function setMouseCursor(cursorSource: string = "default") {
        document.body.style.cursor = cursorSource || "default";
    }
    
    export function safeDivide(x: number, y: number): number {
        return isFinite(x / y) ? x / y : 0;
    }
}

export namespace LerpUtils {
    export type LerpFunction = (x: number) => number;

    export class Lerper {
        private readonly from: number;
        private readonly to: number;
        private readonly duration: number;
        public startTime: number;
        public clamped: boolean;
        public lerpFunction: LerpFunction = Functions.Linear;

        constructor(from: number, to: number, duration: number, clamped: boolean = true) {
            this.from = from;
            this.to = to;
            this.duration = duration;
            this.clamped = clamped;
            this.startTime = Date.now();
        }

        public value(currentTime: number = Date.now()): number {
            if (this.clamped)
                return LerpUtils.lerp(this.from, this.to, this.lerpFunction(Utils.clamp((currentTime - this.startTime) / this.duration)));
            else
                return LerpUtils.lerp(this.from, this.to, this.lerpFunction((currentTime - this.startTime) / this.duration));
        }

        public reset() {
            this.startTime = Date.now();
        }

        public get done() {
            return (this.startTime + this.duration) < Date.now();
        }
    }

    export function lerp(from: number, to: number, rate: number) {
        return from + (to - from) * rate;
    }

    export namespace Functions {
        export const Linear: LerpFunction = x => x;
        export const Reverse: LerpFunction = x => 1 - x;
        export const EaseIn: LerpFunction = x => x * x;
        export const EaseOut: LerpFunction = x => EaseIn(Reverse(x));
        export const EaseInOut: LerpFunction = x => LerpUtils.lerp(EaseIn(x), EaseOut(x), x);
        export const Spike: LerpFunction = x => x <= 0.5 ? EaseIn(x / 0.5) : EaseIn(Reverse(x) / 0.5);
    }
}

export namespace Color {
    export namespace Enum {
        export const ABBEY: "#4c4f56" = "#4c4f56";
		export const ABSOLUTE_ZERO: "#0048ba" = "#0048ba";
		export const ACADIA: "#1b1404" = "#1b1404";
		export const ACAPULCO: "#7cb0a1" = "#7cb0a1";
		export const ACID_GREEN: "#b0bf1a" = "#b0bf1a";
		export const AERO: "#7cb9e8" = "#7cb9e8";
		export const AERO_BLUE: "#c9ffe5" = "#c9ffe5";
		export const AFFAIR: "#714693" = "#714693";
		export const AFRICAN_VIOLET: "#b284be" = "#b284be";
		export const AIR_FORCE_BLUE: "#00308f" = "#00308f";
		export const AIR_SUPERIORITY_BLUE: "#72a0c1" = "#72a0c1";
		export const AKAROA: "#d4c4a8" = "#d4c4a8";
		export const ALABAMA_CRIMSON: "#af002a" = "#af002a";
		export const ALABASTER: "#fafafa" = "#fafafa";
		export const ALBESCENT_WHITE: "#f5e9d3" = "#f5e9d3";
		export const ALGAE_GREEN: "#93dfb8" = "#93dfb8";
		export const ALICE_BLUE: "#f0f8ff" = "#f0f8ff";
		export const ALIEN_ARMPIT: "#84de02" = "#84de02";
		export const ALIZARIN_CRIMSON: "#e32636" = "#e32636";
		export const ALLOY_ORANGE: "#c46210" = "#c46210";
		export const ALLPORTS: "#0076a3" = "#0076a3";
		export const ALMOND: "#efdecd" = "#efdecd";
		export const ALMOND_FROST: "#907b71" = "#907b71";
		export const ALPINE: "#af8f2c" = "#af8f2c";
		export const ALTO: "#dbdbdb" = "#dbdbdb";
		export const ALUMINIUM: "#a9acb6" = "#a9acb6";
		export const AMARANTH: "#e52b50" = "#e52b50";
		export const AMARANTH_PINK: "#f19cbb" = "#f19cbb";
		export const AMARANTH_PURPLE: "#ab274f" = "#ab274f";
		export const AMARANTH_RED: "#d3212d" = "#d3212d";
		export const AMAZON: "#3b7a57" = "#3b7a57";
		export const AMBER: "#ffbf00" = "#ffbf00";
		export const AMERICAN_ROSE: "#ff033e" = "#ff033e";
		export const AMERICANO: "#87756e" = "#87756e";
		export const AMETHYST: "#9966cc" = "#9966cc";
		export const AMETHYST_SMOKE: "#a397b4" = "#a397b4";
		export const AMOUR: "#f9eaf3" = "#f9eaf3";
		export const AMULET: "#7b9f80" = "#7b9f80";
		export const ANAKIWA: "#9de5ff" = "#9de5ff";
		export const ANDROID_GREEN: "#a4c639" = "#a4c639";
		export const ANTI_FLASH_WHITE: "#f2f3f4" = "#f2f3f4";
		export const ANTIQUE_BRASS: "#cd9575" = "#cd9575";
		export const ANTIQUE_BRONZE: "#665d1e" = "#665d1e";
		export const ANTIQUE_FUCHSIA: "#915c83" = "#915c83";
		export const ANTIQUE_RUBY: "#841b2d" = "#841b2d";
		export const ANTIQUE_WHITE: "#faebd7" = "#faebd7";
		export const ANZAC: "#e0b646" = "#e0b646";
		export const AO: "#008000" = "#008000";
		export const APACHE: "#dfbe6f" = "#dfbe6f";
		export const APPLE: "#4fa83d" = "#4fa83d";
		export const APPLE_BLOSSOM: "#af4d43" = "#af4d43";
		export const APPLE_GREEN: "#8db600" = "#8db600";
		export const APRICOT: "#fbceb1" = "#fbceb1";
		export const APRICOT_WHITE: "#fffeec" = "#fffeec";
		export const AQUA_DEEP: "#014b43" = "#014b43";
		export const AQUA_FOREST: "#5fa777" = "#5fa777";
		export const AQUA_HAZE: "#edf5f5" = "#edf5f5";
		export const AQUA_ISLAND: "#a1dad7" = "#a1dad7";
		export const AQUA_SPRING: "#eaf9f5" = "#eaf9f5";
		export const AQUA_SQUEEZE: "#e8f5f2" = "#e8f5f2";
		export const AQUAMARINE: "#7fffd4" = "#7fffd4";
		export const AQUAMARINE_BLUE: "#71d9e2" = "#71d9e2";
		export const ARAPAWA: "#110c6c" = "#110c6c";
		export const ARCTIC_LIME: "#d0ff14" = "#d0ff14";
		export const ARMADILLO: "#433e37" = "#433e37";
		export const ARMY_GREEN: "#4b5320" = "#4b5320";
		export const ARROWTOWN: "#948771" = "#948771";
		export const ARSENIC: "#3b444b" = "#3b444b";
		export const ARTICHOKE: "#8f9779" = "#8f9779";
		export const ARYLIDE_YELLOW: "#e9d66b" = "#e9d66b";
		export const ASH: "#c6c3b5" = "#c6c3b5";
		export const ASH_GREY: "#b2beb5" = "#b2beb5";
		export const ASPARAGUS: "#87a96b" = "#87a96b";
		export const ASPHALT: "#130a06" = "#130a06";
		export const ASTRA: "#faeab9" = "#faeab9";
		export const ASTRAL: "#327da0" = "#327da0";
		export const ASTRONAUT: "#283a77" = "#283a77";
		export const ASTRONAUT_BLUE: "#013e62" = "#013e62";
		export const ATHENS_GRAY: "#eef0f3" = "#eef0f3";
		export const ATHS_SPECIAL: "#ecebce" = "#ecebce";
		export const ATLANTIS: "#97cd2d" = "#97cd2d";
		export const ATOLL: "#0a6f75" = "#0a6f75";
		export const AU_CHICO: "#97605d" = "#97605d";
		export const AUBERGINE: "#3b0910" = "#3b0910";
		export const AUBURN: "#a52a2a" = "#a52a2a";
		export const AUREOLIN: "#fdee00" = "#fdee00";
		export const AURO_METAL_SAURUS: "#6e7f80" = "#6e7f80";
		export const AUSTRALIAN_MINT: "#f5ffbe" = "#f5ffbe";
		export const AVOCADO: "#568203" = "#568203";
		export const AXOLOTL: "#4e6649" = "#4e6649";
		export const AZALEA: "#f7c8da" = "#f7c8da";
		export const AZTEC: "#0d1c19" = "#0d1c19";
		export const AZTEC_GOLD: "#c39953" = "#c39953";
		export const AZURE: "#007fff" = "#007fff";
		export const AZURE_MIST: "#f0ffff" = "#f0ffff";
		export const AZUREISH_WHITE: "#dbe9f4" = "#dbe9f4";
		export const BABY_BLUE: "#89cff0" = "#89cff0";
		export const BABY_BLUE_EYES: "#a1caf1" = "#a1caf1";
		export const BABY_POWDER: "#fefefa" = "#fefefa";
		export const BAHAMA_BLUE: "#026395" = "#026395";
		export const BAHIA: "#a5cb0c" = "#a5cb0c";
		export const BAJA_WHITE: "#fff8d1" = "#fff8d1";
		export const BAKER_MILLER_PINK: "#ff91af" = "#ff91af";
		export const BALI_HAI: "#859faf" = "#859faf";
		export const BALL_BLUE: "#21abcd" = "#21abcd";
		export const BALTIC_SEA: "#2a2630" = "#2a2630";
		export const BAMBOO: "#da6304" = "#da6304";
		export const BANANA_MANIA: "#fae7b5" = "#fae7b5";
		export const BANANA_YELLOW: "#ffe135" = "#ffe135";
		export const BANDICOOT: "#858470" = "#858470";
		export const BARBERRY: "#ded717" = "#ded717";
		export const BARBIE_PINK: "#e0218a" = "#e0218a";
		export const BARLEY_CORN: "#a68b5b" = "#a68b5b";
		export const BARLEY_WHITE: "#fff4ce" = "#fff4ce";
		export const BARN_RED: "#7c0a02" = "#7c0a02";
		export const BAROSSA: "#44012d" = "#44012d";
		export const BASTILLE: "#292130" = "#292130";
		export const BATTLESHIP_GRAY: "#828f72" = "#828f72";
		export const BAY_LEAF: "#7da98d" = "#7da98d";
		export const BAY_OF_MANY: "#273a81" = "#273a81";
		export const BAZAAR: "#98777b" = "#98777b";
		export const BDAZZLED_BLUE: "#2e5894" = "#2e5894";
		export const BEAU_BLUE: "#bcd4e6" = "#bcd4e6";
		export const BEAUTY_BUSH: "#eec1be" = "#eec1be";
		export const BEAVER: "#9f8170" = "#9f8170";
		export const BEESWAX: "#fef2c7" = "#fef2c7";
		export const BEIGE: "#f5f5dc" = "#f5f5dc";
		export const BELGION: "#add8ff" = "#add8ff";
		export const BERMUDA: "#7dd8c6" = "#7dd8c6";
		export const BERMUDA_GRAY: "#6b8ba2" = "#6b8ba2";
		export const BERYL_GREEN: "#dee5c0" = "#dee5c0";
		export const BIANCA: "#fcfbf3" = "#fcfbf3";
		export const BIG_DIP_ORUBY: "#9c2542" = "#9c2542";
		export const BIG_FOOT_FEET: "#e88e5a" = "#e88e5a";
		export const BIG_STONE: "#162a40" = "#162a40";
		export const BILBAO: "#327c14" = "#327c14";
		export const BILOBA_FLOWER: "#b2a1ea" = "#b2a1ea";
		export const BIRCH: "#373021" = "#373021";
		export const BIRD_FLOWER: "#d4cd16" = "#d4cd16";
		export const BISCAY: "#1b3162" = "#1b3162";
		export const BISMARK: "#497183" = "#497183";
		export const BISON_HIDE: "#c1b7a4" = "#c1b7a4";
		export const BISQUE: "#ffe4c4" = "#ffe4c4";
		export const BISTRE: "#3d2b1f" = "#3d2b1f";
		export const BITTER: "#868974" = "#868974";
		export const BITTER_LEMON: "#cae00d" = "#cae00d";
		export const BITTERSWEET: "#fe6f5e" = "#fe6f5e";
		export const BITTERSWEET_SHIMMER: "#bf4f51" = "#bf4f51";
		export const BIZARRE: "#eededa" = "#eededa";
		export const BLACK: "#000000" = "#000000";
		export const BLACK_BEAN: "#3d0c02" = "#3d0c02";
		export const BLACK_CORAL: "#54626f" = "#54626f";
		export const BLACK_FOREST: "#0b1304" = "#0b1304";
		export const BLACK_HAZE: "#f6f7f7" = "#f6f7f7";
		export const BLACK_LEATHER_JACKET: "#253529" = "#253529";
		export const BLACK_MARLIN: "#3e2c1c" = "#3e2c1c";
		export const BLACK_OLIVE: "#3b3c36" = "#3b3c36";
		export const BLACK_PEARL: "#041322" = "#041322";
		export const BLACK_ROCK: "#0d0332" = "#0d0332";
		export const BLACK_ROSE: "#67032d" = "#67032d";
		export const BLACK_RUSSIAN: "#0a001c" = "#0a001c";
		export const BLACK_SHADOWS: "#bfafb2" = "#bfafb2";
		export const BLACK_SQUEEZE: "#f2fafa" = "#f2fafa";
		export const BLACK_WHITE: "#fffef6" = "#fffef6";
		export const BLACKBERRY: "#4d0135" = "#4d0135";
		export const BLACKCURRANT: "#32293a" = "#32293a";
		export const BLANCHED_ALMOND: "#ffebcd" = "#ffebcd";
		export const BLAST_OFF_BRONZE: "#a57164" = "#a57164";
		export const BLAZE_ORANGE: "#ff6700" = "#ff6700";
		export const BLEACH_WHITE: "#fef3d8" = "#fef3d8";
		export const BLEACHED_CEDAR: "#2c2133" = "#2c2133";
		export const BLEU_DE_FRANCE: "#318ce7" = "#318ce7";
		export const BLIZZARD_BLUE: "#a3e3ed" = "#a3e3ed";
		export const BLOND: "#faf0be" = "#faf0be";
		export const BLOSSOM: "#dcb4bc" = "#dcb4bc";
		export const BLUE: "#0000ff" = "#0000ff";
		export const BLUE_BAYOUX: "#496679" = "#496679";
		export const BLUE_BELL: "#a2a2d0" = "#a2a2d0";
		export const BLUE_CHALK: "#f1e9ff" = "#f1e9ff";
		export const BLUE_CHARCOAL: "#010d1a" = "#010d1a";
		export const BLUE_CHILL: "#0c8990" = "#0c8990";
		export const BLUE_DIAMOND: "#380474" = "#380474";
		export const BLUE_DIANNE: "#204852" = "#204852";
		export const BLUE_GEM: "#2c0e8c" = "#2c0e8c";
		export const BLUE_GRAY: "#6699cc" = "#6699cc";
		export const BLUE_GREEN: "#0d98ba" = "#0d98ba";
		export const BLUE_HAZE: "#bfbed8" = "#bfbed8";
		export const BLUE_JEANS: "#5dadec" = "#5dadec";
		export const BLUE_LAGOON: "#ace5ee" = "#ace5ee";
		export const BLUE_MAGENTA_VIOLET: "#553592" = "#553592";
		export const BLUE_MARGUERITE: "#7666c6" = "#7666c6";
		export const BLUE_RIBBON: "#0066ff" = "#0066ff";
		export const BLUE_ROMANCE: "#d2f6de" = "#d2f6de";
		export const BLUE_SAPPHIRE: "#126180" = "#126180";
		export const BLUE_SMOKE: "#748881" = "#748881";
		export const BLUE_STONE: "#016162" = "#016162";
		export const BLUE_VIOLET: "#8a2be2" = "#8a2be2";
		export const BLUE_WHALE: "#042e4c" = "#042e4c";
		export const BLUE_YONDER: "#5072a7" = "#5072a7";
		export const BLUE_ZODIAC: "#13264d" = "#13264d";
		export const BLUEBERRY: "#4f86f7" = "#4f86f7";
		export const BLUEBONNET: "#1c1cf0" = "#1c1cf0";
		export const BLUMINE: "#18587a" = "#18587a";
		export const BLUSH: "#de5d83" = "#de5d83";
		export const BOLE: "#79443b" = "#79443b";
		export const BOMBAY: "#afb1b8" = "#afb1b8";
		export const BON_JOUR: "#e5e0e1" = "#e5e0e1";
		export const BONDI_BLUE: "#0095b6" = "#0095b6";
		export const BONE: "#e3dac9" = "#e3dac9";
		export const BOOGER_BUSTER: "#dde26a" = "#dde26a";
		export const BORDEAUX: "#5c0120" = "#5c0120";
		export const BOSSANOVA: "#4e2a5a" = "#4e2a5a";
		export const BOSTON_BLUE: "#3b91b4" = "#3b91b4";
		export const BOSTON_UNIVERSITY_RED: "#cc0000" = "#cc0000";
		export const BOTTICELLI: "#c7dde5" = "#c7dde5";
		export const BOTTLE_GREEN: "#006a4e" = "#006a4e";
		export const BOULDER: "#7a7a7a" = "#7a7a7a";
		export const BOUQUET: "#ae809e" = "#ae809e";
		export const BOURBON: "#ba6f1e" = "#ba6f1e";
		export const BOYSENBERRY: "#873260" = "#873260";
		export const BRACKEN: "#4a2a04" = "#4a2a04";
		export const BRANDEIS_BLUE: "#0070ff" = "#0070ff";
		export const BRANDY: "#dec196" = "#dec196";
		export const BRANDY_PUNCH: "#cd8429" = "#cd8429";
		export const BRANDY_ROSE: "#bb8983" = "#bb8983";
		export const BRASS: "#b5a642" = "#b5a642";
		export const BREAKER_BAY: "#5da19f" = "#5da19f";
		export const BRICK_RED: "#cb4154" = "#cb4154";
		export const BRIDAL_HEATH: "#fffaf4" = "#fffaf4";
		export const BRIDESMAID: "#fef0ec" = "#fef0ec";
		export const BRIGHT_CERULEAN: "#1dacd6" = "#1dacd6";
		export const BRIGHT_GRAY: "#3c4151" = "#3c4151";
		export const BRIGHT_GREEN: "#66ff00" = "#66ff00";
		export const BRIGHT_LAVENDER: "#bf94e4" = "#bf94e4";
		export const BRIGHT_LILAC: "#d891ef" = "#d891ef";
		export const BRIGHT_MAROON: "#c32148" = "#c32148";
		export const BRIGHT_NAVY_BLUE: "#1974d2" = "#1974d2";
		export const BRIGHT_RED: "#b10000" = "#b10000";
		export const BRIGHT_SUN: "#fed33c" = "#fed33c";
		export const BRIGHT_TURQUOISE: "#08e8de" = "#08e8de";
		export const BRIGHT_UBE: "#d19fe8" = "#d19fe8";
		export const BRIGHT_YELLOW: "#ffaa1d" = "#ffaa1d";
		export const BRILLIANT_AZURE: "#3399ff" = "#3399ff";
		export const BRILLIANT_LAVENDER: "#f4bbff" = "#f4bbff";
		export const BRILLIANT_ROSE: "#ff55a3" = "#ff55a3";
		export const BRINK_PINK: "#fb607f" = "#fb607f";
		export const BRITISH_RACING_GREEN: "#004225" = "#004225";
		export const BRONCO: "#aba196" = "#aba196";
		export const BRONZE: "#cd7f32" = "#cd7f32";
		export const BRONZE_OLIVE: "#4e420c" = "#4e420c";
		export const BRONZE_YELLOW: "#737000" = "#737000";
		export const BRONZETONE: "#4d400f" = "#4d400f";
		export const BROOM: "#ffec13" = "#ffec13";
		export const BROWN: "#964b00" = "#964b00";
		export const BROWN_BRAMBLE: "#592804" = "#592804";
		export const BROWN_DERBY: "#492615" = "#492615";
		export const BROWN_POD: "#401801" = "#401801";
		export const BROWN_RUST: "#af593e" = "#af593e";
		export const BROWN_SUGAR: "#af6e4d" = "#af6e4d";
		export const BROWN_TUMBLEWEED: "#37290e" = "#37290e";
		export const BROWN_YELLOW: "#cc9966" = "#cc9966";
		export const BRUNSWICK_GREEN: "#1b4d3e" = "#1b4d3e";
		export const BUBBLE_GUM: "#ffc1cc" = "#ffc1cc";
		export const BUBBLES: "#e7feff" = "#e7feff";
		export const BUCCANEER: "#622f30" = "#622f30";
		export const BUD: "#a8ae9c" = "#a8ae9c";
		export const BUD_GREEN: "#7bb661" = "#7bb661";
		export const BUDDHA_GOLD: "#c1a004" = "#c1a004";
		export const BUFF: "#f0dc82" = "#f0dc82";
		export const BULGARIAN_ROSE: "#480607" = "#480607";
		export const BULL_SHOT: "#864d1e" = "#864d1e";
		export const BUNKER: "#0d1117" = "#0d1117";
		export const BUNTING: "#151f4c" = "#151f4c";
		export const BURGUNDY: "#800020" = "#800020";
		export const BURLYWOOD: "#deb887" = "#deb887";
		export const BURNHAM: "#002e20" = "#002e20";
		export const BURNING_ORANGE: "#ff7034" = "#ff7034";
		export const BURNING_SAND: "#d99376" = "#d99376";
		export const BURNISHED_BROWN: "#a17a74" = "#a17a74";
		export const BURNT_MAROON: "#420303" = "#420303";
		export const BURNT_ORANGE: "#cc5500" = "#cc5500";
		export const BURNT_SIENNA: "#e97451" = "#e97451";
		export const BURNT_UMBER: "#8a3324" = "#8a3324";
		export const BUSH: "#0d2e1c" = "#0d2e1c";
		export const BUTTERCUP: "#f3ad16" = "#f3ad16";
		export const BUTTERED_RUM: "#a1750d" = "#a1750d";
		export const BUTTERFLY_BUSH: "#624e9a" = "#624e9a";
		export const BUTTERMILK: "#fff1b5" = "#fff1b5";
		export const BUTTERY_WHITE: "#fffcea" = "#fffcea";
		export const BYZANTINE: "#bd33a4" = "#bd33a4";
		export const BYZANTIUM: "#702963" = "#702963";
		export const CG_BLUE: "#007aa5" = "#007aa5";
		export const CG_RED: "#e03c31" = "#e03c31";
		export const CAB_SAV: "#4d0a18" = "#4d0a18";
		export const CABARET: "#d94972" = "#d94972";
		export const CABBAGE_PONT: "#3f4c3a" = "#3f4c3a";
		export const CACTUS: "#587156" = "#587156";
		export const CADET: "#536872" = "#536872";
		export const CADET_BLUE: "#5f9ea0" = "#5f9ea0";
		export const CADET_GREY: "#91a3b0" = "#91a3b0";
		export const CADILLAC: "#b04c6a" = "#b04c6a";
		export const CADMIUM_GREEN: "#006b3c" = "#006b3c";
		export const CADMIUM_ORANGE: "#ed872d" = "#ed872d";
		export const CADMIUM_RED: "#e30022" = "#e30022";
		export const CADMIUM_YELLOW: "#fff600" = "#fff600";
		export const CAFE_NOIR: "#4b3621" = "#4b3621";
		export const CAFE_ROYALE: "#6f440c" = "#6f440c";
		export const CAL_POLY_GREEN: "#1e4d2b" = "#1e4d2b";
		export const CALICO: "#e0c095" = "#e0c095";
		export const CALIFORNIA: "#fe9d04" = "#fe9d04";
		export const CALYPSO: "#31728d" = "#31728d";
		export const CAMARONE: "#00581a" = "#00581a";
		export const CAMBRIDGE_BLUE: "#a3c1ad" = "#a3c1ad";
		export const CAMELOT: "#893456" = "#893456";
		export const CAMEO: "#d9b99b" = "#d9b99b";
		export const CAMEO_PINK: "#efbbcc" = "#efbbcc";
		export const CAMOUFLAGE: "#3c3910" = "#3c3910";
		export const CAMOUFLAGE_GREEN: "#78866b" = "#78866b";
		export const CAN_CAN: "#d591a4" = "#d591a4";
		export const CANARY: "#f3fb62" = "#f3fb62";
		export const CANARY_YELLOW: "#ffef00" = "#ffef00";
		export const CANDLELIGHT: "#fcd917" = "#fcd917";
		export const CANDY_APPLE_RED: "#ff0800" = "#ff0800";
		export const CANNON_BLACK: "#251706" = "#251706";
		export const CANNON_PINK: "#894367" = "#894367";
		export const CAPE_COD: "#3c4443" = "#3c4443";
		export const CAPE_HONEY: "#fee5ac" = "#fee5ac";
		export const CAPE_PALLISER: "#a26645" = "#a26645";
		export const CAPER: "#dcedb4" = "#dcedb4";
		export const CAPRI: "#00bfff" = "#00bfff";
		export const CAPUT_MORTUUM: "#592720" = "#592720";
		export const CARAMEL: "#ffddaf" = "#ffddaf";
		export const CARARRA: "#eeeee8" = "#eeeee8";
		export const CARDIN_GREEN: "#01361c" = "#01361c";
		export const CARDINAL: "#c41e3a" = "#c41e3a";
		export const CARDINAL_PINK: "#8c055e" = "#8c055e";
		export const CAREYS_PINK: "#d29eaa" = "#d29eaa";
		export const CARIBBEAN_GREEN: "#00cc99" = "#00cc99";
		export const CARISSMA: "#ea88a8" = "#ea88a8";
		export const CARLA: "#f3ffd8" = "#f3ffd8";
		export const CARMINE: "#960018" = "#960018";
		export const CARMINE_PINK: "#eb4c42" = "#eb4c42";
		export const CARMINE_RED: "#ff0038" = "#ff0038";
		export const CARNABY_TAN: "#5c2e01" = "#5c2e01";
		export const CARNATION: "#f95a61" = "#f95a61";
		export const CARNATION_PINK: "#ffa6c9" = "#ffa6c9";
		export const CARNELIAN: "#b31b1b" = "#b31b1b";
		export const CAROLINA_BLUE: "#56a0d3" = "#56a0d3";
		export const CAROUSEL_PINK: "#f9e0ed" = "#f9e0ed";
		export const CARROT_ORANGE: "#ed9121" = "#ed9121";
		export const CASABLANCA: "#f8b853" = "#f8b853";
		export const CASAL: "#2f6168" = "#2f6168";
		export const CASCADE: "#8ba9a5" = "#8ba9a5";
		export const CASHMERE: "#e6bea5" = "#e6bea5";
		export const CASPER: "#adbed1" = "#adbed1";
		export const CASTLETON_GREEN: "#00563b" = "#00563b";
		export const CASTRO: "#52001f" = "#52001f";
		export const CATALINA_BLUE: "#062a78" = "#062a78";
		export const CATAWBA: "#703642" = "#703642";
		export const CATSKILL_WHITE: "#eef6f7" = "#eef6f7";
		export const CAVERN_PINK: "#e3bebe" = "#e3bebe";
		export const CEDAR: "#3e1c14" = "#3e1c14";
		export const CEDAR_CHEST: "#c95a49" = "#c95a49";
		export const CEDAR_WOOD_FINISH: "#711a00" = "#711a00";
		export const CEIL: "#92a1cf" = "#92a1cf";
		export const CELADON: "#ace1af" = "#ace1af";
		export const CELADON_GREEN: "#2f847c" = "#2f847c";
		export const CELERY: "#b8c25d" = "#b8c25d";
		export const CELESTE: "#b2ffff" = "#b2ffff";
		export const CELESTIAL_BLUE: "#4997d0" = "#4997d0";
		export const CELLO: "#1e385b" = "#1e385b";
		export const CELTIC: "#163222" = "#163222";
		export const CEMENT: "#8d7662" = "#8d7662";
		export const CERAMIC: "#fcfff9" = "#fcfff9";
		export const CERISE: "#de3163" = "#de3163";
		export const CERISE_PINK: "#ec3b83" = "#ec3b83";
		export const CERULEAN: "#007ba7" = "#007ba7";
		export const CERULEAN_BLUE: "#2a52be" = "#2a52be";
		export const CERULEAN_FROST: "#6d9bc3" = "#6d9bc3";
		export const CHABLIS: "#fff4f3" = "#fff4f3";
		export const CHALET_GREEN: "#516e3d" = "#516e3d";
		export const CHALKY: "#eed794" = "#eed794";
		export const CHAMBRAY: "#354e8c" = "#354e8c";
		export const CHAMOIS: "#eddcb1" = "#eddcb1";
		export const CHAMOISEE: "#a0785a" = "#a0785a";
		export const CHAMPAGNE: "#f7e7ce" = "#f7e7ce";
		export const CHANTILLY: "#f8c3df" = "#f8c3df";
		export const CHARADE: "#292937" = "#292937";
		export const CHARCOAL: "#36454f" = "#36454f";
		export const CHARDON: "#fff3f1" = "#fff3f1";
		export const CHARDONNAY: "#ffcd8c" = "#ffcd8c";
		export const CHARLESTON_GREEN: "#232b2b" = "#232b2b";
		export const CHARLOTTE: "#baeef9" = "#baeef9";
		export const CHARM: "#d47494" = "#d47494";
		export const CHARM_PINK: "#e68fac" = "#e68fac";
		export const CHARTREUSE: "#dfff00" = "#dfff00";
		export const CHATEAU_GREEN: "#40a860" = "#40a860";
		export const CHATELLE: "#bdb3c7" = "#bdb3c7";
		export const CHATHAMS_BLUE: "#175579" = "#175579";
		export const CHELSEA_CUCUMBER: "#83aa5d" = "#83aa5d";
		export const CHELSEA_GEM: "#9e5302" = "#9e5302";
		export const CHENIN: "#dfcd6f" = "#dfcd6f";
		export const CHEROKEE: "#fcda98" = "#fcda98";
		export const CHERRY_BLOSSOM_PINK: "#ffb7c5" = "#ffb7c5";
		export const CHERRY_PIE: "#2a0359" = "#2a0359";
		export const CHERRYWOOD: "#651a14" = "#651a14";
		export const CHERUB: "#f8d9e9" = "#f8d9e9";
		export const CHESTNUT: "#954535" = "#954535";
		export const CHETWODE_BLUE: "#8581d9" = "#8581d9";
		export const CHICAGO: "#5d5c58" = "#5d5c58";
		export const CHIFFON: "#f1ffc8" = "#f1ffc8";
		export const CHILEAN_FIRE: "#f77703" = "#f77703";
		export const CHILEAN_HEATH: "#fffde6" = "#fffde6";
		export const CHINA_IVORY: "#fcffe7" = "#fcffe7";
		export const CHINA_ROSE: "#a8516e" = "#a8516e";
		export const CHINESE_RED: "#aa381e" = "#aa381e";
		export const CHINESE_VIOLET: "#856088" = "#856088";
		export const CHINO: "#cec7a7" = "#cec7a7";
		export const CHINOOK: "#a8e3bd" = "#a8e3bd";
		export const CHLOROPHYLL_GREEN: "#4aff00" = "#4aff00";
		export const CHOCOLATE: "#7b3f00" = "#7b3f00";
		export const CHRISTALLE: "#33036b" = "#33036b";
		export const CHRISTI: "#67a712" = "#67a712";
		export const CHRISTINE: "#e7730a" = "#e7730a";
		export const CHROME_WHITE: "#e8f1d4" = "#e8f1d4";
		export const CHROME_YELLOW: "#ffa700" = "#ffa700";
		export const CINDER: "#0e0e18" = "#0e0e18";
		export const CINDERELLA: "#fde1dc" = "#fde1dc";
		export const CINEREOUS: "#98817b" = "#98817b";
		export const CINNABAR: "#e34234" = "#e34234";
		export const CINNAMON_SATIN: "#cd607e" = "#cd607e";
		export const CIOCCOLATO: "#55280c" = "#55280c";
		export const CITRINE: "#e4d00a" = "#e4d00a";
		export const CITRINE_WHITE: "#faf7d6" = "#faf7d6";
		export const CITRON: "#9fa91f" = "#9fa91f";
		export const CITRUS: "#a1c50a" = "#a1c50a";
		export const CLAIRVOYANT: "#480656" = "#480656";
		export const CLAM_SHELL: "#d4b6af" = "#d4b6af";
		export const CLARET: "#7f1734" = "#7f1734";
		export const CLASSIC_ROSE: "#fbcce7" = "#fbcce7";
		export const CLAY_ASH: "#bdc8b3" = "#bdc8b3";
		export const CLAY_CREEK: "#8a8360" = "#8a8360";
		export const CLEAR_DAY: "#e9fffd" = "#e9fffd";
		export const CLEMENTINE: "#e96e00" = "#e96e00";
		export const CLINKER: "#371d09" = "#371d09";
		export const CLOUD: "#c7c4bf" = "#c7c4bf";
		export const CLOUD_BURST: "#202e54" = "#202e54";
		export const CLOUDY: "#aca59f" = "#aca59f";
		export const CLOVER: "#384910" = "#384910";
		export const COBALT_BLUE: "#0047ab" = "#0047ab";
		export const COCOA_BEAN: "#481c1c" = "#481c1c";
		export const COCOA_BROWN: "#d2691e" = "#d2691e";
		export const COCONUT: "#965a3e" = "#965a3e";
		export const COCONUT_CREAM: "#f8f7dc" = "#f8f7dc";
		export const COD_GRAY: "#0b0b0b" = "#0b0b0b";
		export const COFFEE: "#6f4e37" = "#6f4e37";
		export const COFFEE_BEAN: "#2a140e" = "#2a140e";
		export const COGNAC: "#9f381d" = "#9f381d";
		export const COLA: "#3f2500" = "#3f2500";
		export const COLD_PURPLE: "#aba0d9" = "#aba0d9";
		export const COLD_TURKEY: "#cebaba" = "#cebaba";
		export const COLONIAL_WHITE: "#ffedbc" = "#ffedbc";
		export const COLUMBIA_BLUE: "#c4d8e2" = "#c4d8e2";
		export const COMET: "#5c5d75" = "#5c5d75";
		export const COMO: "#517c66" = "#517c66";
		export const CONCH: "#c9d9d2" = "#c9d9d2";
		export const CONCORD: "#7c7b7a" = "#7c7b7a";
		export const CONCRETE: "#f2f2f2" = "#f2f2f2";
		export const CONFETTI: "#e9d75a" = "#e9d75a";
		export const CONGO_BROWN: "#593737" = "#593737";
		export const CONGO_PINK: "#f88379" = "#f88379";
		export const CONGRESS_BLUE: "#02478e" = "#02478e";
		export const CONIFER: "#acdd4d" = "#acdd4d";
		export const CONTESSA: "#c6726b" = "#c6726b";
		export const COOL_BLACK: "#002e63" = "#002e63";
		export const COOL_GREY: "#8c92ac" = "#8c92ac";
		export const COPPER: "#b87333" = "#b87333";
		export const COPPER_CANYON: "#7e3a15" = "#7e3a15";
		export const COPPER_PENNY: "#ad6f69" = "#ad6f69";
		export const COPPER_RED: "#cb6d51" = "#cb6d51";
		export const COPPER_ROSE: "#996666" = "#996666";
		export const COPPER_RUST: "#944747" = "#944747";
		export const COQUELICOT: "#ff3800" = "#ff3800";
		export const CORAL: "#ff7f50" = "#ff7f50";
		export const CORAL_RED: "#ff4040" = "#ff4040";
		export const CORAL_REEF: "#c7bca2" = "#c7bca2";
		export const CORAL_TREE: "#a86b6b" = "#a86b6b";
		export const CORDOVAN: "#893f45" = "#893f45";
		export const CORDUROY: "#606e68" = "#606e68";
		export const CORIANDER: "#c4d0b0" = "#c4d0b0";
		export const CORK: "#40291d" = "#40291d";
		export const CORN: "#e7bf05" = "#e7bf05";
		export const CORN_FIELD: "#f8facd" = "#f8facd";
		export const CORN_HARVEST: "#8b6b0b" = "#8b6b0b";
		export const CORNFLOWER_BLUE: "#6495ed" = "#6495ed";
		export const CORNFLOWER_LILAC: "#ffb0ac" = "#ffb0ac";
		export const CORNSILK: "#fff8dc" = "#fff8dc";
		export const CORVETTE: "#fad3a2" = "#fad3a2";
		export const COSMIC: "#76395d" = "#76395d";
		export const COSMIC_COBALT: "#2e2d88" = "#2e2d88";
		export const COSMIC_LATTE: "#fff8e7" = "#fff8e7";
		export const COSMOS: "#ffd8d9" = "#ffd8d9";
		export const COSTA_DEL_SOL: "#615d30" = "#615d30";
		export const COTTON_CANDY: "#ffbcd9" = "#ffbcd9";
		export const COTTON_SEED: "#c2bdb6" = "#c2bdb6";
		export const COUNTY_GREEN: "#01371a" = "#01371a";
		export const COWBOY: "#4d282d" = "#4d282d";
		export const COYOTE_BROWN: "#81613e" = "#81613e";
		export const CRAIL: "#b95140" = "#b95140";
		export const CRANBERRY: "#db5079" = "#db5079";
		export const CRATER_BROWN: "#462425" = "#462425";
		export const CRAYOLA_BLUE: "#1f75fe" = "#1f75fe";
		export const CRAYOLA_GREEN: "#1cac78" = "#1cac78";
		export const CRAYOLA_ORANGE: "#ff7538" = "#ff7538";
		export const CRAYOLA_RED: "#ee204d" = "#ee204d";
		export const CRAYOLA_YELLOW: "#fce883" = "#fce883";
		export const CREAM: "#fffdd0" = "#fffdd0";
		export const CREAM_BRULEE: "#ffe5a0" = "#ffe5a0";
		export const CREAM_CAN: "#f5c85c" = "#f5c85c";
		export const CREOLE: "#1e0f04" = "#1e0f04";
		export const CRETE: "#737829" = "#737829";
		export const CRIMSON: "#dc143c" = "#dc143c";
		export const CRIMSON_GLORY: "#be0032" = "#be0032";
		export const CRIMSON_RED: "#990000" = "#990000";
		export const CROCODILE: "#736d58" = "#736d58";
		export const CROWN_OF_THORNS: "#771f1f" = "#771f1f";
		export const CROWSHEAD: "#1c1208" = "#1c1208";
		export const CRUISE: "#b5ecdf" = "#b5ecdf";
		export const CRUSOE: "#004816" = "#004816";
		export const CRUSTA: "#fd7b33" = "#fd7b33";
		export const CUMIN: "#924321" = "#924321";
		export const CUMULUS: "#fdffd5" = "#fdffd5";
		export const CUPID: "#fbbeda" = "#fbbeda";
		export const CURIOUS_BLUE: "#2596d1" = "#2596d1";
		export const CUTTY_SARK: "#507672" = "#507672";
		export const CYAN: "#00ffff" = "#00ffff";
		export const CYAN_AZURE: "#4e82b4" = "#4e82b4";
		export const CYAN_BLUE_AZURE: "#4682bf" = "#4682bf";
		export const CYAN_COBALT_BLUE: "#28589c" = "#28589c";
		export const CYAN_CORNFLOWER_BLUE: "#188bc2" = "#188bc2";
		export const CYBER_GRAPE: "#58427c" = "#58427c";
		export const CYBER_YELLOW: "#ffd300" = "#ffd300";
		export const CYCLAMEN: "#f56fa1" = "#f56fa1";
		export const CYPRUS: "#003e40" = "#003e40";
		export const DAFFODIL: "#ffff31" = "#ffff31";
		export const DAINTREE: "#012731" = "#012731";
		export const DAIRY_CREAM: "#f9e4bc" = "#f9e4bc";
		export const DAISY_BUSH: "#4f2398" = "#4f2398";
		export const DALLAS: "#6e4b26" = "#6e4b26";
		export const DANDELION: "#f0e130" = "#f0e130";
		export const DANUBE: "#6093d1" = "#6093d1";
		export const DARK_BLUE: "#00008b" = "#00008b";
		export const DARK_BLUE_GRAY: "#666699" = "#666699";
		export const DARK_BROWN: "#654321" = "#654321";
		export const DARK_BROWN_TANGELO: "#88654e" = "#88654e";
		export const DARK_BURGUNDY: "#770f05" = "#770f05";
		export const DARK_BYZANTIUM: "#5d3954" = "#5d3954";
		export const DARK_CANDY_APPLE_RED: "#a40000" = "#a40000";
		export const DARK_CERULEAN: "#08457e" = "#08457e";
		export const DARK_CHESTNUT: "#986960" = "#986960";
		export const DARK_CORAL: "#cd5b45" = "#cd5b45";
		export const DARK_CYAN: "#008b8b" = "#008b8b";
		export const DARK_EBONY: "#3c2005" = "#3c2005";
		export const DARK_FERN: "#0a480d" = "#0a480d";
		export const DARK_GOLDENROD: "#b8860b" = "#b8860b";
		export const DARK_GREEN: "#013220" = "#013220";
		export const DARK_GUNMETAL: "#1f262a" = "#1f262a";
		export const DARK_IMPERIAL_BLUE: "#6e6ef9" = "#6e6ef9";
		export const DARK_JUNGLE_GREEN: "#1a2421" = "#1a2421";
		export const DARK_KHAKI: "#bdb76b" = "#bdb76b";
		export const DARK_LAVENDER: "#734f96" = "#734f96";
		export const DARK_LIVER: "#534b4f" = "#534b4f";
		export const DARK_MAGENTA: "#8b008b" = "#8b008b";
		export const DARK_MEDIUM_GRAY: "#a9a9a9" = "#a9a9a9";
		export const DARK_MIDNIGHT_BLUE: "#003366" = "#003366";
		export const DARK_MOSS_GREEN: "#4a5d23" = "#4a5d23";
		export const DARK_OLIVE_GREEN: "#556b2f" = "#556b2f";
		export const DARK_ORANGE: "#ff8c00" = "#ff8c00";
		export const DARK_ORCHID: "#9932cc" = "#9932cc";
		export const DARK_PASTEL_BLUE: "#779ecb" = "#779ecb";
		export const DARK_PASTEL_GREEN: "#03c03c" = "#03c03c";
		export const DARK_PASTEL_PURPLE: "#966fd6" = "#966fd6";
		export const DARK_PASTEL_RED: "#c23b22" = "#c23b22";
		export const DARK_PINK: "#e75480" = "#e75480";
		export const DARK_PUCE: "#4f3a3c" = "#4f3a3c";
		export const DARK_PURPLE: "#301934" = "#301934";
		export const DARK_RASPBERRY: "#872657" = "#872657";
		export const DARK_RED: "#8b0000" = "#8b0000";
		export const DARK_SALMON: "#e9967a" = "#e9967a";
		export const DARK_SCARLET: "#560319" = "#560319";
		export const DARK_SEA_GREEN: "#8fbc8f" = "#8fbc8f";
		export const DARK_SIENNA: "#3c1414" = "#3c1414";
		export const DARK_SKY_BLUE: "#8cbed6" = "#8cbed6";
		export const DARK_SLATE_BLUE: "#483d8b" = "#483d8b";
		export const DARK_SLATE_GRAY: "#2f4f4f" = "#2f4f4f";
		export const DARK_SPRING_GREEN: "#177245" = "#177245";
		export const DARK_TAN: "#918151" = "#918151";
		export const DARK_TANGERINE: "#ffa812" = "#ffa812";
		export const DARK_TERRA_COTTA: "#cc4e5c" = "#cc4e5c";
		export const DARK_TURQUOISE: "#00ced1" = "#00ced1";
		export const DARK_VANILLA: "#d1bea8" = "#d1bea8";
		export const DARK_VIOLET: "#9400d3" = "#9400d3";
		export const DARK_YELLOW: "#9b870c" = "#9b870c";
		export const DARTMOUTH_GREEN: "#00703c" = "#00703c";
		export const DAVYS_GREY: "#555555" = "#555555";
		export const DAWN: "#a6a29a" = "#a6a29a";
		export const DAWN_PINK: "#f3e9e5" = "#f3e9e5";
		export const DE_YORK: "#7ac488" = "#7ac488";
		export const DEBIAN_RED: "#d70a53" = "#d70a53";
		export const DECO: "#d2da97" = "#d2da97";
		export const DEEP_BLUE: "#220878" = "#220878";
		export const DEEP_BLUSH: "#e47698" = "#e47698";
		export const DEEP_BRONZE: "#4a3004" = "#4a3004";
		export const DEEP_CARMINE: "#a9203e" = "#a9203e";
		export const DEEP_CARMINE_PINK: "#ef3038" = "#ef3038";
		export const DEEP_CARROT_ORANGE: "#e9692c" = "#e9692c";
		export const DEEP_CERISE: "#da3287" = "#da3287";
		export const DEEP_CHESTNUT: "#b94e48" = "#b94e48";
		export const DEEP_COVE: "#051040" = "#051040";
		export const DEEP_FIR: "#002900" = "#002900";
		export const DEEP_FOREST_GREEN: "#182d09" = "#182d09";
		export const DEEP_FUCHSIA: "#c154c1" = "#c154c1";
		export const DEEP_GREEN: "#056608" = "#056608";
		export const DEEP_GREEN_CYAN_TURQUOISE: "#0e7c61" = "#0e7c61";
		export const DEEP_JUNGLE_GREEN: "#004b49" = "#004b49";
		export const DEEP_KOAMARU: "#333366" = "#333366";
		export const DEEP_LEMON: "#f5c71a" = "#f5c71a";
		export const DEEP_LILAC: "#9955bb" = "#9955bb";
		export const DEEP_MAGENTA: "#cc00cc" = "#cc00cc";
		export const DEEP_MAROON: "#820000" = "#820000";
		export const DEEP_OAK: "#412010" = "#412010";
		export const DEEP_PINK: "#ff1493" = "#ff1493";
		export const DEEP_PUCE: "#a95c68" = "#a95c68";
		export const DEEP_RED: "#850101" = "#850101";
		export const DEEP_RUBY: "#843f5b" = "#843f5b";
		export const DEEP_SAFFRON: "#ff9933" = "#ff9933";
		export const DEEP_SAPPHIRE: "#082567" = "#082567";
		export const DEEP_SEA: "#01826b" = "#01826b";
		export const DEEP_SEA_GREEN: "#095859" = "#095859";
		export const DEEP_SPACE_SPARKLE: "#4a646c" = "#4a646c";
		export const DEEP_TAUPE: "#7e5e60" = "#7e5e60";
		export const DEEP_TEAL: "#003532" = "#003532";
		export const DEEP_TUSCAN_RED: "#66424d" = "#66424d";
		export const DEEP_VIOLET: "#330066" = "#330066";
		export const DEER: "#ba8759" = "#ba8759";
		export const DEL_RIO: "#b09a95" = "#b09a95";
		export const DELL: "#396413" = "#396413";
		export const DELTA: "#a4a49d" = "#a4a49d";
		export const DELUGE: "#7563a8" = "#7563a8";
		export const DENIM: "#1560bd" = "#1560bd";
		export const DENIM_BLUE: "#2243b6" = "#2243b6";
		export const DERBY: "#ffeed8" = "#ffeed8";
		export const DESATURATED_CYAN: "#669999" = "#669999";
		export const DESERT: "#ae6020" = "#ae6020";
		export const DESERT_SAND: "#edc9af" = "#edc9af";
		export const DESERT_STORM: "#f8f8f7" = "#f8f8f7";
		export const DESIRE: "#ea3c53" = "#ea3c53";
		export const DEW: "#eafffe" = "#eafffe";
		export const DI_SERRIA: "#db995e" = "#db995e";
		export const DIAMOND: "#b9f2ff" = "#b9f2ff";
		export const DIESEL: "#130000" = "#130000";
		export const DIM_GRAY: "#696969" = "#696969";
		export const DINGLEY: "#5d7747" = "#5d7747";
		export const DINGY_DUNGEON: "#c53151" = "#c53151";
		export const DIRT: "#9b7653" = "#9b7653";
		export const DISCO: "#871550" = "#871550";
		export const DIXIE: "#e29418" = "#e29418";
		export const DODGER_BLUE: "#1e90ff" = "#1e90ff";
		export const DOGS: "#b86d29" = "#b86d29";
		export const DOGWOOD_ROSE: "#d71868" = "#d71868";
		export const DOLLAR_BILL: "#85bb65" = "#85bb65";
		export const DOLLY: "#f9ff8b" = "#f9ff8b";
		export const DOLPHIN: "#646077" = "#646077";
		export const DOMINO: "#8e775e" = "#8e775e";
		export const DON_JUAN: "#5d4c51" = "#5d4c51";
		export const DONKEY_BROWN: "#664c28" = "#664c28";
		export const DORADO: "#6b5755" = "#6b5755";
		export const DOUBLE_COLONIAL_WHITE: "#eee3ad" = "#eee3ad";
		export const DOUBLE_PEARL_LUSTA: "#fcf4d0" = "#fcf4d0";
		export const DOUBLE_SPANISH_WHITE: "#e6d7b9" = "#e6d7b9";
		export const DOVE_GRAY: "#6d6c6c" = "#6d6c6c";
		export const DOWNRIVER: "#092256" = "#092256";
		export const DOWNY: "#6fd0c5" = "#6fd0c5";
		export const DRIFTWOOD: "#af8751" = "#af8751";
		export const DROVER: "#fdf7ad" = "#fdf7ad";
		export const DUKE_BLUE: "#00009c" = "#00009c";
		export const DULL_LAVENDER: "#a899e6" = "#a899e6";
		export const DUNE: "#383533" = "#383533";
		export const DUST_STORM: "#e5ccc9" = "#e5ccc9";
		export const DUSTY_GRAY: "#a8989b" = "#a8989b";
		export const DUTCH_WHITE: "#efdfbb" = "#efdfbb";
		export const EAGLE: "#b6baa4" = "#b6baa4";
		export const EAGLE_GREEN: "#004953" = "#004953";
		export const EARLS_GREEN: "#c9b93b" = "#c9b93b";
		export const EARLY_DAWN: "#fff9e6" = "#fff9e6";
		export const EARTH_YELLOW: "#e1a95f" = "#e1a95f";
		export const EAST_BAY: "#414c7d" = "#414c7d";
		export const EAST_SIDE: "#ac91ce" = "#ac91ce";
		export const EASTERN_BLUE: "#1e9ab0" = "#1e9ab0";
		export const EBB: "#e9e3e3" = "#e9e3e3";
		export const EBONY: "#555d50" = "#555d50";
		export const EBONY_CLAY: "#26283b" = "#26283b";
		export const ECLIPSE: "#311c17" = "#311c17";
		export const ECRU: "#c2b280" = "#c2b280";
		export const ECRU_WHITE: "#f5f3e5" = "#f5f3e5";
		export const ECSTASY: "#fa7814" = "#fa7814";
		export const EDEN: "#105852" = "#105852";
		export const EDGEWATER: "#c8e3d7" = "#c8e3d7";
		export const EDWARD: "#a2aeab" = "#a2aeab";
		export const EERIE_BLACK: "#1b1b1b" = "#1b1b1b";
		export const EGG_SOUR: "#fff4dd" = "#fff4dd";
		export const EGG_WHITE: "#ffefc1" = "#ffefc1";
		export const EGGPLANT: "#614051" = "#614051";
		export const EGGSHELL: "#f0ead6" = "#f0ead6";
		export const EGYPTIAN_BLUE: "#1034a6" = "#1034a6";
		export const EL_PASO: "#1e1708" = "#1e1708";
		export const EL_SALVA: "#8f3e33" = "#8f3e33";
		export const ELECTRIC_BLUE: "#7df9ff" = "#7df9ff";
		export const ELECTRIC_CRIMSON: "#ff003f" = "#ff003f";
		export const ELECTRIC_INDIGO: "#6f00ff" = "#6f00ff";
		export const ELECTRIC_LIME: "#ccff00" = "#ccff00";
		export const ELECTRIC_PURPLE: "#bf00ff" = "#bf00ff";
		export const ELECTRIC_VIOLET: "#8b00ff" = "#8b00ff";
		export const ELECTRIC_YELLOW: "#ffff33" = "#ffff33";
		export const ELEPHANT: "#123447" = "#123447";
		export const ELF_GREEN: "#088370" = "#088370";
		export const ELM: "#1c7c7d" = "#1c7c7d";
		export const EMERALD: "#50c878" = "#50c878";
		export const EMINENCE: "#6c3082" = "#6c3082";
		export const EMPEROR: "#514649" = "#514649";
		export const EMPRESS: "#817377" = "#817377";
		export const ENDEAVOUR: "#0056a7" = "#0056a7";
		export const ENERGY_YELLOW: "#f8dd5c" = "#f8dd5c";
		export const ENGINEERING_INTERNATIONAL_ORANGE: "#ba160c" = "#ba160c";
		export const ENGLISH_HOLLY: "#022d15" = "#022d15";
		export const ENGLISH_LAVENDER: "#b48395" = "#b48395";
		export const ENGLISH_RED: "#ab4b52" = "#ab4b52";
		export const ENGLISH_VERMILLION: "#cc474b" = "#cc474b";
		export const ENGLISH_WALNUT: "#3e2b23" = "#3e2b23";
		export const ENVY: "#8ba690" = "#8ba690";
		export const EQUATOR: "#e1bc64" = "#e1bc64";
		export const ESPRESSO: "#612718" = "#612718";
		export const ETERNITY: "#211a0e" = "#211a0e";
		export const ETON_BLUE: "#96c8a2" = "#96c8a2";
		export const EUCALYPTUS: "#44d7a8" = "#44d7a8";
		export const EUNRY: "#cfa39d" = "#cfa39d";
		export const EVENING_SEA: "#024e46" = "#024e46";
		export const EVERGLADE: "#1c402e" = "#1c402e";
		export const FOGRA29_RICH_BLACK: "#010b13" = "#010b13";
		export const FOGRA39_RICH_BLACK: "#010203" = "#010203";
		export const FADED_JADE: "#427977" = "#427977";
		export const FAIR_PINK: "#ffefec" = "#ffefec";
		export const FALCON: "#7f626d" = "#7f626d";
		export const FALLOW: "#c19a6b" = "#c19a6b";
		export const FALU_RED: "#801818" = "#801818";
		export const FANDANGO: "#b53389" = "#b53389";
		export const FANDANGO_PINK: "#de5285" = "#de5285";
		export const FANTASY: "#faf3f0" = "#faf3f0";
		export const FASHION_FUCHSIA: "#f400a1" = "#f400a1";
		export const FAWN: "#e5aa70" = "#e5aa70";
		export const FEDORA: "#796a78" = "#796a78";
		export const FEIJOA: "#9fdd8c" = "#9fdd8c";
		export const FELDGRAU: "#4d5d53" = "#4d5d53";
		export const FERN: "#63b76c" = "#63b76c";
		export const FERN_FROND: "#657220" = "#657220";
		export const FERN_GREEN: "#4f7942" = "#4f7942";
		export const FERRA: "#704f50" = "#704f50";
		export const FERRARI_RED: "#ff2800" = "#ff2800";
		export const FESTIVAL: "#fbe96c" = "#fbe96c";
		export const FETA: "#f0fcea" = "#f0fcea";
		export const FIELD_DRAB: "#6c541e" = "#6c541e";
		export const FIERY_ORANGE: "#b35213" = "#b35213";
		export const FIERY_ROSE: "#ff5470" = "#ff5470";
		export const FINCH: "#626649" = "#626649";
		export const FINLANDIA: "#556d56" = "#556d56";
		export const FINN: "#692d54" = "#692d54";
		export const FIORD: "#405169" = "#405169";
		export const FIRE: "#aa4203" = "#aa4203";
		export const FIRE_BUSH: "#e89928" = "#e89928";
		export const FIRE_ENGINE_RED: "#ce2029" = "#ce2029";
		export const FIREBRICK: "#b22222" = "#b22222";
		export const FIREFLY: "#0e2a30" = "#0e2a30";
		export const FLAME: "#e25822" = "#e25822";
		export const FLAME_PEA: "#da5b38" = "#da5b38";
		export const FLAMENCO: "#ff7d07" = "#ff7d07";
		export const FLAMINGO: "#f2552a" = "#f2552a";
		export const FLAMINGO_PINK: "#fc8eac" = "#fc8eac";
		export const FLAVESCENT: "#f7e98e" = "#f7e98e";
		export const FLAX: "#eedc82" = "#eedc82";
		export const FLAX_SMOKE: "#7b8265" = "#7b8265";
		export const FLINT: "#6f6a61" = "#6f6a61";
		export const FLIRT: "#a2006d" = "#a2006d";
		export const FLORAL_WHITE: "#fffaf0" = "#fffaf0";
		export const FLUSH_MAHOGANY: "#ca3435" = "#ca3435";
		export const FOAM: "#d8fcfa" = "#d8fcfa";
		export const FOG: "#d7d0ff" = "#d7d0ff";
		export const FOGGY_GRAY: "#cbcab6" = "#cbcab6";
		export const FOLLY: "#ff004f" = "#ff004f";
		export const FOREST_GREEN: "#228b22" = "#228b22";
		export const FORGET_ME_NOT: "#fff1ee" = "#fff1ee";
		export const FOUNTAIN_BLUE: "#56b4be" = "#56b4be";
		export const FRANGIPANI: "#ffdeb3" = "#ffdeb3";
		export const FRENCH_BISTRE: "#856d4d" = "#856d4d";
		export const FRENCH_BLUE: "#0072bb" = "#0072bb";
		export const FRENCH_FUCHSIA: "#fd3f92" = "#fd3f92";
		export const FRENCH_GRAY: "#bdbdc6" = "#bdbdc6";
		export const FRENCH_LILAC: "#86608e" = "#86608e";
		export const FRENCH_LIME: "#9efd38" = "#9efd38";
		export const FRENCH_MAUVE: "#d473d4" = "#d473d4";
		export const FRENCH_PASS: "#bdedfd" = "#bdedfd";
		export const FRENCH_PINK: "#fd6c9e" = "#fd6c9e";
		export const FRENCH_PLUM: "#811453" = "#811453";
		export const FRENCH_PUCE: "#4e1609" = "#4e1609";
		export const FRENCH_RASPBERRY: "#c72c48" = "#c72c48";
		export const FRENCH_ROSE: "#f64a8a" = "#f64a8a";
		export const FRENCH_SKY_BLUE: "#77b5fe" = "#77b5fe";
		export const FRENCH_VIOLET: "#8806ce" = "#8806ce";
		export const FRENCH_WINE: "#ac1e44" = "#ac1e44";
		export const FRESH_AIR: "#a6e7ff" = "#a6e7ff";
		export const FRESH_EGGPLANT: "#990066" = "#990066";
		export const FRIAR_GRAY: "#807e79" = "#807e79";
		export const FRINGY_FLOWER: "#b1e2c1" = "#b1e2c1";
		export const FROLY: "#f57584" = "#f57584";
		export const FROST: "#edf5dd" = "#edf5dd";
		export const FROSTBITE: "#e936a7" = "#e936a7";
		export const FROSTED_MINT: "#dbfff8" = "#dbfff8";
		export const FROSTEE: "#e4f6e7" = "#e4f6e7";
		export const FRUIT_SALAD: "#4f9d5d" = "#4f9d5d";
		export const FUCHSIA: "#ff00ff" = "#ff00ff";
		export const FUCHSIA_BLUE: "#7a58c1" = "#7a58c1";
		export const FUCHSIA_PINK: "#ff77ff" = "#ff77ff";
		export const FUCHSIA_PURPLE: "#cc397b" = "#cc397b";
		export const FUCHSIA_ROSE: "#c74375" = "#c74375";
		export const FUEGO: "#bede0d" = "#bede0d";
		export const FUEL_YELLOW: "#eca927" = "#eca927";
		export const FULVOUS: "#e48400" = "#e48400";
		export const FUN_BLUE: "#1959a8" = "#1959a8";
		export const FUN_GREEN: "#016d39" = "#016d39";
		export const FUSCOUS_GRAY: "#54534d" = "#54534d";
		export const FUZZY_WUZZY: "#cc6666" = "#cc6666";
		export const FUZZY_WUZZY_BROWN: "#c45655" = "#c45655";
		export const GO_GREEN: "#00ab66" = "#00ab66";
		export const GABLE_GREEN: "#163531" = "#163531";
		export const GAINSBORO: "#dcdcdc" = "#dcdcdc";
		export const GALLERY: "#efefef" = "#efefef";
		export const GALLIANO: "#dcb20c" = "#dcb20c";
		export const GAMBOGE: "#e49b0f" = "#e49b0f";
		export const GAMBOGE_ORANGE: "#996600" = "#996600";
		export const GARGOYLE_GAS: "#ffdf46" = "#ffdf46";
		export const GEEBUNG: "#d18f1b" = "#d18f1b";
		export const GENERIC_VIRIDIAN: "#007f66" = "#007f66";
		export const GENOA: "#15736b" = "#15736b";
		export const GERALDINE: "#fb8989" = "#fb8989";
		export const GEYSER: "#d4dfe2" = "#d4dfe2";
		export const GHOST: "#c7c9d5" = "#c7c9d5";
		export const GHOST_WHITE: "#f8f8ff" = "#f8f8ff";
		export const GIANTS_CLUB: "#b05c52" = "#b05c52";
		export const GIANTS_ORANGE: "#fe5a1d" = "#fe5a1d";
		export const GIGAS: "#523c94" = "#523c94";
		export const GIMBLET: "#b8b56a" = "#b8b56a";
		export const GIN: "#e8f2eb" = "#e8f2eb";
		export const GIN_FIZZ: "#fff9e2" = "#fff9e2";
		export const GINGER: "#b06500" = "#b06500";
		export const GIVRY: "#f8e4bf" = "#f8e4bf";
		export const GLACIER: "#80b3c4" = "#80b3c4";
		export const GLADE_GREEN: "#61845f" = "#61845f";
		export const GLAUCOUS: "#6082b6" = "#6082b6";
		export const GLITTER: "#e6e8fa" = "#e6e8fa";
		export const GLOSSY_GRAPE: "#ab92b3" = "#ab92b3";
		export const GO_BEN: "#726d4e" = "#726d4e";
		export const GOBLIN: "#3d7d52" = "#3d7d52";
		export const GOLD_DROP: "#f18200" = "#f18200";
		export const GOLD_FUSION: "#85754e" = "#85754e";
		export const GOLD_TIPS: "#deba13" = "#deba13";
		export const GOLDEN: "#ffd700" = "#ffd700";
		export const GOLDEN_BELL: "#e28913" = "#e28913";
		export const GOLDEN_BROWN: "#996515" = "#996515";
		export const GOLDEN_DREAM: "#f0d52d" = "#f0d52d";
		export const GOLDEN_FIZZ: "#f5fb3d" = "#f5fb3d";
		export const GOLDEN_GATE_BRIDGE: "#c0362c" = "#c0362c";
		export const GOLDEN_GLOW: "#fde295" = "#fde295";
		export const GOLDEN_POPPY: "#fcc200" = "#fcc200";
		export const GOLDEN_SAND: "#f0db7d" = "#f0db7d";
		export const GOLDEN_TAINOI: "#ffcc5c" = "#ffcc5c";
		export const GOLDEN_YELLOW: "#ffdf00" = "#ffdf00";
		export const GOLDENROD: "#daa520" = "#daa520";
		export const GONDOLA: "#261414" = "#261414";
		export const GORDONS_GREEN: "#0b1107" = "#0b1107";
		export const GORSE: "#fff14f" = "#fff14f";
		export const GOSSAMER: "#069b81" = "#069b81";
		export const GOSSIP: "#d2f8b0" = "#d2f8b0";
		export const GOTHIC: "#6d92a1" = "#6d92a1";
		export const GOVERNOR_BAY: "#2f3cb3" = "#2f3cb3";
		export const GRAIN_BROWN: "#e4d5b7" = "#e4d5b7";
		export const GRANDIS: "#ffd38c" = "#ffd38c";
		export const GRANITE_GRAY: "#676767" = "#676767";
		export const GRANITE_GREEN: "#8d8974" = "#8d8974";
		export const GRANNY_APPLE: "#d5f6e3" = "#d5f6e3";
		export const GRANNY_SMITH: "#84a0a0" = "#84a0a0";
		export const GRANNY_SMITH_APPLE: "#a8e4a0" = "#a8e4a0";
		export const GRAPE: "#6f2da8" = "#6f2da8";
		export const GRAPHITE: "#251607" = "#251607";
		export const GRAVEL: "#4a444b" = "#4a444b";
		export const GRAY: "#808080" = "#808080";
		export const GRAY_ASPARAGUS: "#465945" = "#465945";
		export const GRAY_CHATEAU: "#a2aab3" = "#a2aab3";
		export const GRAY_NICKEL: "#c3c3bd" = "#c3c3bd";
		export const GRAY_NURSE: "#e7ece6" = "#e7ece6";
		export const GRAY_OLIVE: "#a9a491" = "#a9a491";
		export const GRAY_SUIT: "#c1becd" = "#c1becd";
		export const GREEN: "#00ff00" = "#00ff00";
		export const GREEN_BLUE: "#1164b4" = "#1164b4";
		export const GREEN_CYAN: "#009966" = "#009966";
		export const GREEN_HAZE: "#01a368" = "#01a368";
		export const GREEN_HOUSE: "#24500f" = "#24500f";
		export const GREEN_KELP: "#25311c" = "#25311c";
		export const GREEN_LEAF: "#436a0d" = "#436a0d";
		export const GREEN_LIZARD: "#a7f432" = "#a7f432";
		export const GREEN_MIST: "#cbd3b0" = "#cbd3b0";
		export const GREEN_PEA: "#1d6142" = "#1d6142";
		export const GREEN_SHEEN: "#6eaea1" = "#6eaea1";
		export const GREEN_SMOKE: "#a4af6e" = "#a4af6e";
		export const GREEN_SPRING: "#b8c1b1" = "#b8c1b1";
		export const GREEN_VOGUE: "#032b52" = "#032b52";
		export const GREEN_WATERLOO: "#101405" = "#101405";
		export const GREEN_WHITE: "#e8ebe0" = "#e8ebe0";
		export const GREEN_YELLOW: "#adff2f" = "#adff2f";
		export const GRENADIER: "#d54600" = "#d54600";
		export const GRIZZLY: "#885818" = "#885818";
		export const GRULLO: "#a99a86" = "#a99a86";
		export const GUARDSMAN_RED: "#ba0101" = "#ba0101";
		export const GULF_BLUE: "#051657" = "#051657";
		export const GULF_STREAM: "#80b3ae" = "#80b3ae";
		export const GULL_GRAY: "#9dacb7" = "#9dacb7";
		export const GUM_LEAF: "#b6d3bf" = "#b6d3bf";
		export const GUMBO: "#7ca1a6" = "#7ca1a6";
		export const GUN_POWDER: "#414257" = "#414257";
		export const GUNMETAL: "#2a3439" = "#2a3439";
		export const GUNSMOKE: "#828685" = "#828685";
		export const GURKHA: "#9a9577" = "#9a9577";
		export const HACIENDA: "#98811b" = "#98811b";
		export const HAIRY_HEATH: "#6b2a14" = "#6b2a14";
		export const HAITI: "#1b1035" = "#1b1035";
		export const HALAYÀ_ÚBE: "#663854" = "#663854";
		export const HALF_BAKED: "#85c4cc" = "#85c4cc";
		export const HALF_COLONIAL_WHITE: "#fdf6d3" = "#fdf6d3";
		export const HALF_DUTCH_WHITE: "#fef7de" = "#fef7de";
		export const HALF_SPANISH_WHITE: "#fef4db" = "#fef4db";
		export const HALF_AND_HALF: "#fffee1" = "#fffee1";
		export const HAMPTON: "#e5d8af" = "#e5d8af";
		export const HAN_BLUE: "#446ccf" = "#446ccf";
		export const HAN_PURPLE: "#5218fa" = "#5218fa";
		export const HARLEQUIN: "#3fff00" = "#3fff00";
		export const HARLEQUIN_GREEN: "#46cb18" = "#46cb18";
		export const HARP: "#e6f2ea" = "#e6f2ea";
		export const HARVARD_CRIMSON: "#c90016" = "#c90016";
		export const HARVEST_GOLD: "#da9100" = "#da9100";
		export const HAVELOCK_BLUE: "#5590d9" = "#5590d9";
		export const HAWAIIAN_TAN: "#9d5616" = "#9d5616";
		export const HAWKES_BLUE: "#d4e2fc" = "#d4e2fc";
		export const HEAT_WAVE: "#ff7a00" = "#ff7a00";
		export const HEATH: "#541012" = "#541012";
		export const HEATHER: "#b7c3d0" = "#b7c3d0";
		export const HEATHERED_GRAY: "#b6b095" = "#b6b095";
		export const HEAVY_METAL: "#2b3228" = "#2b3228";
		export const HELIOTROPE: "#df73ff" = "#df73ff";
		export const HELIOTROPE_GRAY: "#aa98a9" = "#aa98a9";
		export const HELIOTROPE_MAGENTA: "#aa00bb" = "#aa00bb";
		export const HEMLOCK: "#5e5d3b" = "#5e5d3b";
		export const HEMP: "#907874" = "#907874";
		export const HIBISCUS: "#b6316c" = "#b6316c";
		export const HIGHLAND: "#6f8e63" = "#6f8e63";
		export const HILLARY: "#aca586" = "#aca586";
		export const HIMALAYA: "#6a5d1b" = "#6a5d1b";
		export const HINT_OF_GREEN: "#e6ffe9" = "#e6ffe9";
		export const HINT_OF_RED: "#fbf9f9" = "#fbf9f9";
		export const HINT_OF_YELLOW: "#fafde4" = "#fafde4";
		export const HIPPIE_BLUE: "#589aaf" = "#589aaf";
		export const HIPPIE_GREEN: "#53824b" = "#53824b";
		export const HIPPIE_PINK: "#ae4560" = "#ae4560";
		export const HIT_GRAY: "#a1adb5" = "#a1adb5";
		export const HIT_PINK: "#ffab81" = "#ffab81";
		export const HOKEY_POKEY: "#c8a528" = "#c8a528";
		export const HOKI: "#65869f" = "#65869f";
		export const HOLLY: "#011d13" = "#011d13";
		export const HONEY_FLOWER: "#4f1c70" = "#4f1c70";
		export const HONEYDEW: "#f0fff0" = "#f0fff0";
		export const HONEYSUCKLE: "#edfc84" = "#edfc84";
		export const HONOLULU_BLUE: "#006db0" = "#006db0";
		export const HOOKERS_GREEN: "#49796b" = "#49796b";
		export const HOPBUSH: "#d06da1" = "#d06da1";
		export const HORIZON: "#5a87a0" = "#5a87a0";
		export const HORSES: "#543d37" = "#543d37";
		export const HORSES_NECK: "#604913" = "#604913";
		export const HOT_MAGENTA: "#ff1dce" = "#ff1dce";
		export const HOT_PINK: "#ff69b4" = "#ff69b4";
		export const HOT_TODDY: "#b38007" = "#b38007";
		export const HUMMING_BIRD: "#cff9f3" = "#cff9f3";
		export const HUNTER_GREEN: "#355e3b" = "#355e3b";
		export const HURRICANE: "#877c7b" = "#877c7b";
		export const HUSK: "#b7a458" = "#b7a458";
		export const ICE_COLD: "#b1f4e7" = "#b1f4e7";
		export const ICEBERG: "#71a6d2" = "#71a6d2";
		export const ICTERINE: "#fcf75e" = "#fcf75e";
		export const ILLUMINATING_EMERALD: "#319177" = "#319177";
		export const ILLUSION: "#f6a4c9" = "#f6a4c9";
		export const IMPERIAL: "#602f6b" = "#602f6b";
		export const IMPERIAL_BLUE: "#002395" = "#002395";
		export const IMPERIAL_RED: "#ed2939" = "#ed2939";
		export const INCH_WORM: "#b0e313" = "#b0e313";
		export const INCHWORM: "#b2ec5d" = "#b2ec5d";
		export const INDEPENDENCE: "#4c516d" = "#4c516d";
		export const INDIA_GREEN: "#138808" = "#138808";
		export const INDIAN_RED: "#cd5c5c" = "#cd5c5c";
		export const INDIAN_TAN: "#4d1e01" = "#4d1e01";
		export const INDIAN_YELLOW: "#e3a857" = "#e3a857";
		export const INDIGO: "#4b0082" = "#4b0082";
		export const INDIGO_DYE: "#091f92" = "#091f92";
		export const INDOCHINE: "#c26b03" = "#c26b03";
		export const INTERNATIONAL_KLEIN_BLUE: "#002fa7" = "#002fa7";
		export const INTERNATIONAL_ORANGE: "#ff4f00" = "#ff4f00";
		export const IRIS: "#5a4fcf" = "#5a4fcf";
		export const IRISH_COFFEE: "#5f3d26" = "#5f3d26";
		export const IROKO: "#433120" = "#433120";
		export const IRON: "#d4d7d9" = "#d4d7d9";
		export const IRONSIDE_GRAY: "#676662" = "#676662";
		export const IRONSTONE: "#86483c" = "#86483c";
		export const IRRESISTIBLE: "#b3446c" = "#b3446c";
		export const ISABELLINE: "#f4f0ec" = "#f4f0ec";
		export const ISLAMIC_GREEN: "#009000" = "#009000";
		export const ISLAND_SPICE: "#fffcee" = "#fffcee";
		export const IVORY: "#fffff0" = "#fffff0";
		export const JACARANDA: "#2e0329" = "#2e0329";
		export const JACARTA: "#3a2a6a" = "#3a2a6a";
		export const JACKO_BEAN: "#2e1905" = "#2e1905";
		export const JACKSONS_PURPLE: "#20208d" = "#20208d";
		export const JADE: "#00a86b" = "#00a86b";
		export const JAFFA: "#ef863f" = "#ef863f";
		export const JAGGED_ICE: "#c2e8e5" = "#c2e8e5";
		export const JAGGER: "#350e57" = "#350e57";
		export const JAGUAR: "#080110" = "#080110";
		export const JAMBALAYA: "#5b3013" = "#5b3013";
		export const JANNA: "#f4ebd3" = "#f4ebd3";
		export const JAPANESE_CARMINE: "#9d2933" = "#9d2933";
		export const JAPANESE_INDIGO: "#264348" = "#264348";
		export const JAPANESE_LAUREL: "#0a6906" = "#0a6906";
		export const JAPANESE_MAPLE: "#780109" = "#780109";
		export const JAPANESE_VIOLET: "#5b3256" = "#5b3256";
		export const JAPONICA: "#d87c63" = "#d87c63";
		export const JASMINE: "#f8de7e" = "#f8de7e";
		export const JASPER: "#d73b3e" = "#d73b3e";
		export const JAVA: "#1fc2c2" = "#1fc2c2";
		export const JAZZBERRY_JAM: "#a50b5e" = "#a50b5e";
		export const JELLY_BEAN: "#da614e" = "#da614e";
		export const JET: "#343434" = "#343434";
		export const JET_STREAM: "#b5d2ce" = "#b5d2ce";
		export const JEWEL: "#126b40" = "#126b40";
		export const JON: "#3b1f1f" = "#3b1f1f";
		export const JONQUIL: "#f4ca16" = "#f4ca16";
		export const JORDY_BLUE: "#8ab9f1" = "#8ab9f1";
		export const JUDGE_GRAY: "#544333" = "#544333";
		export const JUMBO: "#7c7b82" = "#7c7b82";
		export const JUNE_BUD: "#bdda57" = "#bdda57";
		export const JUNGLE_GREEN: "#29ab87" = "#29ab87";
		export const JUNGLE_MIST: "#b4cfd3" = "#b4cfd3";
		export const JUNIPER: "#6d9292" = "#6d9292";
		export const JUST_RIGHT: "#eccdb9" = "#eccdb9";
		export const KU_CRIMSON: "#e8000d" = "#e8000d";
		export const KABUL: "#5e483e" = "#5e483e";
		export const KAITOKE_GREEN: "#004620" = "#004620";
		export const KANGAROO: "#c6c8bd" = "#c6c8bd";
		export const KARAKA: "#1e1609" = "#1e1609";
		export const KARRY: "#ffead4" = "#ffead4";
		export const KASHMIR_BLUE: "#507096" = "#507096";
		export const KELLY_GREEN: "#4cbb17" = "#4cbb17";
		export const KELP: "#454936" = "#454936";
		export const KENYAN_COPPER: "#7c1c05" = "#7c1c05";
		export const KEPPEL: "#3ab09e" = "#3ab09e";
		export const KEY_LIME: "#e8f48c" = "#e8f48c";
		export const KEY_LIME_PIE: "#bfc921" = "#bfc921";
		export const KHAKI: "#c3b091" = "#c3b091";
		export const KIDNAPPER: "#e1ead4" = "#e1ead4";
		export const KILAMANJARO: "#240c02" = "#240c02";
		export const KILLARNEY: "#3a6a47" = "#3a6a47";
		export const KIMBERLY: "#736c9f" = "#736c9f";
		export const KINGFISHER_DAISY: "#3e0480" = "#3e0480";
		export const KOBI: "#e79fc4" = "#e79fc4";
		export const KOBICHA: "#6b4423" = "#6b4423";
		export const KOKODA: "#6e6d57" = "#6e6d57";
		export const KOMBU_GREEN: "#354230" = "#354230";
		export const KORMA: "#8f4b0e" = "#8f4b0e";
		export const KOROMIKO: "#ffbd5f" = "#ffbd5f";
		export const KOURNIKOVA: "#ffe772" = "#ffe772";
		export const KUMERA: "#886221" = "#886221";
		export const LA_PALMA: "#368716" = "#368716";
		export const LA_RIOJA: "#b3c110" = "#b3c110";
		export const LA_SALLE_GREEN: "#087830" = "#087830";
		export const LANGUID_LAVENDER: "#d6cadd" = "#d6cadd";
		export const LAPIS_LAZULI: "#26619c" = "#26619c";
		export const LAS_PALMAS: "#c6e610" = "#c6e610";
		export const LASER: "#c8b568" = "#c8b568";
		export const LAUREL: "#749378" = "#749378";
		export const LAUREL_GREEN: "#a9ba9d" = "#a9ba9d";
		export const LAVA: "#cf1020" = "#cf1020";
		export const LAVENDER: "#b57edc" = "#b57edc";
		export const LAVENDER_BLUSH: "#fff0f5" = "#fff0f5";
		export const LAVENDER_GRAY: "#c4c3d0" = "#c4c3d0";
		export const LAVENDER_INDIGO: "#9457eb" = "#9457eb";
		export const LAVENDER_MAGENTA: "#ee82ee" = "#ee82ee";
		export const LAVENDER_MIST: "#e6e6fa" = "#e6e6fa";
		export const LAVENDER_PINK: "#fbaed2" = "#fbaed2";
		export const LAVENDER_PURPLE: "#967bb6" = "#967bb6";
		export const LAVENDER_ROSE: "#fba0e3" = "#fba0e3";
		export const LAWN_GREEN: "#7cfc00" = "#7cfc00";
		export const LEATHER: "#967059" = "#967059";
		export const LEMON: "#fff700" = "#fff700";
		export const LEMON_CHIFFON: "#fffacd" = "#fffacd";
		export const LEMON_CURRY: "#cca01d" = "#cca01d";
		export const LEMON_GINGER: "#ac9e22" = "#ac9e22";
		export const LEMON_GLACIER: "#fdff00" = "#fdff00";
		export const LEMON_GRASS: "#9b9e8f" = "#9b9e8f";
		export const LEMON_LIME: "#e3ff00" = "#e3ff00";
		export const LEMON_MERINGUE: "#f6eabe" = "#f6eabe";
		export const LEMON_YELLOW: "#fff44f" = "#fff44f";
		export const LENURPLE: "#ba93d8" = "#ba93d8";
		export const LIBERTY: "#545aa7" = "#545aa7";
		export const LICORICE: "#1a1110" = "#1a1110";
		export const LIGHT_APRICOT: "#fdd5b1" = "#fdd5b1";
		export const LIGHT_BLUE: "#add8e6" = "#add8e6";
		export const LIGHT_BRILLIANT_RED: "#fe2e2e" = "#fe2e2e";
		export const LIGHT_BROWN: "#b5651d" = "#b5651d";
		export const LIGHT_CARMINE_PINK: "#e66771" = "#e66771";
		export const LIGHT_COBALT_BLUE: "#88ace0" = "#88ace0";
		export const LIGHT_CORAL: "#f08080" = "#f08080";
		export const LIGHT_CORNFLOWER_BLUE: "#93ccea" = "#93ccea";
		export const LIGHT_CRIMSON: "#f56991" = "#f56991";
		export const LIGHT_CYAN: "#e0ffff" = "#e0ffff";
		export const LIGHT_DEEP_PINK: "#ff5ccd" = "#ff5ccd";
		export const LIGHT_FRENCH_BEIGE: "#c8ad7f" = "#c8ad7f";
		export const LIGHT_FUCHSIA_PINK: "#f984ef" = "#f984ef";
		export const LIGHT_GOLDENROD_YELLOW: "#fafad2" = "#fafad2";
		export const LIGHT_GRAY: "#d3d3d3" = "#d3d3d3";
		export const LIGHT_GRAYISH_MAGENTA: "#cc99cc" = "#cc99cc";
		export const LIGHT_GREEN: "#90ee90" = "#90ee90";
		export const LIGHT_HOT_PINK: "#ffb3de" = "#ffb3de";
		export const LIGHT_KHAKI: "#f0e68c" = "#f0e68c";
		export const LIGHT_MEDIUM_ORCHID: "#d39bcb" = "#d39bcb";
		export const LIGHT_MOSS_GREEN: "#addfad" = "#addfad";
		export const LIGHT_ORCHID: "#e6a8d7" = "#e6a8d7";
		export const LIGHT_PASTEL_PURPLE: "#b19cd9" = "#b19cd9";
		export const LIGHT_PINK: "#ffb6c1" = "#ffb6c1";
		export const LIGHT_SALMON: "#ffa07a" = "#ffa07a";
		export const LIGHT_SALMON_PINK: "#ff9999" = "#ff9999";
		export const LIGHT_SEA_GREEN: "#20b2aa" = "#20b2aa";
		export const LIGHT_SKY_BLUE: "#87cefa" = "#87cefa";
		export const LIGHT_SLATE_GRAY: "#778899" = "#778899";
		export const LIGHT_STEEL_BLUE: "#b0c4de" = "#b0c4de";
		export const LIGHT_TAUPE: "#b38b6d" = "#b38b6d";
		export const LIGHT_TURQUOISE: "#afeeee" = "#afeeee";
		export const LIGHT_YELLOW: "#ffffe0" = "#ffffe0";
		export const LIGHTNING_YELLOW: "#fcc01e" = "#fcc01e";
		export const LILAC: "#c8a2c8" = "#c8a2c8";
		export const LILAC_BUSH: "#9874d3" = "#9874d3";
		export const LILAC_LUSTER: "#ae98aa" = "#ae98aa";
		export const LILY: "#c8aabf" = "#c8aabf";
		export const LILY_WHITE: "#e7f8ff" = "#e7f8ff";
		export const LIMA: "#76bd17" = "#76bd17";
		export const LIME: "#bfff00" = "#bfff00";
		export const LIME_GREEN: "#32cd32" = "#32cd32";
		export const LIMEADE: "#6f9d02" = "#6f9d02";
		export const LIMED_ASH: "#747d63" = "#747d63";
		export const LIMED_OAK: "#ac8a56" = "#ac8a56";
		export const LIMED_SPRUCE: "#394851" = "#394851";
		export const LIMERICK: "#9dc209" = "#9dc209";
		export const LINCOLN_GREEN: "#195905" = "#195905";
		export const LINEN: "#faf0e6" = "#faf0e6";
		export const LINK_WATER: "#d9e4f5" = "#d9e4f5";
		export const LIPSTICK: "#ab0563" = "#ab0563";
		export const LISBON_BROWN: "#423921" = "#423921";
		export const LITTLE_BOY_BLUE: "#6ca0dc" = "#6ca0dc";
		export const LIVER: "#674c47" = "#674c47";
		export const LIVER_CHESTNUT: "#987456" = "#987456";
		export const LIVID_BROWN: "#4d282e" = "#4d282e";
		export const LOAFER: "#eef4de" = "#eef4de";
		export const LOBLOLLY: "#bdc9ce" = "#bdc9ce";
		export const LOCHINVAR: "#2c8c84" = "#2c8c84";
		export const LOCHMARA: "#007ec7" = "#007ec7";
		export const LOCUST: "#a8af8e" = "#a8af8e";
		export const LOG_CABIN: "#242a1d" = "#242a1d";
		export const LOGAN: "#aaa9cd" = "#aaa9cd";
		export const LOLA: "#dfcfdb" = "#dfcfdb";
		export const LONDON_HUE: "#bea6c3" = "#bea6c3";
		export const LONESTAR: "#6d0101" = "#6d0101";
		export const LOTUS: "#863c3c" = "#863c3c";
		export const LOULOU: "#460b41" = "#460b41";
		export const LUCKY: "#af9f1c" = "#af9f1c";
		export const LUCKY_POINT: "#1a1a68" = "#1a1a68";
		export const LUMBER: "#ffe4cd" = "#ffe4cd";
		export const LUNAR_GREEN: "#3c493a" = "#3c493a";
		export const LUST: "#e62020" = "#e62020";
		export const LUXOR_GOLD: "#a7882c" = "#a7882c";
		export const LYNCH: "#697e9a" = "#697e9a";
		export const MSU_GREEN: "#18453b" = "#18453b";
		export const MABEL: "#d9f7ff" = "#d9f7ff";
		export const MACARONI_AND_CHEESE: "#ffbd88" = "#ffbd88";
		export const MADANG: "#b7f0be" = "#b7f0be";
		export const MADISON: "#09255d" = "#09255d";
		export const MADRAS: "#3f3002" = "#3f3002";
		export const MAGENTA: "#ca1f7b" = "#ca1f7b";
		export const MAGENTA_HAZE: "#9f4576" = "#9f4576";
		export const MAGENTA_PINK: "#cc338b" = "#cc338b";
		export const MAGIC_MINT: "#aaf0d1" = "#aaf0d1";
		export const MAGIC_POTION: "#ff4466" = "#ff4466";
		export const MAGNOLIA: "#f8f4ff" = "#f8f4ff";
		export const MAHOGANY: "#c04000" = "#c04000";
		export const MAI_TAI: "#b06608" = "#b06608";
		export const MAIZE: "#fbec5d" = "#fbec5d";
		export const MAJORELLE_BLUE: "#6050dc" = "#6050dc";
		export const MAKARA: "#897d6d" = "#897d6d";
		export const MAKO: "#444954" = "#444954";
		export const MALACHITE: "#0bda51" = "#0bda51";
		export const MALIBU: "#7dc8f7" = "#7dc8f7";
		export const MALLARD: "#233418" = "#233418";
		export const MALTA: "#bdb2a1" = "#bdb2a1";
		export const MAMBA: "#8e8190" = "#8e8190";
		export const MANATEE: "#979aaa" = "#979aaa";
		export const MANDALAY: "#ad781b" = "#ad781b";
		export const MANDARIN: "#f37a48" = "#f37a48";
		export const MANDY: "#e25465" = "#e25465";
		export const MANDYS_PINK: "#f2c3b2" = "#f2c3b2";
		export const MANGO_TANGO: "#ff8243" = "#ff8243";
		export const MANHATTAN: "#f5c999" = "#f5c999";
		export const MANTIS: "#74c365" = "#74c365";
		export const MANTLE: "#8b9c90" = "#8b9c90";
		export const MANZ: "#eeef78" = "#eeef78";
		export const MARDI_GRAS: "#880085" = "#880085";
		export const MARIGOLD: "#eaa221" = "#eaa221";
		export const MARIGOLD_YELLOW: "#fbe870" = "#fbe870";
		export const MARINER: "#286acd" = "#286acd";
		export const MAROON: "#800000" = "#800000";
		export const MAROON_OAK: "#520c17" = "#520c17";
		export const MARSHLAND: "#0b0f08" = "#0b0f08";
		export const MARTINI: "#afa09e" = "#afa09e";
		export const MARTINIQUE: "#363050" = "#363050";
		export const MARZIPAN: "#f8db9d" = "#f8db9d";
		export const MASALA: "#403b38" = "#403b38";
		export const MATISSE: "#1b659d" = "#1b659d";
		export const MATRIX: "#b05d54" = "#b05d54";
		export const MATTERHORN: "#4e3b41" = "#4e3b41";
		export const MAUVE: "#e0b0ff" = "#e0b0ff";
		export const MAUVE_TAUPE: "#915f6d" = "#915f6d";
		export const MAUVELOUS: "#ef98aa" = "#ef98aa";
		export const MAVERICK: "#d8c2d5" = "#d8c2d5";
		export const MAXIMUM_BLUE: "#47abcc" = "#47abcc";
		export const MAXIMUM_YELLOW: "#fafa37" = "#fafa37";
		export const MAY_GREEN: "#4c9141" = "#4c9141";
		export const MAYA_BLUE: "#73c2fb" = "#73c2fb";
		export const MEAT_BROWN: "#e5b73b" = "#e5b73b";
		export const MEDIUM_AQUAMARINE: "#66ddaa" = "#66ddaa";
		export const MEDIUM_BLUE: "#0000cd" = "#0000cd";
		export const MEDIUM_CANDY_APPLE_RED: "#e2062c" = "#e2062c";
		export const MEDIUM_ELECTRIC_BLUE: "#035096" = "#035096";
		export const MEDIUM_JUNGLE_GREEN: "#1c352d" = "#1c352d";
		export const MEDIUM_ORCHID: "#ba55d3" = "#ba55d3";
		export const MEDIUM_PURPLE: "#9370db" = "#9370db";
		export const MEDIUM_RED_VIOLET: "#bb3385" = "#bb3385";
		export const MEDIUM_RUBY: "#aa4069" = "#aa4069";
		export const MEDIUM_SEA_GREEN: "#3cb371" = "#3cb371";
		export const MEDIUM_SKY_BLUE: "#80daeb" = "#80daeb";
		export const MEDIUM_SLATE_BLUE: "#7b68ee" = "#7b68ee";
		export const MEDIUM_SPRING_BUD: "#c9dc87" = "#c9dc87";
		export const MEDIUM_SPRING_GREEN: "#00fa9a" = "#00fa9a";
		export const MEDIUM_TURQUOISE: "#48d1cc" = "#48d1cc";
		export const MEDIUM_VERMILION: "#d9603b" = "#d9603b";
		export const MELANIE: "#e4c2d5" = "#e4c2d5";
		export const MELANZANE: "#300529" = "#300529";
		export const MELLOW_APRICOT: "#f8b878" = "#f8b878";
		export const MELON: "#fdbcb4" = "#fdbcb4";
		export const MELROSE: "#c7c1ff" = "#c7c1ff";
		export const MERCURY: "#e5e5e5" = "#e5e5e5";
		export const MERINO: "#f6f0e6" = "#f6f0e6";
		export const MERLIN: "#413c37" = "#413c37";
		export const MERLOT: "#831923" = "#831923";
		export const METAL_PINK: "#ff00fd" = "#ff00fd";
		export const METALLIC_BRONZE: "#49371b" = "#49371b";
		export const METALLIC_COPPER: "#71291d" = "#71291d";
		export const METALLIC_GOLD: "#d4af37" = "#d4af37";
		export const METALLIC_SEAWEED: "#0a7e8c" = "#0a7e8c";
		export const METALLIC_SUNBURST: "#9c7c38" = "#9c7c38";
		export const METEOR: "#d07d12" = "#d07d12";
		export const METEORITE: "#3c1f76" = "#3c1f76";
		export const MEXICAN_PINK: "#e4007c" = "#e4007c";
		export const MEXICAN_RED: "#a72525" = "#a72525";
		export const MID_GRAY: "#5f5f6e" = "#5f5f6e";
		export const MIDNIGHT: "#702670" = "#702670";
		export const MIDNIGHT_BLUE: "#191970" = "#191970";
		export const MIDNIGHT_MOSS: "#041004" = "#041004";
		export const MIKADO: "#2d2510" = "#2d2510";
		export const MIKADO_YELLOW: "#ffc40c" = "#ffc40c";
		export const MILAN: "#faffa4" = "#faffa4";
		export const MILANO_RED: "#b81104" = "#b81104";
		export const MILK_PUNCH: "#fff6d4" = "#fff6d4";
		export const MILLBROOK: "#594433" = "#594433";
		export const MIMOSA: "#f8fdd3" = "#f8fdd3";
		export const MINDARO: "#e3f988" = "#e3f988";
		export const MINE_SHAFT: "#323232" = "#323232";
		export const MINERAL_GREEN: "#3f5d53" = "#3f5d53";
		export const MING: "#36747d" = "#36747d";
		export const MINION_YELLOW: "#f5e050" = "#f5e050";
		export const MINSK: "#3f307f" = "#3f307f";
		export const MINT: "#3eb489" = "#3eb489";
		export const MINT_CREAM: "#f5fffa" = "#f5fffa";
		export const MINT_GREEN: "#98ff98" = "#98ff98";
		export const MINT_JULEP: "#f1eec1" = "#f1eec1";
		export const MINT_TULIP: "#c4f4eb" = "#c4f4eb";
		export const MIRAGE: "#161928" = "#161928";
		export const MISCHKA: "#d1d2dd" = "#d1d2dd";
		export const MIST_GRAY: "#c4c4bc" = "#c4c4bc";
		export const MISTY_MOSS: "#bbb477" = "#bbb477";
		export const MISTY_ROSE: "#ffe4e1" = "#ffe4e1";
		export const MOBSTER: "#7f7589" = "#7f7589";
		export const MOCCACCINO: "#6e1d14" = "#6e1d14";
		export const MOCCASIN: "#ffe4b5" = "#ffe4b5";
		export const MOCHA: "#782d19" = "#782d19";
		export const MOJO: "#c04737" = "#c04737";
		export const MONA_LISA: "#ffa194" = "#ffa194";
		export const MONARCH: "#8b0723" = "#8b0723";
		export const MONDO: "#4a3c30" = "#4a3c30";
		export const MONGOOSE: "#b5a27f" = "#b5a27f";
		export const MONSOON: "#8a8389" = "#8a8389";
		export const MONTE_CARLO: "#83d0c6" = "#83d0c6";
		export const MONZA: "#c7031e" = "#c7031e";
		export const MOODY_BLUE: "#7f76d3" = "#7f76d3";
		export const MOON_GLOW: "#fcfeda" = "#fcfeda";
		export const MOON_MIST: "#dcddcc" = "#dcddcc";
		export const MOON_RAKER: "#d6cef6" = "#d6cef6";
		export const MOONSTONE_BLUE: "#73a9c2" = "#73a9c2";
		export const MORDANT_RED: "#ae0c00" = "#ae0c00";
		export const MORNING_GLORY: "#9edee0" = "#9edee0";
		export const MOROCCO_BROWN: "#441d00" = "#441d00";
		export const MORTAR: "#504351" = "#504351";
		export const MOSQUE: "#036a6e" = "#036a6e";
		export const MOSS_GREEN: "#8a9a5b" = "#8a9a5b";
		export const MOUNTAIN_MEADOW: "#30ba8f" = "#30ba8f";
		export const MOUNTAIN_MIST: "#959396" = "#959396";
		export const MOUNTBATTEN_PINK: "#997a8d" = "#997a8d";
		export const MUDDY_WATERS: "#b78e5c" = "#b78e5c";
		export const MUESLI: "#aa8b5b" = "#aa8b5b";
		export const MUGHAL_GREEN: "#306030" = "#306030";
		export const MULBERRY: "#c54b8c" = "#c54b8c";
		export const MULBERRY_WOOD: "#5c0536" = "#5c0536";
		export const MULE_FAWN: "#8c472f" = "#8c472f";
		export const MULLED_WINE: "#4e4562" = "#4e4562";
		export const MUMMYS_TOMB: "#828e84" = "#828e84";
		export const MUNSELL_BLUE: "#0093af" = "#0093af";
		export const MUNSELL_GREEN: "#00a877" = "#00a877";
		export const MUNSELL_PURPLE: "#9f00c5" = "#9f00c5";
		export const MUNSELL_RED: "#f2003c" = "#f2003c";
		export const MUNSELL_YELLOW: "#efcc00" = "#efcc00";
		export const MUSTARD: "#ffdb58" = "#ffdb58";
		export const MY_PINK: "#d69188" = "#d69188";
		export const MY_SIN: "#ffb31f" = "#ffb31f";
		export const MYRTLE_GREEN: "#317873" = "#317873";
		export const MYSTIC: "#d65282" = "#d65282";
		export const MYSTIC_MAROON: "#ad4379" = "#ad4379";
		export const NCS_BLUE: "#0087bd" = "#0087bd";
		export const NCS_GREEN: "#009f6b" = "#009f6b";
		export const NCS_RED: "#c40233" = "#c40233";
		export const NADESHIKO_PINK: "#f6adc6" = "#f6adc6";
		export const NANDOR: "#4b5d52" = "#4b5d52";
		export const NAPA: "#aca494" = "#aca494";
		export const NAPIER_GREEN: "#2a8000" = "#2a8000";
		export const NAPLES_YELLOW: "#fada5e" = "#fada5e";
		export const NARVIK: "#edf9f1" = "#edf9f1";
		export const NATURAL_GRAY: "#8b8680" = "#8b8680";
		export const NAVAJO_WHITE: "#ffdead" = "#ffdead";
		export const NAVY: "#000080" = "#000080";
		export const NEBULA: "#cbdbd6" = "#cbdbd6";
		export const NEGRONI: "#ffe2c5" = "#ffe2c5";
		export const NEON_CARROT: "#ffa343" = "#ffa343";
		export const NEON_FUCHSIA: "#fe4164" = "#fe4164";
		export const NEON_GREEN: "#39ff14" = "#39ff14";
		export const NEPAL: "#8eabc1" = "#8eabc1";
		export const NEPTUNE: "#7cb7bb" = "#7cb7bb";
		export const NERO: "#140600" = "#140600";
		export const NEVADA: "#646e75" = "#646e75";
		export const NEW_CAR: "#214fc6" = "#214fc6";
		export const NEW_ORLEANS: "#f3d69d" = "#f3d69d";
		export const NEW_YORK_PINK: "#d7837f" = "#d7837f";
		export const NIAGARA: "#06a189" = "#06a189";
		export const NICKEL: "#727472" = "#727472";
		export const NIGHT_RIDER: "#1f120f" = "#1f120f";
		export const NIGHT_SHADZ: "#aa375a" = "#aa375a";
		export const NILE_BLUE: "#193751" = "#193751";
		export const NOBEL: "#b7b1b1" = "#b7b1b1";
		export const NOMAD: "#bab1a2" = "#bab1a2";
		export const NON_PHOTO_BLUE: "#a4dded" = "#a4dded";
		export const NORTH_TEXAS_GREEN: "#059033" = "#059033";
		export const NORWAY: "#a8bd9f" = "#a8bd9f";
		export const NUGGET: "#c59922" = "#c59922";
		export const NUTMEG: "#81422c" = "#81422c";
		export const NUTMEG_WOOD_FINISH: "#683600" = "#683600";
		export const NYANZA: "#e9ffdb" = "#e9ffdb";
		export const OASIS: "#feefce" = "#feefce";
		export const OBSERVATORY: "#02866f" = "#02866f";
		export const OCEAN_BLUE: "#4f42b5" = "#4f42b5";
		export const OCEAN_BOAT_BLUE: "#0077be" = "#0077be";
		export const OCEAN_GREEN: "#48bf91" = "#48bf91";
		export const OCHRE: "#cc7722" = "#cc7722";
		export const OFF_GREEN: "#e6f8f3" = "#e6f8f3";
		export const OFF_YELLOW: "#fef9e3" = "#fef9e3";
		export const OGRE_ODOR: "#fd5240" = "#fd5240";
		export const OIL: "#281e15" = "#281e15";
		export const OLD_BRICK: "#901e1e" = "#901e1e";
		export const OLD_BURGUNDY: "#43302e" = "#43302e";
		export const OLD_COPPER: "#724a2f" = "#724a2f";
		export const OLD_GOLD: "#cfb53b" = "#cfb53b";
		export const OLD_HELIOTROPE: "#563c5c" = "#563c5c";
		export const OLD_LACE: "#fdf5e6" = "#fdf5e6";
		export const OLD_LAVENDER: "#796878" = "#796878";
		export const OLD_MOSS_GREEN: "#867e36" = "#867e36";
		export const OLD_ROSE: "#c08081" = "#c08081";
		export const OLD_SILVER: "#848482" = "#848482";
		export const OLIVE: "#808000" = "#808000";
		export const OLIVE_DRAB: "#6b8e23" = "#6b8e23";
		export const OLIVE_DRAB_SEVEN: "#3c341f" = "#3c341f";
		export const OLIVE_GREEN: "#b5b35c" = "#b5b35c";
		export const OLIVE_HAZE: "#8b8470" = "#8b8470";
		export const OLIVETONE: "#716e10" = "#716e10";
		export const OLIVINE: "#9ab973" = "#9ab973";
		export const ONAHAU: "#cdf4ff" = "#cdf4ff";
		export const ONION: "#2f270e" = "#2f270e";
		export const ONYX: "#353839" = "#353839";
		export const OPAL: "#a9c6c2" = "#a9c6c2";
		export const OPERA_MAUVE: "#b784a7" = "#b784a7";
		export const OPIUM: "#8e6f70" = "#8e6f70";
		export const ORACLE: "#377475" = "#377475";
		export const ORANGE: "#ff7f00" = "#ff7f00";
		export const ORANGE_PEEL: "#ff9f00" = "#ff9f00";
		export const ORANGE_RED: "#ff4500" = "#ff4500";
		export const ORANGE_ROUGHY: "#c45719" = "#c45719";
		export const ORANGE_SODA: "#fa5b3d" = "#fa5b3d";
		export const ORANGE_WHITE: "#fefced" = "#fefced";
		export const ORANGE_YELLOW: "#f8d568" = "#f8d568";
		export const ORCHID: "#da70d6" = "#da70d6";
		export const ORCHID_PINK: "#f2bdcd" = "#f2bdcd";
		export const ORCHID_WHITE: "#fffdf3" = "#fffdf3";
		export const OREGON: "#9b4703" = "#9b4703";
		export const ORGAN: "#6c2e1f" = "#6c2e1f";
		export const ORIENT: "#015e85" = "#015e85";
		export const ORIENTAL_PINK: "#c69191" = "#c69191";
		export const ORINOCO: "#f3fbd4" = "#f3fbd4";
		export const ORIOLES_ORANGE: "#fb4f14" = "#fb4f14";
		export const OSLO_GRAY: "#878d91" = "#878d91";
		export const OTTOMAN: "#e9f8ed" = "#e9f8ed";
		export const OUTER_SPACE: "#414a4c" = "#414a4c";
		export const OUTRAGEOUS_ORANGE: "#ff6e4a" = "#ff6e4a";
		export const OXFORD_BLUE: "#002147" = "#002147";
		export const OXLEY: "#779e86" = "#779e86";
		export const OYSTER_BAY: "#dafaff" = "#dafaff";
		export const OYSTER_PINK: "#e9cecd" = "#e9cecd";
		export const PAARL: "#a65529" = "#a65529";
		export const PABLO: "#776f61" = "#776f61";
		export const PACIFIC_BLUE: "#1ca9c9" = "#1ca9c9";
		export const PACIFIKA: "#778120" = "#778120";
		export const PACO: "#411f10" = "#411f10";
		export const PADUA: "#ade6c4" = "#ade6c4";
		export const PAKISTAN_GREEN: "#006600" = "#006600";
		export const PALATINATE_BLUE: "#273be2" = "#273be2";
		export const PALATINATE_PURPLE: "#682860" = "#682860";
		export const PALE_BROWN: "#987654" = "#987654";
		export const PALE_CANARY: "#ffff99" = "#ffff99";
		export const PALE_CARMINE: "#af4035" = "#af4035";
		export const PALE_CERULEAN: "#9bc4e2" = "#9bc4e2";
		export const PALE_CHESTNUT: "#ddadaf" = "#ddadaf";
		export const PALE_COPPER: "#da8a67" = "#da8a67";
		export const PALE_CORNFLOWER_BLUE: "#abcdef" = "#abcdef";
		export const PALE_CYAN: "#87d3f8" = "#87d3f8";
		export const PALE_GOLD: "#e6be8a" = "#e6be8a";
		export const PALE_GOLDENROD: "#eee8aa" = "#eee8aa";
		export const PALE_GREEN: "#98fb98" = "#98fb98";
		export const PALE_LAVENDER: "#dcd0ff" = "#dcd0ff";
		export const PALE_LEAF: "#c0d3b9" = "#c0d3b9";
		export const PALE_MAGENTA: "#f984e5" = "#f984e5";
		export const PALE_MAGENTA_PINK: "#ff99cc" = "#ff99cc";
		export const PALE_OYSTER: "#988d77" = "#988d77";
		export const PALE_PINK: "#fadadd" = "#fadadd";
		export const PALE_PLUM: "#dda0dd" = "#dda0dd";
		export const PALE_PRIM: "#fdfeb8" = "#fdfeb8";
		export const PALE_RED_VIOLET: "#db7093" = "#db7093";
		export const PALE_ROBIN_EGG_BLUE: "#96ded1" = "#96ded1";
		export const PALE_ROSE: "#ffe1f2" = "#ffe1f2";
		export const PALE_SILVER: "#c9c0bb" = "#c9c0bb";
		export const PALE_SKY: "#6e7783" = "#6e7783";
		export const PALE_SLATE: "#c3bfc1" = "#c3bfc1";
		export const PALE_SPRING_BUD: "#ecebbd" = "#ecebbd";
		export const PALE_TAUPE: "#bc987e" = "#bc987e";
		export const PALE_VIOLET: "#cc99ff" = "#cc99ff";
		export const PALM_GREEN: "#09230f" = "#09230f";
		export const PALM_LEAF: "#19330e" = "#19330e";
		export const PAMPAS: "#f4f2ee" = "#f4f2ee";
		export const PANACHE: "#eaf6ee" = "#eaf6ee";
		export const PANCHO: "#edcdab" = "#edcdab";
		export const PANSY_PURPLE: "#78184a" = "#78184a";
		export const PANTONE_BLUE: "#0018a8" = "#0018a8";
		export const PANTONE_GREEN: "#00ad43" = "#00ad43";
		export const PANTONE_MAGENTA: "#d0417e" = "#d0417e";
		export const PANTONE_ORANGE: "#ff5800" = "#ff5800";
		export const PANTONE_PINK: "#d74894" = "#d74894";
		export const PANTONE_YELLOW: "#fedf00" = "#fedf00";
		export const PAOLO_VERONESE_GREEN: "#009b7d" = "#009b7d";
		export const PAPAYA_WHIP: "#ffefd5" = "#ffefd5";
		export const PAPRIKA: "#8d0226" = "#8d0226";
		export const PARADISE_PINK: "#e63e62" = "#e63e62";
		export const PARADISO: "#317d82" = "#317d82";
		export const PARCHMENT: "#f1e9d2" = "#f1e9d2";
		export const PARIS_DAISY: "#fff46e" = "#fff46e";
		export const PARIS_M: "#26056a" = "#26056a";
		export const PARIS_WHITE: "#cadcd4" = "#cadcd4";
		export const PARSLEY: "#134f19" = "#134f19";
		export const PASTEL_BLUE: "#aec6cf" = "#aec6cf";
		export const PASTEL_BROWN: "#836953" = "#836953";
		export const PASTEL_GRAY: "#cfcfc4" = "#cfcfc4";
		export const PASTEL_GREEN: "#77dd77" = "#77dd77";
		export const PASTEL_MAGENTA: "#f49ac2" = "#f49ac2";
		export const PASTEL_ORANGE: "#ffb347" = "#ffb347";
		export const PASTEL_PINK: "#dea5a4" = "#dea5a4";
		export const PASTEL_PURPLE: "#b39eb5" = "#b39eb5";
		export const PASTEL_RED: "#ff6961" = "#ff6961";
		export const PASTEL_VIOLET: "#cb99c9" = "#cb99c9";
		export const PASTEL_YELLOW: "#fdfd96" = "#fdfd96";
		export const PATINA: "#639a8f" = "#639a8f";
		export const PATTENS_BLUE: "#def5ff" = "#def5ff";
		export const PAUA: "#260368" = "#260368";
		export const PAVLOVA: "#d7c498" = "#d7c498";
		export const PAYNES_GREY: "#536878" = "#536878";
		export const PEACH: "#ffcba4" = "#ffcba4";
		export const PEACH_CREAM: "#fff0db" = "#fff0db";
		export const PEACH_ORANGE: "#ffcc99" = "#ffcc99";
		export const PEACH_PUFF: "#ffdab9" = "#ffdab9";
		export const PEACH_SCHNAPPS: "#ffdcd6" = "#ffdcd6";
		export const PEACH_YELLOW: "#fadfad" = "#fadfad";
		export const PEANUT: "#782f16" = "#782f16";
		export const PEAR: "#d1e231" = "#d1e231";
		export const PEARL: "#eae0c8" = "#eae0c8";
		export const PEARL_AQUA: "#88d8c0" = "#88d8c0";
		export const PEARL_BUSH: "#e8e0d5" = "#e8e0d5";
		export const PEARL_LUSTA: "#fcf4dc" = "#fcf4dc";
		export const PEARL_MYSTIC_TURQUOISE: "#32c6a6" = "#32c6a6";
		export const PEARLY_PURPLE: "#b768a2" = "#b768a2";
		export const PEAT: "#716b56" = "#716b56";
		export const PELOROUS: "#3eabbf" = "#3eabbf";
		export const PEPPERMINT: "#e3f5e1" = "#e3f5e1";
		export const PERANO: "#a9bef2" = "#a9bef2";
		export const PERFUME: "#d0bef8" = "#d0bef8";
		export const PERIDOT: "#e6e200" = "#e6e200";
		export const PERIGLACIAL_BLUE: "#e1e6d6" = "#e1e6d6";
		export const PERIWINKLE: "#ccccff" = "#ccccff";
		export const PERIWINKLE_GRAY: "#c3cde6" = "#c3cde6";
		export const PERMANENT_GERANIUM_LAKE: "#e12c2c" = "#e12c2c";
		export const PERSIAN_BLUE: "#1c39bb" = "#1c39bb";
		export const PERSIAN_GREEN: "#00a693" = "#00a693";
		export const PERSIAN_INDIGO: "#32127a" = "#32127a";
		export const PERSIAN_ORANGE: "#d99058" = "#d99058";
		export const PERSIAN_PINK: "#f77fbe" = "#f77fbe";
		export const PERSIAN_PLUM: "#701c1c" = "#701c1c";
		export const PERSIAN_RED: "#cc3333" = "#cc3333";
		export const PERSIAN_ROSE: "#fe28a2" = "#fe28a2";
		export const PERSIMMON: "#ec5800" = "#ec5800";
		export const PERU: "#cd853f" = "#cd853f";
		export const PERU_TAN: "#7f3a02" = "#7f3a02";
		export const PESTO: "#7c7631" = "#7c7631";
		export const PETITE_ORCHID: "#db9690" = "#db9690";
		export const PEWTER: "#96a8a1" = "#96a8a1";
		export const PEWTER_BLUE: "#8ba8b7" = "#8ba8b7";
		export const PHARLAP: "#a3807b" = "#a3807b";
		export const PHTHALO_BLUE: "#000f89" = "#000f89";
		export const PHTHALO_GREEN: "#123524" = "#123524";
		export const PICASSO: "#fff39d" = "#fff39d";
		export const PICKLED_BEAN: "#6e4826" = "#6e4826";
		export const PICKLED_BLUEWOOD: "#314459" = "#314459";
		export const PICTON_BLUE: "#45b1e8" = "#45b1e8";
		export const PICTORIAL_CARMINE: "#c30b4e" = "#c30b4e";
		export const PIG_PINK: "#fdd7e4" = "#fdd7e4";
		export const PIGEON_POST: "#afbdd9" = "#afbdd9";
		export const PIGGY_PINK: "#fddde6" = "#fddde6";
		export const PIGMENT_BLUE: "#333399" = "#333399";
		export const PIGMENT_GREEN: "#00a550" = "#00a550";
		export const PIGMENT_RED: "#ed1c24" = "#ed1c24";
		export const PINE_CONE: "#6d5e54" = "#6d5e54";
		export const PINE_GLADE: "#c7cd90" = "#c7cd90";
		export const PINE_GREEN: "#01796f" = "#01796f";
		export const PINE_TREE: "#171f04" = "#171f04";
		export const PINK: "#ffc0cb" = "#ffc0cb";
		export const PINK_FLAMINGO: "#fc74fd" = "#fc74fd";
		export const PINK_FLARE: "#e1c0c8" = "#e1c0c8";
		export const PINK_LACE: "#ffddf4" = "#ffddf4";
		export const PINK_LADY: "#fff1d8" = "#fff1d8";
		export const PINK_LAVENDER: "#d8b2d1" = "#d8b2d1";
		export const PINK_ORANGE: "#ff9966" = "#ff9966";
		export const PINK_PEARL: "#e7accf" = "#e7accf";
		export const PINK_RASPBERRY: "#980036" = "#980036";
		export const PINK_SHERBET: "#f78fa7" = "#f78fa7";
		export const PINK_SWAN: "#beb5b7" = "#beb5b7";
		export const PIPER: "#c96323" = "#c96323";
		export const PIPI: "#fef4cc" = "#fef4cc";
		export const PIPPIN: "#ffe1df" = "#ffe1df";
		export const PIRATE_GOLD: "#ba7f03" = "#ba7f03";
		export const PISTACHIO: "#93c572" = "#93c572";
		export const PIXIE_GREEN: "#c0d8b6" = "#c0d8b6";
		export const PIXIE_POWDER: "#391285" = "#391285";
		export const PIZAZZ: "#ff9000" = "#ff9000";
		export const PIZZA: "#c99415" = "#c99415";
		export const PLANTATION: "#27504b" = "#27504b";
		export const PLATINUM: "#e5e4e2" = "#e5e4e2";
		export const PLUM: "#8e4585" = "#8e4585";
		export const PLUMP_PURPLE: "#5946b2" = "#5946b2";
		export const POHUTUKAWA: "#8f021c" = "#8f021c";
		export const POLAR: "#e5f9f6" = "#e5f9f6";
		export const POLISHED_PINE: "#5da493" = "#5da493";
		export const POLO_BLUE: "#8da8cc" = "#8da8cc";
		export const POMEGRANATE: "#f34723" = "#f34723";
		export const POMPADOUR: "#660045" = "#660045";
		export const POPSTAR: "#be4f62" = "#be4f62";
		export const PORCELAIN: "#eff2f3" = "#eff2f3";
		export const PORSCHE: "#eaae69" = "#eaae69";
		export const PORT_GORE: "#251f4f" = "#251f4f";
		export const PORTAFINO: "#ffffb4" = "#ffffb4";
		export const PORTAGE: "#8b9fee" = "#8b9fee";
		export const PORTICA: "#f9e663" = "#f9e663";
		export const PORTLAND_ORANGE: "#ff5a36" = "#ff5a36";
		export const POT_POURRI: "#f5e7e2" = "#f5e7e2";
		export const POTTERS_CLAY: "#8c5738" = "#8c5738";
		export const POWDER_ASH: "#bcc9c2" = "#bcc9c2";
		export const POWDER_BLUE: "#b0e0e6" = "#b0e0e6";
		export const PRAIRIE_SAND: "#9a3820" = "#9a3820";
		export const PRELUDE: "#d0c0e5" = "#d0c0e5";
		export const PRIM: "#f0e2ec" = "#f0e2ec";
		export const PRIMROSE: "#edea99" = "#edea99";
		export const PRINCESS_PERFUME: "#ff85cf" = "#ff85cf";
		export const PRINCETON_ORANGE: "#f58025" = "#f58025";
		export const PROCESS_CYAN: "#00b7eb" = "#00b7eb";
		export const PROCESS_MAGENTA: "#ff0090" = "#ff0090";
		export const PROVINCIAL_PINK: "#fef5f1" = "#fef5f1";
		export const PRUSSIAN_BLUE: "#003153" = "#003153";
		export const PSYCHEDELIC_PURPLE: "#df00ff" = "#df00ff";
		export const PUCE: "#cc8899" = "#cc8899";
		export const PUEBLO: "#7d2c14" = "#7d2c14";
		export const PUERTO_RICO: "#3fc1aa" = "#3fc1aa";
		export const PULLMAN_BROWN: "#644117" = "#644117";
		export const PULLMAN_GREEN: "#3b331c" = "#3b331c";
		export const PUMICE: "#c2cac4" = "#c2cac4";
		export const PUMPKIN: "#ff7518" = "#ff7518";
		export const PUMPKIN_SKIN: "#b1610b" = "#b1610b";
		export const PUNCH: "#dc4333" = "#dc4333";
		export const PUNGA: "#4d3d14" = "#4d3d14";
		export const PURPLE: "#800080" = "#800080";
		export const PURPLE_HEART: "#69359c" = "#69359c";
		export const PURPLE_MOUNTAIN_MAJESTY: "#9678b6" = "#9678b6";
		export const PURPLE_NAVY: "#4e5180" = "#4e5180";
		export const PURPLE_PIZZAZZ: "#fe4eda" = "#fe4eda";
		export const PURPLE_PLUM: "#9c51b6" = "#9c51b6";
		export const PURPLE_TAUPE: "#50404d" = "#50404d";
		export const PURPUREUS: "#9a4eae" = "#9a4eae";
		export const PUTTY: "#e7cd8c" = "#e7cd8c";
		export const QUARTER_PEARL_LUSTA: "#fffdf4" = "#fffdf4";
		export const QUARTER_SPANISH_WHITE: "#f7f2e1" = "#f7f2e1";
		export const QUARTZ: "#51484f" = "#51484f";
		export const QUEEN_BLUE: "#436b95" = "#436b95";
		export const QUEEN_PINK: "#e8ccd7" = "#e8ccd7";
		export const QUICK_SILVER: "#a6a6a6" = "#a6a6a6";
		export const QUICKSAND: "#bd978e" = "#bd978e";
		export const QUILL_GRAY: "#d6d6d1" = "#d6d6d1";
		export const QUINACRIDONE_MAGENTA: "#8e3a59" = "#8e3a59";
		export const QUINCY: "#623f2d" = "#623f2d";
		export const RYB_BLUE: "#0247fe" = "#0247fe";
		export const RYB_GREEN: "#66b032" = "#66b032";
		export const RYB_ORANGE: "#fb9902" = "#fb9902";
		export const RYB_RED: "#fe2712" = "#fe2712";
		export const RYB_VIOLET: "#8601af" = "#8601af";
		export const RYB_YELLOW: "#fefe33" = "#fefe33";
		export const RACING_GREEN: "#0c1911" = "#0c1911";
		export const RADICAL_RED: "#ff355e" = "#ff355e";
		export const RAFFIA: "#eadab8" = "#eadab8";
		export const RAINEE: "#b9c8ac" = "#b9c8ac";
		export const RAISIN_BLACK: "#242124" = "#242124";
		export const RAJAH: "#fbab60" = "#fbab60";
		export const RANGITOTO: "#2e3222" = "#2e3222";
		export const RANGOON_GREEN: "#1c1e13" = "#1c1e13";
		export const RASPBERRY: "#e30b5d" = "#e30b5d";
		export const RASPBERRY_PINK: "#e25098" = "#e25098";
		export const RAVEN: "#727b89" = "#727b89";
		export const RAW_SIENNA: "#d68a59" = "#d68a59";
		export const RAW_UMBER: "#826644" = "#826644";
		export const RAZZLE_DAZZLE_ROSE: "#ff33cc" = "#ff33cc";
		export const RAZZMATAZZ: "#e3256b" = "#e3256b";
		export const RAZZMIC_BERRY: "#8d4e85" = "#8d4e85";
		export const REBECCA_PURPLE: "#663399" = "#663399";
		export const REBEL: "#3c1206" = "#3c1206";
		export const RED: "#ff0000" = "#ff0000";
		export const RED_BEECH: "#7b3801" = "#7b3801";
		export const RED_BERRY: "#8e0000" = "#8e0000";
		export const RED_DAMASK: "#da6a41" = "#da6a41";
		export const RED_DEVIL: "#860111" = "#860111";
		export const RED_ORANGE: "#ff5349" = "#ff5349";
		export const RED_OXIDE: "#6e0902" = "#6e0902";
		export const RED_PURPLE: "#e40078" = "#e40078";
		export const RED_RIBBON: "#ed0a3f" = "#ed0a3f";
		export const RED_ROBIN: "#80341f" = "#80341f";
		export const RED_SALSA: "#fd3a4a" = "#fd3a4a";
		export const RED_STAGE: "#d05f04" = "#d05f04";
		export const RED_VIOLET: "#c71585" = "#c71585";
		export const REDWOOD: "#a45a52" = "#a45a52";
		export const REEF: "#c9ffa2" = "#c9ffa2";
		export const REEF_GOLD: "#9f821c" = "#9f821c";
		export const REGAL_BLUE: "#013f6a" = "#013f6a";
		export const REGALIA: "#522d80" = "#522d80";
		export const REGENT_GRAY: "#86949f" = "#86949f";
		export const REGENT_ST_BLUE: "#aad6e6" = "#aad6e6";
		export const REMY: "#feebf3" = "#feebf3";
		export const RENO_SAND: "#a86515" = "#a86515";
		export const RESOLUTION_BLUE: "#002387" = "#002387";
		export const REVOLVER: "#2c1632" = "#2c1632";
		export const RHINO: "#2e3f62" = "#2e3f62";
		export const RHYTHM: "#777696" = "#777696";
		export const RICE_CAKE: "#fffef0" = "#fffef0";
		export const RICE_FLOWER: "#eeffe2" = "#eeffe2";
		export const RICH_BLACK: "#004040" = "#004040";
		export const RICH_BRILLIANT_LAVENDER: "#f1a7fe" = "#f1a7fe";
		export const RICH_CARMINE: "#d70040" = "#d70040";
		export const RICH_ELECTRIC_BLUE: "#0892d0" = "#0892d0";
		export const RICH_GOLD: "#a85307" = "#a85307";
		export const RICH_LAVENDER: "#a76bcf" = "#a76bcf";
		export const RICH_LILAC: "#b666d2" = "#b666d2";
		export const RICH_MAROON: "#b03060" = "#b03060";
		export const RIFLE_GREEN: "#444c38" = "#444c38";
		export const RIO_GRANDE: "#bbd009" = "#bbd009";
		export const RIPE_LEMON: "#f4d81c" = "#f4d81c";
		export const RIPE_PLUM: "#410056" = "#410056";
		export const RIPTIDE: "#8be6d8" = "#8be6d8";
		export const RIVER_BED: "#434c59" = "#434c59";
		export const ROAST_COFFEE: "#704241" = "#704241";
		export const ROB_ROY: "#eac674" = "#eac674";
		export const ROBIN_EGG_BLUE: "#00cccc" = "#00cccc";
		export const ROCK: "#4d3833" = "#4d3833";
		export const ROCK_BLUE: "#9eb1cd" = "#9eb1cd";
		export const ROCK_SPRAY: "#ba450c" = "#ba450c";
		export const ROCKET_METALLIC: "#8a7f80" = "#8a7f80";
		export const RODEO_DUST: "#c9b29b" = "#c9b29b";
		export const ROLLING_STONE: "#747d83" = "#747d83";
		export const ROMAN: "#de6360" = "#de6360";
		export const ROMAN_COFFEE: "#795d4c" = "#795d4c";
		export const ROMAN_SILVER: "#838996" = "#838996";
		export const ROMANCE: "#fffefd" = "#fffefd";
		export const ROMANTIC: "#ffd2b7" = "#ffd2b7";
		export const RONCHI: "#ecc54e" = "#ecc54e";
		export const ROOF_TERRACOTTA: "#a62f20" = "#a62f20";
		export const ROPE: "#8e4d1e" = "#8e4d1e";
		export const ROSE: "#ff007f" = "#ff007f";
		export const ROSE_BONBON: "#f9429e" = "#f9429e";
		export const ROSE_BUD: "#fbb2a3" = "#fbb2a3";
		export const ROSE_BUD_CHERRY: "#800b47" = "#800b47";
		export const ROSE_DUST: "#9e5e6f" = "#9e5e6f";
		export const ROSE_EBONY: "#674846" = "#674846";
		export const ROSE_FOG: "#e7bcb4" = "#e7bcb4";
		export const ROSE_GOLD: "#b76e79" = "#b76e79";
		export const ROSE_PINK: "#ff66cc" = "#ff66cc";
		export const ROSE_RED: "#c21e56" = "#c21e56";
		export const ROSE_TAUPE: "#905d5d" = "#905d5d";
		export const ROSE_VALE: "#ab4e52" = "#ab4e52";
		export const ROSE_WHITE: "#fff6f5" = "#fff6f5";
		export const ROSE_OF_SHARON: "#bf5500" = "#bf5500";
		export const ROSEWOOD: "#65000b" = "#65000b";
		export const ROSSO_CORSA: "#d40000" = "#d40000";
		export const ROSY_BROWN: "#bc8f8f" = "#bc8f8f";
		export const ROTI: "#c6a84b" = "#c6a84b";
		export const ROUGE: "#a23b6c" = "#a23b6c";
		export const ROYAL_AIR_FORCE_BLUE: "#5d8aa8" = "#5d8aa8";
		export const ROYAL_AZURE: "#0038a8" = "#0038a8";
		export const ROYAL_BLUE: "#4169e1" = "#4169e1";
		export const ROYAL_FUCHSIA: "#ca2c92" = "#ca2c92";
		export const ROYAL_HEATH: "#ab3472" = "#ab3472";
		export const ROYAL_PURPLE: "#7851a9" = "#7851a9";
		export const RUBER: "#ce4676" = "#ce4676";
		export const RUBINE_RED: "#d10056" = "#d10056";
		export const RUBY: "#e0115f" = "#e0115f";
		export const RUBY_RED: "#9b111e" = "#9b111e";
		export const RUDDY: "#ff0028" = "#ff0028";
		export const RUDDY_BROWN: "#bb6528" = "#bb6528";
		export const RUDDY_PINK: "#e18e96" = "#e18e96";
		export const RUFOUS: "#a81c07" = "#a81c07";
		export const RUM: "#796989" = "#796989";
		export const RUM_SWIZZLE: "#f9f8e4" = "#f9f8e4";
		export const RUSSET: "#80461b" = "#80461b";
		export const RUSSETT: "#755a57" = "#755a57";
		export const RUSSIAN_GREEN: "#679267" = "#679267";
		export const RUSSIAN_VIOLET: "#32174d" = "#32174d";
		export const RUST: "#b7410e" = "#b7410e";
		export const RUSTIC_RED: "#480404" = "#480404";
		export const RUSTY_NAIL: "#86560a" = "#86560a";
		export const RUSTY_RED: "#da2c43" = "#da2c43";
		export const SAE_ECE_AMBER: "#ff7e00" = "#ff7e00";
		export const SACRAMENTO_STATE_GREEN: "#043927" = "#043927";
		export const SADDLE: "#4c3024" = "#4c3024";
		export const SADDLE_BROWN: "#8b4513" = "#8b4513";
		export const SAFETY_ORANGE: "#ff7800" = "#ff7800";
		export const SAFETY_YELLOW: "#eed202" = "#eed202";
		export const SAFFRON: "#f4c430" = "#f4c430";
		export const SAFFRON_MANGO: "#f9bf58" = "#f9bf58";
		export const SAGE: "#bcb88a" = "#bcb88a";
		export const SAHARA: "#b7a214" = "#b7a214";
		export const SAHARA_SAND: "#f1e788" = "#f1e788";
		export const SAIL: "#b8e0f9" = "#b8e0f9";
		export const SALEM: "#097f4b" = "#097f4b";
		export const SALMON: "#fa8072" = "#fa8072";
		export const SALMON_PINK: "#ff91a4" = "#ff91a4";
		export const SALOMIE: "#fedb8d" = "#fedb8d";
		export const SALT_BOX: "#685e6e" = "#685e6e";
		export const SALTPAN: "#f1f7f2" = "#f1f7f2";
		export const SAMBUCA: "#3a2010" = "#3a2010";
		export const SAN_FELIX: "#0b6207" = "#0b6207";
		export const SAN_JUAN: "#304b6a" = "#304b6a";
		export const SAN_MARINO: "#456cac" = "#456cac";
		export const SAND_DUNE: "#967117" = "#967117";
		export const SANDAL: "#aa8d6f" = "#aa8d6f";
		export const SANDRIFT: "#ab917a" = "#ab917a";
		export const SANDSTONE: "#796d62" = "#796d62";
		export const SANDSTORM: "#ecd540" = "#ecd540";
		export const SANDWISP: "#f5e7a2" = "#f5e7a2";
		export const SANDY_BEACH: "#ffeac8" = "#ffeac8";
		export const SANDY_BROWN: "#f4a460" = "#f4a460";
		export const SANGRIA: "#92000a" = "#92000a";
		export const SANGUINE_BROWN: "#8d3d38" = "#8d3d38";
		export const SANTA_FE: "#b16d52" = "#b16d52";
		export const SANTAS_GRAY: "#9fa0b1" = "#9fa0b1";
		export const SAP_GREEN: "#507d2a" = "#507d2a";
		export const SAPLING: "#ded4a4" = "#ded4a4";
		export const SAPPHIRE: "#0f52ba" = "#0f52ba";
		export const SAPPHIRE_BLUE: "#0067a5" = "#0067a5";
		export const SARATOGA: "#555b10" = "#555b10";
		export const SASQUATCH_SOCKS: "#ff4681" = "#ff4681";
		export const SATIN_LINEN: "#e6e4d4" = "#e6e4d4";
		export const SATIN_SHEEN_GOLD: "#cba135" = "#cba135";
		export const SAUVIGNON: "#fff5f3" = "#fff5f3";
		export const SAZERAC: "#fff4e0" = "#fff4e0";
		export const SCAMPI: "#675fa6" = "#675fa6";
		export const SCANDAL: "#cffaf4" = "#cffaf4";
		export const SCARLET: "#ff2400" = "#ff2400";
		export const SCARLET_GUM: "#431560" = "#431560";
		export const SCARLETT: "#950015" = "#950015";
		export const SCARPA_FLOW: "#585562" = "#585562";
		export const SCHIST: "#a9b497" = "#a9b497";
		export const SCHOOL_BUS_YELLOW: "#ffd800" = "#ffd800";
		export const SCHOONER: "#8b847e" = "#8b847e";
		export const SCIENCE_BLUE: "#0066cc" = "#0066cc";
		export const SCOOTER: "#2ebfd4" = "#2ebfd4";
		export const SCORPION: "#695f62" = "#695f62";
		export const SCOTCH_MIST: "#fffbdc" = "#fffbdc";
		export const SCREAMIN_GREEN: "#66ff66" = "#66ff66";
		export const SEA_BLUE: "#006994" = "#006994";
		export const SEA_BUCKTHORN: "#fba129" = "#fba129";
		export const SEA_GREEN: "#2e8b57" = "#2e8b57";
		export const SEA_MIST: "#c5dbca" = "#c5dbca";
		export const SEA_NYMPH: "#78a39c" = "#78a39c";
		export const SEA_PINK: "#ed989e" = "#ed989e";
		export const SEA_SERPENT: "#4bc7cf" = "#4bc7cf";
		export const SEAGULL: "#80ccea" = "#80ccea";
		export const SEAL_BROWN: "#59260b" = "#59260b";
		export const SEANCE: "#731e8f" = "#731e8f";
		export const SEASHELL: "#fff5ee" = "#fff5ee";
		export const SEAWEED: "#1b2f11" = "#1b2f11";
		export const SELAGO: "#f0eefd" = "#f0eefd";
		export const SELECTIVE_YELLOW: "#ffba00" = "#ffba00";
		export const SEPIA: "#704214" = "#704214";
		export const SEPIA_BLACK: "#2b0202" = "#2b0202";
		export const SEPIA_SKIN: "#9e5b40" = "#9e5b40";
		export const SERENADE: "#fff4e8" = "#fff4e8";
		export const SHADOW: "#8a795d" = "#8a795d";
		export const SHADOW_BLUE: "#778ba5" = "#778ba5";
		export const SHADOW_GREEN: "#9ac2b8" = "#9ac2b8";
		export const SHADY_LADY: "#aaa5a9" = "#aaa5a9";
		export const SHAKESPEARE: "#4eabd1" = "#4eabd1";
		export const SHALIMAR: "#fbffba" = "#fbffba";
		export const SHAMPOO: "#ffcff1" = "#ffcff1";
		export const SHAMROCK: "#33cc99" = "#33cc99";
		export const SHAMROCK_GREEN: "#009e60" = "#009e60";
		export const SHARK: "#25272c" = "#25272c";
		export const SHEEN_GREEN: "#8fd400" = "#8fd400";
		export const SHERPA_BLUE: "#004950" = "#004950";
		export const SHERWOOD_GREEN: "#02402c" = "#02402c";
		export const SHILO: "#e8b9b3" = "#e8b9b3";
		export const SHIMMERING_BLUSH: "#d98695" = "#d98695";
		export const SHINGLE_FAWN: "#6b4e31" = "#6b4e31";
		export const SHINY_SHAMROCK: "#5fa778" = "#5fa778";
		export const SHIP_COVE: "#788bba" = "#788bba";
		export const SHIP_GRAY: "#3e3a44" = "#3e3a44";
		export const SHIRAZ: "#b20931" = "#b20931";
		export const SHOCKING: "#e292c0" = "#e292c0";
		export const SHOCKING_PINK: "#fc0fc0" = "#fc0fc0";
		export const SHUTTLE_GRAY: "#5f6672" = "#5f6672";
		export const SIAM: "#646a54" = "#646a54";
		export const SIDECAR: "#f3e7bb" = "#f3e7bb";
		export const SIENNA: "#882d17" = "#882d17";
		export const SILK: "#bdb1a8" = "#bdb1a8";
		export const SILVER: "#c0c0c0" = "#c0c0c0";
		export const SILVER_CHALICE: "#acacac" = "#acacac";
		export const SILVER_LAKE_BLUE: "#5d89ba" = "#5d89ba";
		export const SILVER_PINK: "#c4aead" = "#c4aead";
		export const SILVER_SAND: "#bfc1c2" = "#bfc1c2";
		export const SILVER_TREE: "#66b58f" = "#66b58f";
		export const SINBAD: "#9fd7d3" = "#9fd7d3";
		export const SINOPIA: "#cb410b" = "#cb410b";
		export const SIREN: "#7a013a" = "#7a013a";
		export const SIROCCO: "#718080" = "#718080";
		export const SISAL: "#d3cbba" = "#d3cbba";
		export const SIZZLING_RED: "#ff3855" = "#ff3855";
		export const SIZZLING_SUNRISE: "#ffdb00" = "#ffdb00";
		export const SKEPTIC: "#cae6da" = "#cae6da";
		export const SKOBELOFF: "#007474" = "#007474";
		export const SKY_BLUE: "#87ceeb" = "#87ceeb";
		export const SKY_MAGENTA: "#cf71af" = "#cf71af";
		export const SLATE_BLUE: "#6a5acd" = "#6a5acd";
		export const SLATE_GRAY: "#708090" = "#708090";
		export const SLIMY_GREEN: "#299617" = "#299617";
		export const SMALT: "#003399" = "#003399";
		export const SMALT_BLUE: "#51808f" = "#51808f";
		export const SMASHED_PUMPKIN: "#ff6d3a" = "#ff6d3a";
		export const SMITTEN: "#c84186" = "#c84186";
		export const SMOKE: "#738276" = "#738276";
		export const SMOKEY_TOPAZ: "#832a0d" = "#832a0d";
		export const SMOKY: "#605b73" = "#605b73";
		export const SMOKY_BLACK: "#100c08" = "#100c08";
		export const SMOKY_TOPAZ: "#933d41" = "#933d41";
		export const SNOW: "#fffafa" = "#fffafa";
		export const SNOW_DRIFT: "#f7faf7" = "#f7faf7";
		export const SNOW_FLURRY: "#e4ffd1" = "#e4ffd1";
		export const SNOWY_MINT: "#d6ffdb" = "#d6ffdb";
		export const SNUFF: "#e2d8ed" = "#e2d8ed";
		export const SOAP: "#cec8ef" = "#cec8ef";
		export const SOAPSTONE: "#fffbf9" = "#fffbf9";
		export const SOFT_AMBER: "#d1c6b4" = "#d1c6b4";
		export const SOFT_PEACH: "#f5edef" = "#f5edef";
		export const SOLID_PINK: "#893843" = "#893843";
		export const SOLITAIRE: "#fef8e2" = "#fef8e2";
		export const SOLITUDE: "#eaf6ff" = "#eaf6ff";
		export const SONIC_SILVER: "#757575" = "#757575";
		export const SORBUS: "#fd7c07" = "#fd7c07";
		export const SORRELL_BROWN: "#ceb98f" = "#ceb98f";
		export const SOYA_BEAN: "#6a6051" = "#6a6051";
		export const SPACE_CADET: "#1d2951" = "#1d2951";
		export const SPANISH_BISTRE: "#807532" = "#807532";
		export const SPANISH_BLUE: "#0070b8" = "#0070b8";
		export const SPANISH_CARMINE: "#d10047" = "#d10047";
		export const SPANISH_CRIMSON: "#e51a4c" = "#e51a4c";
		export const SPANISH_GRAY: "#989898" = "#989898";
		export const SPANISH_GREEN: "#009150" = "#009150";
		export const SPANISH_ORANGE: "#e86100" = "#e86100";
		export const SPANISH_PINK: "#f7bfbe" = "#f7bfbe";
		export const SPANISH_RED: "#e60026" = "#e60026";
		export const SPANISH_SKY_BLUE: "#00aae4" = "#00aae4";
		export const SPANISH_VIOLET: "#4c2882" = "#4c2882";
		export const SPANISH_VIRIDIAN: "#007f5c" = "#007f5c";
		export const SPARTAN_CRIMSON: "#9e1316" = "#9e1316";
		export const SPECTRA: "#2f5a57" = "#2f5a57";
		export const SPICE: "#6a442e" = "#6a442e";
		export const SPICY_MIX: "#8b5f4d" = "#8b5f4d";
		export const SPICY_MUSTARD: "#74640d" = "#74640d";
		export const SPICY_PINK: "#816e71" = "#816e71";
		export const SPINDLE: "#b6d1ea" = "#b6d1ea";
		export const SPIRO_DISCO_BALL: "#0fc0fc" = "#0fc0fc";
		export const SPRAY: "#79deec" = "#79deec";
		export const SPRING_BUD: "#a7fc00" = "#a7fc00";
		export const SPRING_FROST: "#87ff2a" = "#87ff2a";
		export const SPRING_GREEN: "#00ff7f" = "#00ff7f";
		export const SPRING_LEAVES: "#578363" = "#578363";
		export const SPRING_RAIN: "#accbb1" = "#accbb1";
		export const SPRING_SUN: "#f6ffdc" = "#f6ffdc";
		export const SPRING_WOOD: "#f8f6f1" = "#f8f6f1";
		export const SPROUT: "#c1d7b0" = "#c1d7b0";
		export const SPUN_PEARL: "#aaabb7" = "#aaabb7";
		export const SQUIRREL: "#8f8176" = "#8f8176";
		export const ST_PATRICKS_BLUE: "#23297a" = "#23297a";
		export const ST_TROPAZ: "#2d569b" = "#2d569b";
		export const STACK: "#8a8f8a" = "#8a8f8a";
		export const STAR_COMMAND_BLUE: "#007bb8" = "#007bb8";
		export const STAR_DUST: "#9f9f9c" = "#9f9f9c";
		export const STARK_WHITE: "#e5d7bd" = "#e5d7bd";
		export const STARSHIP: "#ecf245" = "#ecf245";
		export const STEEL_BLUE: "#4682b4" = "#4682b4";
		export const STEEL_GRAY: "#262335" = "#262335";
		export const STEEL_PINK: "#cc33cc" = "#cc33cc";
		export const STEEL_TEAL: "#5f8a8b" = "#5f8a8b";
		export const STILETTO: "#9c3336" = "#9c3336";
		export const STONEWALL: "#928573" = "#928573";
		export const STORM_DUST: "#646463" = "#646463";
		export const STORM_GRAY: "#717486" = "#717486";
		export const STORMCLOUD: "#4f666a" = "#4f666a";
		export const STRATOS: "#000741" = "#000741";
		export const STRAW: "#e4d96f" = "#e4d96f";
		export const STRAWBERRY: "#fc5a8d" = "#fc5a8d";
		export const STRIKEMASTER: "#956387" = "#956387";
		export const STROMBOLI: "#325d52" = "#325d52";
		export const STUDIO: "#714ab2" = "#714ab2";
		export const SUBMARINE: "#bac7c9" = "#bac7c9";
		export const SUGAR_CANE: "#f9fff6" = "#f9fff6";
		export const SUGAR_PLUM: "#914e75" = "#914e75";
		export const SULU: "#c1f07c" = "#c1f07c";
		export const SUMMER_GREEN: "#96bbab" = "#96bbab";
		export const SUN: "#fbac13" = "#fbac13";
		export const SUNBURNT_CYCLOPS: "#ff404c" = "#ff404c";
		export const SUNDANCE: "#c9b35b" = "#c9b35b";
		export const SUNDOWN: "#ffb1b3" = "#ffb1b3";
		export const SUNFLOWER: "#e4d422" = "#e4d422";
		export const SUNGLO: "#e16865" = "#e16865";
		export const SUNGLOW: "#ffcc33" = "#ffcc33";
		export const SUNNY: "#f2f27a" = "#f2f27a";
		export const SUNRAY: "#e3ab57" = "#e3ab57";
		export const SUNSET: "#fad6a5" = "#fad6a5";
		export const SUNSET_ORANGE: "#fd5e53" = "#fd5e53";
		export const SUNSHADE: "#ff9e2c" = "#ff9e2c";
		export const SUPER_PINK: "#cf6ba9" = "#cf6ba9";
		export const SUPERNOVA: "#ffc901" = "#ffc901";
		export const SURF: "#bbd7c1" = "#bbd7c1";
		export const SURF_CREST: "#cfe5d2" = "#cfe5d2";
		export const SURFIE_GREEN: "#0c7a79" = "#0c7a79";
		export const SUSHI: "#87ab39" = "#87ab39";
		export const SUVA_GRAY: "#888387" = "#888387";
		export const SWAMP: "#001b1c" = "#001b1c";
		export const SWAMP_GREEN: "#acb78e" = "#acb78e";
		export const SWANS_DOWN: "#dcf0ea" = "#dcf0ea";
		export const SWEET_BROWN: "#a83731" = "#a83731";
		export const SWEET_CORN: "#fbea8c" = "#fbea8c";
		export const SWEET_PINK: "#fd9fa2" = "#fd9fa2";
		export const SWIRL: "#d3cdc5" = "#d3cdc5";
		export const SWISS_COFFEE: "#ddd6d5" = "#ddd6d5";
		export const SYCAMORE: "#908d39" = "#908d39";
		export const TABASCO: "#a02712" = "#a02712";
		export const TACAO: "#edb381" = "#edb381";
		export const TACHA: "#d6c562" = "#d6c562";
		export const TAHITI_GOLD: "#e97c07" = "#e97c07";
		export const TAHUNA_SANDS: "#eef0c8" = "#eef0c8";
		export const TALL_POPPY: "#b32d29" = "#b32d29";
		export const TALLOW: "#a8a589" = "#a8a589";
		export const TAMARILLO: "#991613" = "#991613";
		export const TAMARIND: "#341515" = "#341515";
		export const TAN: "#d2b48c" = "#d2b48c";
		export const TAN_HIDE: "#fa9d5a" = "#fa9d5a";
		export const TANA: "#d9dcc1" = "#d9dcc1";
		export const TANGAROA: "#03163c" = "#03163c";
		export const TANGELO: "#f94d00" = "#f94d00";
		export const TANGERINE: "#f28500" = "#f28500";
		export const TANGERINE_YELLOW: "#ffcc00" = "#ffcc00";
		export const TANGO: "#ed7a1c" = "#ed7a1c";
		export const TANGO_PINK: "#e4717a" = "#e4717a";
		export const TAPA: "#7b7874" = "#7b7874";
		export const TAPESTRY: "#b05e81" = "#b05e81";
		export const TARA: "#e1f6e8" = "#e1f6e8";
		export const TARAWERA: "#073a50" = "#073a50";
		export const TART_ORANGE: "#fb4d46" = "#fb4d46";
		export const TASMAN: "#cfdccf" = "#cfdccf";
		export const TAUPE: "#483c32" = "#483c32";
		export const TAUPE_GRAY: "#8b8589" = "#8b8589";
		export const TAWNY_PORT: "#692545" = "#692545";
		export const TE_PAPA_GREEN: "#1e433c" = "#1e433c";
		export const TEA: "#c1bab0" = "#c1bab0";
		export const TEA_GREEN: "#d0f0c0" = "#d0f0c0";
		export const TEA_ROSE: "#f4c2c2" = "#f4c2c2";
		export const TEAK: "#b19461" = "#b19461";
		export const TEAL: "#008080" = "#008080";
		export const TEAL_BLUE: "#367588" = "#367588";
		export const TEAL_DEER: "#99e6b3" = "#99e6b3";
		export const TEAL_GREEN: "#00827f" = "#00827f";
		export const TELEMAGENTA: "#cf3476" = "#cf3476";
		export const TEMPTRESS: "#3b000b" = "#3b000b";
		export const TENNE: "#cd5700" = "#cd5700";
		export const TEQUILA: "#ffe6c7" = "#ffe6c7";
		export const TERRA_COTTA: "#e2725b" = "#e2725b";
		export const TEXAS: "#f8f99c" = "#f8f99c";
		export const TEXAS_ROSE: "#ffb555" = "#ffb555";
		export const THATCH: "#b69d98" = "#b69d98";
		export const THATCH_GREEN: "#403d19" = "#403d19";
		export const THISTLE: "#d8bfd8" = "#d8bfd8";
		export const THISTLE_GREEN: "#cccaa8" = "#cccaa8";
		export const THULIAN_PINK: "#de6fa1" = "#de6fa1";
		export const THUNDER: "#33292f" = "#33292f";
		export const THUNDERBIRD: "#c02b18" = "#c02b18";
		export const TIA_MARIA: "#c1440e" = "#c1440e";
		export const TIARA: "#c3d1d1" = "#c3d1d1";
		export const TIBER: "#063537" = "#063537";
		export const TICKLE_ME_PINK: "#fc89ac" = "#fc89ac";
		export const TIDAL: "#f1ffad" = "#f1ffad";
		export const TIDE: "#bfb8b0" = "#bfb8b0";
		export const TIFFANY_BLUE: "#0abab5" = "#0abab5";
		export const TIGERS_EYE: "#e08d3c" = "#e08d3c";
		export const TIMBER_GREEN: "#16322c" = "#16322c";
		export const TIMBERWOLF: "#dbd7d2" = "#dbd7d2";
		export const TITAN_WHITE: "#f0eeff" = "#f0eeff";
		export const TITANIUM_YELLOW: "#eee600" = "#eee600";
		export const TOAST: "#9a6e61" = "#9a6e61";
		export const TOBACCO_BROWN: "#715d47" = "#715d47";
		export const TOLEDO: "#3a0020" = "#3a0020";
		export const TOLOPEA: "#1b0245" = "#1b0245";
		export const TOM_THUMB: "#3f583b" = "#3f583b";
		export const TOMATO: "#ff6347" = "#ff6347";
		export const TONYS_PINK: "#e79f8c" = "#e79f8c";
		export const TOOLBOX: "#746cc0" = "#746cc0";
		export const TOPAZ: "#ffc87c" = "#ffc87c";
		export const TOREA_BAY: "#0f2d9e" = "#0f2d9e";
		export const TORY_BLUE: "#1450aa" = "#1450aa";
		export const TOSCA: "#8d3f3f" = "#8d3f3f";
		export const TOTEM_POLE: "#991b07" = "#991b07";
		export const TOWER_GRAY: "#a9bdbf" = "#a9bdbf";
		export const TRACTOR_RED: "#fd0e35" = "#fd0e35";
		export const TRADEWIND: "#5fb3ac" = "#5fb3ac";
		export const TRANQUIL: "#e6ffff" = "#e6ffff";
		export const TRAVERTINE: "#fffde8" = "#fffde8";
		export const TREE_POPPY: "#fc9c1d" = "#fc9c1d";
		export const TREEHOUSE: "#3b2820" = "#3b2820";
		export const TRENDY_GREEN: "#7c881a" = "#7c881a";
		export const TRENDY_PINK: "#8c6495" = "#8c6495";
		export const TRINIDAD: "#e64e03" = "#e64e03";
		export const TROPICAL_BLUE: "#c3ddf9" = "#c3ddf9";
		export const TROPICAL_RAIN_FOREST: "#00755e" = "#00755e";
		export const TROPICAL_VIOLET: "#cda4de" = "#cda4de";
		export const TROUT: "#4a4e5a" = "#4a4e5a";
		export const TRUE_BLUE: "#0073cf" = "#0073cf";
		export const TRUE_V: "#8a73d6" = "#8a73d6";
		export const TUATARA: "#363534" = "#363534";
		export const TUFT_BUSH: "#ffddcd" = "#ffddcd";
		export const TUFTS_BLUE: "#417dc1" = "#417dc1";
		export const TULIP: "#ff878d" = "#ff878d";
		export const TULIP_TREE: "#eab33b" = "#eab33b";
		export const TUMBLEWEED: "#deaa88" = "#deaa88";
		export const TUNA: "#353542" = "#353542";
		export const TUNDORA: "#4a4244" = "#4a4244";
		export const TURBO: "#fae600" = "#fae600";
		export const TURKISH_ROSE: "#b57281" = "#b57281";
		export const TURMERIC: "#cabb48" = "#cabb48";
		export const TURQUOISE: "#40e0d0" = "#40e0d0";
		export const TURQUOISE_BLUE: "#00ffef" = "#00ffef";
		export const TURQUOISE_GREEN: "#a0d6b4" = "#a0d6b4";
		export const TURTLE_GREEN: "#2a380b" = "#2a380b";
		export const TUSCAN_RED: "#7c4848" = "#7c4848";
		export const TUSCAN_TAN: "#a67b5b" = "#a67b5b";
		export const TUSCANY: "#c09999" = "#c09999";
		export const TUSK: "#eef3c3" = "#eef3c3";
		export const TUSSOCK: "#c5994b" = "#c5994b";
		export const TUTU: "#fff1f9" = "#fff1f9";
		export const TWILIGHT: "#e4cfde" = "#e4cfde";
		export const TWILIGHT_BLUE: "#eefdff" = "#eefdff";
		export const TWILIGHT_LAVENDER: "#8a496b" = "#8a496b";
		export const TWINE: "#c2955d" = "#c2955d";
		export const TYRIAN_PURPLE: "#66023c" = "#66023c";
		export const UA_BLUE: "#0033aa" = "#0033aa";
		export const UA_RED: "#d9004c" = "#d9004c";
		export const UCLA_BLUE: "#536895" = "#536895";
		export const UCLA_GOLD: "#ffb300" = "#ffb300";
		export const UFO_GREEN: "#3cd070" = "#3cd070";
		export const UP_FOREST_GREEN: "#014421" = "#014421";
		export const UP_MAROON: "#7b1113" = "#7b1113";
		export const USAFA_BLUE: "#004f98" = "#004f98";
		export const UBE: "#8878c3" = "#8878c3";
		export const ULTRA_PINK: "#ff6fff" = "#ff6fff";
		export const ULTRAMARINE: "#3f00ff" = "#3f00ff";
		export const ULTRAMARINE_BLUE: "#4166f5" = "#4166f5";
		export const UMBER: "#635147" = "#635147";
		export const UNBLEACHED_SILK: "#ffddca" = "#ffddca";
		export const UNDERAGE_PINK: "#f9e6f4" = "#f9e6f4";
		export const UNITED_NATIONS_BLUE: "#5b92e5" = "#5b92e5";
		export const UNIVERSITY_OF_CALIFORNIA_GOLD: "#b78727" = "#b78727";
		export const UNIVERSITY_OF_TENNESSEE_ORANGE: "#f77f00" = "#f77f00";
		export const UNMELLOW_YELLOW: "#ffff66" = "#ffff66";
		export const UPSDELL_RED: "#ae2029" = "#ae2029";
		export const UROBILIN: "#e1ad21" = "#e1ad21";
		export const UTAH_CRIMSON: "#d3003f" = "#d3003f";
		export const VALENCIA: "#d84437" = "#d84437";
		export const VALENTINO: "#350e42" = "#350e42";
		export const VALHALLA: "#2b194f" = "#2b194f";
		export const VAN_CLEEF: "#49170c" = "#49170c";
		export const VAN_DYKE_BROWN: "#664228" = "#664228";
		export const VANILLA: "#f3e5ab" = "#f3e5ab";
		export const VANILLA_ICE: "#f38fa9" = "#f38fa9";
		export const VARDEN: "#fff6df" = "#fff6df";
		export const VEGAS_GOLD: "#c5b358" = "#c5b358";
		export const VENETIAN_RED: "#c80815" = "#c80815";
		export const VENICE_BLUE: "#055989" = "#055989";
		export const VENUS: "#928590" = "#928590";
		export const VERDIGRIS: "#43b3ae" = "#43b3ae";
		export const VERDUN_GREEN: "#495400" = "#495400";
		export const VERMILION: "#d9381e" = "#d9381e";
		export const VERONICA: "#a020f0" = "#a020f0";
		export const VERY_LIGHT_AZURE: "#74bbfb" = "#74bbfb";
		export const VERY_LIGHT_BLUE: "#6666ff" = "#6666ff";
		export const VERY_LIGHT_MALACHITE_GREEN: "#64e986" = "#64e986";
		export const VERY_LIGHT_TANGELO: "#ffb077" = "#ffb077";
		export const VERY_PALE_ORANGE: "#ffdfbf" = "#ffdfbf";
		export const VERY_PALE_YELLOW: "#ffffbf" = "#ffffbf";
		export const VESUVIUS: "#b14a0b" = "#b14a0b";
		export const VICTORIA: "#534491" = "#534491";
		export const VIDA_LOCA: "#549019" = "#549019";
		export const VIKING: "#64ccdb" = "#64ccdb";
		export const VIN_ROUGE: "#983d61" = "#983d61";
		export const VIOLA: "#cb8fa9" = "#cb8fa9";
		export const VIOLENT_VIOLET: "#290c5e" = "#290c5e";
		export const VIOLET: "#7f00ff" = "#7f00ff";
		export const VIOLET_BLUE: "#324ab2" = "#324ab2";
		export const VIOLET_EGGPLANT: "#991199" = "#991199";
		export const VIOLET_RED: "#f75394" = "#f75394";
		export const VIRIDIAN: "#40826d" = "#40826d";
		export const VIRIDIAN_GREEN: "#009698" = "#009698";
		export const VIS_VIS: "#ffefa1" = "#ffefa1";
		export const VISTA_BLUE: "#7c9ed9" = "#7c9ed9";
		export const VISTA_WHITE: "#fcf8f7" = "#fcf8f7";
		export const VIVID_AMBER: "#cc9900" = "#cc9900";
		export const VIVID_AUBURN: "#922724" = "#922724";
		export const VIVID_BURGUNDY: "#9f1d35" = "#9f1d35";
		export const VIVID_CERISE: "#da1d81" = "#da1d81";
		export const VIVID_CERULEAN: "#00aaee" = "#00aaee";
		export const VIVID_CRIMSON: "#cc0033" = "#cc0033";
		export const VIVID_GAMBOGE: "#ff9900" = "#ff9900";
		export const VIVID_LIME_GREEN: "#a6d608" = "#a6d608";
		export const VIVID_MALACHITE: "#00cc33" = "#00cc33";
		export const VIVID_MULBERRY: "#b80ce3" = "#b80ce3";
		export const VIVID_ORANGE: "#ff5f00" = "#ff5f00";
		export const VIVID_ORANGE_PEEL: "#ffa000" = "#ffa000";
		export const VIVID_ORCHID: "#cc00ff" = "#cc00ff";
		export const VIVID_RASPBERRY: "#ff006c" = "#ff006c";
		export const VIVID_RED: "#f70d1a" = "#f70d1a";
		export const VIVID_RED_TANGELO: "#df6124" = "#df6124";
		export const VIVID_SKY_BLUE: "#00ccff" = "#00ccff";
		export const VIVID_TANGELO: "#f07427" = "#f07427";
		export const VIVID_TANGERINE: "#ffa089" = "#ffa089";
		export const VIVID_VERMILION: "#e56024" = "#e56024";
		export const VIVID_VIOLET: "#9f00ff" = "#9f00ff";
		export const VIVID_YELLOW: "#ffe302" = "#ffe302";
		export const VOLT: "#ceff00" = "#ceff00";
		export const VOODOO: "#533455" = "#533455";
		export const VULCAN: "#10121d" = "#10121d";
		export const WAFER: "#decbc6" = "#decbc6";
		export const WAIKAWA_GRAY: "#5a6e9c" = "#5a6e9c";
		export const WAIOURU: "#363c0d" = "#363c0d";
		export const WALNUT: "#773f1a" = "#773f1a";
		export const WARM_BLACK: "#004242" = "#004242";
		export const WASABI: "#788a25" = "#788a25";
		export const WATER_LEAF: "#a1e9de" = "#a1e9de";
		export const WATERCOURSE: "#056f57" = "#056f57";
		export const WATERLOO_: "#7b7c94" = "#7b7c94";
		export const WATERSPOUT: "#a4f4f9" = "#a4f4f9";
		export const WATTLE: "#dcd747" = "#dcd747";
		export const WATUSI: "#ffddcf" = "#ffddcf";
		export const WAX_FLOWER: "#ffc0a8" = "#ffc0a8";
		export const WE_PEEP: "#f7dbe6" = "#f7dbe6";
		export const WEB_CHARTREUSE: "#7fff00" = "#7fff00";
		export const WEB_ORANGE: "#ffa500" = "#ffa500";
		export const WEDGEWOOD: "#4e7f9e" = "#4e7f9e";
		export const WELDON_BLUE: "#7c98ab" = "#7c98ab";
		export const WELL_READ: "#b43332" = "#b43332";
		export const WENGE: "#645452" = "#645452";
		export const WEST_COAST: "#625119" = "#625119";
		export const WEST_SIDE: "#ff910f" = "#ff910f";
		export const WESTAR: "#dcd9d2" = "#dcd9d2";
		export const WEWAK: "#f19bab" = "#f19bab";
		export const WHEAT: "#f5deb3" = "#f5deb3";
		export const WHEATFIELD: "#f3edcf" = "#f3edcf";
		export const WHISKEY: "#d59a6f" = "#d59a6f";
		export const WHISPER: "#f7f5fa" = "#f7f5fa";
		export const WHITE: "#ffffff" = "#ffffff";
		export const WHITE_ICE: "#ddf9f1" = "#ddf9f1";
		export const WHITE_LILAC: "#f8f7fc" = "#f8f7fc";
		export const WHITE_LINEN: "#f8f0e8" = "#f8f0e8";
		export const WHITE_POINTER: "#fef8ff" = "#fef8ff";
		export const WHITE_ROCK: "#eae8d4" = "#eae8d4";
		export const WHITE_SMOKE: "#f5f5f5" = "#f5f5f5";
		export const WILD_BLUE_YONDER: "#a2add0" = "#a2add0";
		export const WILD_ORCHID: "#d470a2" = "#d470a2";
		export const WILD_RICE: "#ece090" = "#ece090";
		export const WILD_SAND: "#f4f4f4" = "#f4f4f4";
		export const WILD_STRAWBERRY: "#ff43a4" = "#ff43a4";
		export const WILD_WATERMELON: "#fc6c85" = "#fc6c85";
		export const WILD_WILLOW: "#b9c46a" = "#b9c46a";
		export const WILLIAM: "#3a686c" = "#3a686c";
		export const WILLOW_BROOK: "#dfecda" = "#dfecda";
		export const WILLOW_GROVE: "#65745d" = "#65745d";
		export const WILLPOWER_ORANGE: "#fd5800" = "#fd5800";
		export const WINDSOR: "#3c0878" = "#3c0878";
		export const WINDSOR_TAN: "#a75502" = "#a75502";
		export const WINE: "#722f37" = "#722f37";
		export const WINE_BERRY: "#591d35" = "#591d35";
		export const WINE_DREGS: "#673147" = "#673147";
		export const WINTER_HAZEL: "#d5d195" = "#d5d195";
		export const WINTER_SKY: "#ff007c" = "#ff007c";
		export const WINTER_WIZARD: "#a0e6ff" = "#a0e6ff";
		export const WINTERGREEN_DREAM: "#56887d" = "#56887d";
		export const WISP_PINK: "#fef4f8" = "#fef4f8";
		export const WISTERIA: "#c9a0dc" = "#c9a0dc";
		export const WISTFUL: "#a4a6d3" = "#a4a6d3";
		export const WITCH_HAZE: "#fffc99" = "#fffc99";
		export const WOOD_BARK: "#261105" = "#261105";
		export const WOODLAND: "#4d5328" = "#4d5328";
		export const WOODRUSH: "#302a0f" = "#302a0f";
		export const WOODSMOKE: "#0c0d0f" = "#0c0d0f";
		export const WOODY_BROWN: "#483131" = "#483131";
		export const X11_DARK_GREEN: "#006400" = "#006400";
		export const X11_GRAY: "#bebebe" = "#bebebe";
		export const XANADU: "#738678" = "#738678";
		export const YALE_BLUE: "#0f4d92" = "#0f4d92";
		export const YANKEES_BLUE: "#1c2841" = "#1c2841";
		export const YELLOW: "#ffff00" = "#ffff00";
		export const YELLOW_GREEN: "#9acd32" = "#9acd32";
		export const YELLOW_METAL: "#716338" = "#716338";
		export const YELLOW_ORANGE: "#ffae42" = "#ffae42";
		export const YELLOW_ROSE: "#fff000" = "#fff000";
		export const YELLOW_SEA: "#fea904" = "#fea904";
		export const YOUR_PINK: "#ffc3c0" = "#ffc3c0";
		export const YUKON_GOLD: "#7b6608" = "#7b6608";
		export const YUMA: "#cec291" = "#cec291";
		export const ZAFFRE: "#0014a8" = "#0014a8";
		export const ZAMBEZI: "#685558" = "#685558";
		export const ZANAH: "#daecd6" = "#daecd6";
		export const ZEST: "#e5841b" = "#e5841b";
		export const ZEUS: "#292319" = "#292319";
		export const ZIGGURAT: "#bfdbe2" = "#bfdbe2";
		export const ZINNWALDITE: "#ebc2af" = "#ebc2af";
		export const ZINNWALDITE_BROWN: "#2c1608" = "#2c1608";
		export const ZIRCON: "#f4f8ff" = "#f4f8ff";
		export const ZOMBIE: "#e4d69b" = "#e4d69b";
		export const ZOMP: "#39a78e" = "#39a78e";
		export const ZORBA: "#a59b91" = "#a59b91";
		export const ZUCCINI: "#044022" = "#044022";
		export const ZUMTHOR: "#edf6ff" = "#edf6ff";
    }

    export class RGB {
        public red: number;
        public green: number;
        public blue: number;

        constructor(red: number, green: number, blue: number) {
            this.red = red;
            this.green = green;
            this.blue = blue;
        }

        public toHex(): Hex {
            const space = (str: string) => Utils.prefixSpacing(str, "0", 2);
            return new Hex(`#${space(this.red.toString(16))}${space(this.green.toString(16))}${space(this.blue.toString(16))}`);
        }

        public toString(): string {
            return `rgb(${this.red}, ${this.green}, ${this.blue})`;
        }

        public clone(): RGB {
            return new RGB(this.red, this.green, this.blue);
        }
    }

    export class Hex {
        private _value: number;

        constructor(hexadecimal: number | string) {
            if (Number.isInteger(hexadecimal)) {
                this._value = +hexadecimal;
            } else {
                this._value = parseInt(hexadecimal.toString().substring(1), 16);
            }
        }


        public toRGB(): RGB {
            const stringified = this.toString();
            return new RGB(parseInt(stringified.substring(1, 3), 16), parseInt(stringified.substring(3, 5), 16), parseInt(stringified.substring(5, 7), 16));
        }

        public toString(): string {
            return `#${Utils.prefixSpacing(this._value.toString(16), "0", 6)}`;
        }

        public clone(): Hex {
            return new Hex(this.toString());
        }
    }
}