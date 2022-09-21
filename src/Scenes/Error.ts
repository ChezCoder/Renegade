import App from "../lib/App";
import Scene from "../lib/Scene"
import { Routine, WaitFor, WaitForSeconds } from "../lib/Scheduler";
import { Color, LerpUtils, TextHelper, Utils, Vector2 } from "../lib/Util";

export default class ErrorScene extends Scene {
    private errorMessageAlpha!: number;
    private bufferedErrorMessageAlpha!: number;

    private bufferedErrorButtonAlpha!: number;
    private errorButtonAlpha!: number;

    private bufferedErrorButtonColor!: Color.RGB;
    private errorButtonColor!: Color.RGB;

    private lerpRate!: number;

    private transitioning!: boolean;

    constructor(app: App) {
        super(app, "error");
    }

    public setup(): void {
        this.errorMessageAlpha = 0;
        this.bufferedErrorMessageAlpha = 1;

        this.bufferedErrorButtonAlpha = 0;
        this.errorButtonAlpha = 0;
        
        this.bufferedErrorButtonColor = new Color.Hex("#ff0000").toRGB();
        this.errorButtonColor = new Color.Hex("#ffffff").toRGB();
        
        this.lerpRate = 0.01;
        
        this.transitioning = false;

        const instance = this;

        Routine.startTask(function*() {
            new WaitForSeconds(1);

            instance.bufferedErrorButtonAlpha = 1;
        });
    }

    public loop(): void {
        this.draw({
            "draw": () => {
                TextHelper.writeCenteredTextAt(this, "ReneGade", {
                    "fillStyle": "#ffffff",
                    "origin": new Vector2(this.app.center.x, this.app.height * 0.3),
                    "alpha": this.errorMessageAlpha
                }, "120px Glaive Regular");
            }
        });

        this.draw({
            "draw": () => {
                const error = this.app.storage.get("error") || "An error occurred";
                
                TextHelper.writeCenteredTextAt(this, error, {
                    "fillStyle": "#ff0000",
                    "origin": new Vector2(this.app.center.x, this.app.center.y - 20),
                    "alpha": this.errorMessageAlpha
                }, "30px Helios Regular");

                const details = this.app.storage.get("error_details") || "";
                
                TextHelper.writeCenteredTextAt(this, details, {
                    "fillStyle": "#ff0000",
                    "origin": new Vector2(this.app.center.x, this.app.center.y + 20),
                    "alpha": this.errorMessageAlpha
                }, "20px Helios Regular");
            }
        });

        this.draw({
            "draw": ctx => {
                TextHelper.writeCenteredTextAt(this, "back", {
                    "fillStyle": this.errorButtonColor.toString(),
                    "origin": new Vector2(this.app.center.x, this.app.height * 0.6),
                    "alpha": this.errorButtonAlpha
                }, "50px GameOver Regular");

                const width = TextHelper.measureTextWidth(ctx, "Back", "50px GameOver Regular");
                const height = TextHelper.measureTextHeight(ctx, "Back", "50px GameOver Regular");
                const pos = new Vector2(this.app.center.x - width / 2, (this.app.height * 0.6) - height / 2);

                if (Utils.isPointInRectangle(this.app.input.mousePos, pos, width, height)) {
                    this.bufferedErrorButtonColor = new Color.RGB(255, 0, 0);

                    this.app.cursor = "pointer";

                    if (this.app.input.mouseClick && !this.transitioning) {
                        this.bufferedErrorButtonAlpha = 0;
                        this.bufferedErrorMessageAlpha = 0;
                        this.transitioning = true;
                        
                        this.lerpRate = 0.05;
                        
                        const instance = this;

                        Routine.startTask(function*() {
                            yield new WaitFor(() => instance.errorMessageAlpha <= 0.05);
    
                            instance.app.enableScene("titleScreen");

                            instance.app.storage.set("error", "");
                            instance.app.storage.set("error_details", "");
                        });
                    }

                } else {
                    this.bufferedErrorButtonColor = new Color.RGB(255, 255, 255);
                }
            }
        });

        this.errorMessageAlpha = LerpUtils.lerp(this.errorMessageAlpha, this.bufferedErrorMessageAlpha, this.lerpRate);
        this.errorButtonAlpha = LerpUtils.lerp(this.errorButtonAlpha, this.bufferedErrorButtonAlpha, this.lerpRate);

        this.errorButtonColor.red = LerpUtils.lerp(this.errorButtonColor.red, this.bufferedErrorButtonColor.red, this.lerpRate * 10);
        this.errorButtonColor.green = LerpUtils.lerp(this.errorButtonColor.green, this.bufferedErrorButtonColor.green, this.lerpRate * 10);
        this.errorButtonColor.blue = LerpUtils.lerp(this.errorButtonColor.blue, this.bufferedErrorButtonColor.blue, this.lerpRate * 10);
    }
}