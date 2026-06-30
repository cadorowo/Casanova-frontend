import * as PIXI from "pixi.js";
import { ButtonItem } from "../../gui/ButtonItem";
import { EE } from "../../../App";

export class Settings extends PIXI.Sprite {
    settings: PIXI.Sprite;

    constructor() {
        super();

        this.settings = this.addChild(new PIXI.Sprite());

        const rewardButton = this.addChild(
            new PIXI.Sprite(PIXI.Texture.from("images/frenzy/rewards_btn.png"))
        );

        rewardButton.interactive = true;
        rewardButton.buttonMode = true;

        rewardButton.x = -190;
        rewardButton.y = 13;
        rewardButton.on("pointerdown", () => {
            EE.emit("SHOW_REWARDS");
        });

        const volumeButton = this.settings.addChild(
            new ButtonItem("images/frenzy/volume_icon.png", () => {
                volumeOffButton.visible = true;
                volumeButton.visible = false;
            })
        );

        const volumeOffButton = this.settings.addChild(
            new ButtonItem("images/frenzy/volume_off_icon.png", () => {
                volumeButton.visible = true;
                volumeOffButton.visible = false;
            })
        );

        volumeButton.x = 170;
        volumeOffButton.x = 170;

        const logoutButton = this.settings.addChild(
            new PIXI.Sprite(PIXI.Texture.from("images/frenzy/logout_icon.png"))
        );

        logoutButton.x = 340;



    }
}
