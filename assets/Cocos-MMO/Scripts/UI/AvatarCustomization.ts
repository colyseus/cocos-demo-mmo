
import { _decorator, Component, Node, Color, Toggle, color, Sprite, SpriteFrame, RenderTexture } from 'cc';
import { AvatarDisplay } from '../Player/AvatarDisplay';
import { ColorSelector } from './ColorSelector';
import type { AvatarState } from '../../../../Server/src/rooms/schema/AvatarState';
const { ccclass, property } = _decorator;

@ccclass('AvatarCustomization')
export class AvatarCustomization extends Component {
    
    @property({type:AvatarDisplay})
    private display: AvatarDisplay = null;
    @property({type:ColorSelector})
    private skinColorSelector: ColorSelector = null;
    @property
    private defaultSkinColor: Color = new Color(Color.MAGENTA.r, Color.MAGENTA.g, Color.MAGENTA.b, Color.MAGENTA.a);
    @property({type:ColorSelector})
    private shirtColorSelector: ColorSelector = null;
    @property
    private defaultShirtColor: Color = new Color(Color.MAGENTA.r, Color.MAGENTA.g, Color.MAGENTA.b, Color.MAGENTA.a);
    @property({type:ColorSelector})
    private pantsColorSelector: ColorSelector = null;
    @property
    private defaultPantsColor: Color = new Color(Color.MAGENTA.r, Color.MAGENTA.g, Color.MAGENTA.b, Color.MAGENTA.a);
    @property({type:Toggle})
    private hatToggle: Toggle = null;
    @property({type:ColorSelector})
    private hatColorSelector: ColorSelector = null;
    @property
    private defaultHatColor: Color = new Color(Color.MAGENTA.r, Color.MAGENTA.g, Color.MAGENTA.b, Color.MAGENTA.a);

    @property({type:Sprite})
    private previewSprite: Sprite = null;
    @property({type:RenderTexture})
    private previewRenderTexture: RenderTexture = null;

    private _onSave: (state: AvatarState) => void;
    private _avatar: AvatarState = null;

    onEnable() {

        if(!this._avatar) {
            return;
        }

        this.initializeControls();
    }

    start() {
        const spriteframe = this.previewSprite.spriteFrame;
          const sp = new SpriteFrame();
          sp.reset({
              originalSize: spriteframe.originalSize,
              rect: spriteframe.rect,
              offset: spriteframe.offset,
              isRotate: spriteframe.rotated,
              borderTop: spriteframe.insetTop,
              borderLeft: spriteframe.insetLeft,
              borderBottom: spriteframe.insetBottom,
              borderRight: spriteframe.insetRight,
          });
          sp.texture = this.previewRenderTexture;
          this.previewSprite.spriteFrame = sp;
          
          this.skinColorSelector.onColorChanged.addEventListener("onColorChanged", (eventData: Event) => {this.skinColorChange(((eventData) as CustomEvent<Color>).detail);});
          this.shirtColorSelector.onColorChanged.addEventListener("onColorChanged", (eventData: Event) => {this.shirtColorChange(((eventData) as CustomEvent<Color>).detail);});
          this.pantsColorSelector.onColorChanged.addEventListener("onColorChanged", (eventData: Event) => {this.pantsColorChange(((eventData) as CustomEvent<Color>).detail);});
          this.hatColorSelector.onColorChanged.addEventListener("onColorChanged", (eventData: Event) => {this.hatColorChange(((eventData) as CustomEvent<Color>).detail);});
    }

    public displayView(initializeingState: AvatarState, onSaveAction: (state: AvatarState) => void) {

        this._avatar = initializeingState;
        this._onSave = onSaveAction;
        this.node.active = true;
    }

    public closeView(save: boolean) {
        if(save) {
            this.setAvatarValues();
            this._onSave(this._avatar);
        }

        this.node.active = false;
    }

    public onButtonClose() {
        this.closeView(false);
    }

    private initializeControls() {
        
        this.skinColorSelector.display(this.hexToColor(this._avatar.skinColor, this.defaultSkinColor));
        this.shirtColorSelector.display(this.hexToColor(this._avatar.shirtColor, this.defaultShirtColor));
        this.pantsColorSelector.display(this.hexToColor(this._avatar.pantsColor, this.defaultPantsColor));
        this.hatColorSelector.display(this.hexToColor(this._avatar.hatColor, this.defaultHatColor));

        this.hatToggle.isChecked = this._avatar.hatChoice !== 0;

        this.display.setSkinTone(this._avatar.skinColor || this.colorToHex(this.defaultSkinColor));
        this.display.setShirtColor(this._avatar.shirtColor || this.colorToHex(this.defaultShirtColor));
        this.display.setPantsColor(this._avatar.pantsColor || this.colorToHex(this.defaultPantsColor));
        this.display.setHat(this.hatToggle.isChecked, this._avatar.hatColor || this.colorToHex(this.defaultHatColor));
    }

    private colorToHex(color: Color) {
        return `#${color.toHEX()}`;
    }

    private hexToColor(hex: string, defaultColor: Color) {
        let parsedColor: Color = new Color();
        
        if(!parsedColor.fromHEX(hex)) {
            console.error(`Failed to parse ${hex} for color, will use default!`);
            return defaultColor;
        }

        return parsedColor;
    }

    // Callbacks for the UI
    public onHatEnableChange() {
        this.display.setHatEnabled(this.hatToggle.isChecked);
        this.hatColorChange(this.hatColorSelector.getColor());
    }

    public hatColorChange(color: Color) {
        this.display.setHat(this.hatToggle.isChecked, this.colorToHex(color));
    }

    public skinColorChange(color: Color) {
        this.display.setSkinTone(this.colorToHex(color));
    }

    public shirtColorChange(color: Color) {
        this.display.setShirtColor(this.colorToHex(color));
    }

    public pantsColorChange(color: Color) {
        this.display.setPantsColor(this.colorToHex(color));
    }

    public saveCustomization() {
        this.closeView(true);
    }

    private setAvatarValues() {
        this._avatar.skinColor = this.colorToHex(this.skinColorSelector.getColor());
        this._avatar.shirtColor = this.colorToHex(this.shirtColorSelector.getColor());
        this._avatar.pantsColor = this.colorToHex(this.pantsColorSelector.getColor());
        this._avatar.hatColor = this.colorToHex(this.hatColorSelector.getColor());
        this._avatar.hatChoice = this.hatToggle.isChecked ? 1 : 0;
    }

    public cancelCustomization() {
        this.closeView(false);
    }
}