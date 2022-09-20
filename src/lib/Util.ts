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