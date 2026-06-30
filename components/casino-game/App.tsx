import "./App.css";
import React from "react";
import TopWindows from "./TopWindows";
import * as WebFont from "webfontloader";
import * as PIXI from "pixi.js";
import { listImages } from "./common/Config";
import EventEmitter from "eventemitter3";
import { setup } from "./Game";
import { MessageWin } from "./windows/MessageWin";

/**
 * global Event Emitter
 */
export const EE: EventEmitter = new EventEmitter();
///
export let imagesLoader: PIXI.Loader;

export function showPopup(txt: string) {
    EE.emit("SHOW_MESSAGE", txt);
}

class App extends React.Component<object, { MESSAGE: string }> {
    constructor(props: object) {
        super(props);
        this.onCloseMessage = this.onCloseMessage.bind(this);
        this.state = {
            MESSAGE: "",
        };
        EE.addListener("SHOW_MESSAGE", (txt) => {
            this.setState({ MESSAGE: txt });
        });
    }

    componentDidMount() {
        WebFont.load({
            custom: {
                families: ["Bronzier"],
            },
        });
        const preloaderbase = document.getElementsByClassName("preloader-game");
        const preloader = document.getElementsByClassName("prel-bar-line");
        const percentage = document.getElementById("percentage");
        imagesLoader = PIXI.Loader.shared;
        imagesLoader.add(listImages);
        imagesLoader.onProgress.add(() => {
            const wdth = (1024 * Math.ceil(100 - imagesLoader.progress)) / 100;
            if (preloader[0]) {
                (preloader[0] as HTMLElement).style.setProperty(
                    "clip-path",
                    `inset(0 ${wdth}px 0 0)`
                );
            }

            if (percentage) {
                percentage.innerText = Math.floor(imagesLoader.progress) + "%";
            }
        });
        imagesLoader.onError.add((e) => {
            console.log("ERROR LOAD! ", e);
        });
        imagesLoader.onComplete.add(() => {
            if (preloaderbase[0]) {
                (preloaderbase[0] as HTMLElement).style.setProperty("opacity", "0");
                setTimeout(() => {
                    (preloaderbase[0] as HTMLElement).style.setProperty(
                        "display",
                        "none"
                    );
                    (preloaderbase[0] as HTMLElement).parentNode?.removeChild(
                        preloaderbase[0]
                    );
                    EE.emit("CLEAR_TOP_WINDOWS");
                    EE.emit("SHOW_LOGIN");
                }, 1000);
            }
        });
        imagesLoader.load();
        EE.once("GO_GAME", () => {
            EE.emit("CLEAR_TOP_WINDOWS");
            setup();
        });
    }

    onCloseMessage() {
        this.setState({
            MESSAGE: "",
        });
    }

    onOpenMaintenance() {
        EE.emit("CLEAR_TOP_WINDOWS");
        EE.emit("SHOW_LOGIN");
    }

    render() {
        return (
            <div>
                {this.state.MESSAGE !== "" && (
                    <MessageWin
                        text={this.state.MESSAGE}
                        onClose={this.onCloseMessage}
                    />
                )}
                <TopWindows />
                <div id="AppGame" />
            </div>
        );
    }
}

export default App;
