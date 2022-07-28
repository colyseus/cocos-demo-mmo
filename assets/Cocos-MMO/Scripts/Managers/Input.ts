import { _decorator, Component, EventKeyboard, systemEvent, SystemEventType, director, macro } from "cc";
const { ccclass, property } = _decorator;

@ccclass('Input')
export class Input extends Component {

    private static _pressedKeys: Map<number, boolean>;
    private static _downKeys: Map<number, number>;
    private static _inputKeys: Map<string, number>;

    onLoad() {
        this.initialize();
    }

    onDestroy() {
        systemEvent.off(SystemEventType.KEY_DOWN, Input.handleKeyboardInput, this);
        systemEvent.off(SystemEventType.KEY_UP, Input.handleKeyboardInput, this);
    }

    private initialize() {
        systemEvent.on(SystemEventType.KEY_DOWN, Input.handleKeyboardInput, this);
        systemEvent.on(SystemEventType.KEY_UP, Input.handleKeyboardInput, this);

        Input._pressedKeys = new Map<number, boolean>();
        Input._downKeys = new Map<number, number>();

        this.initializeInputKeys();

        console.log(`Input Initialized!`);
    }
    
    private initializeInputKeys() {
        Input._inputKeys = new Map<string, number>(Object.entries(macro.KEY));
    }

    public static getInputKeyValue(key: string): number {

        const lKey = key.toLowerCase();

        if(this._inputKeys.has(lKey)) {
            return this._inputKeys.get(lKey);
        }

        console.error(`No Key Value for provided key: \"${lKey}\"`);
        return -1;
    }

    public static getKey(keyCode: number): boolean {
        if(this._pressedKeys.has(keyCode)) {
            return this._pressedKeys.get(keyCode);
        }

        return false;
    }

    public static getKeyDown(keyCode: number): boolean {
        if(this._downKeys.has(keyCode)) {

            return this._downKeys.get(keyCode) === director.getTotalFrames();
        }

        return false;
    }

    private static handleKeyboardInput(event: EventKeyboard) {

        switch(event.type) {
            case SystemEventType.KEY_DOWN:
                
                if(Input._downKeys.has(event.keyCode) === false) {
                    Input._downKeys.set(event.keyCode, director.getTotalFrames());
                }

                Input._pressedKeys.set(event.keyCode, true);
                break;
            case SystemEventType.KEY_UP:
                
                if(Input._downKeys.has(event.keyCode)) {
                    Input._downKeys.delete(event.keyCode);
                }

                Input._pressedKeys.set(event.keyCode, false);
                break;
        }
    }
}