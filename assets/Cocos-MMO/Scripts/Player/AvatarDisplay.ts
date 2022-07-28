
import { _decorator, Component, Node, MeshRenderer, Color } from 'cc';
import type { AvatarState } from '../../../../Server/src/rooms/schema/AvatarState';
const { ccclass, property } = _decorator;

@ccclass('AvatarDisplay')
export class AvatarDisplay extends Component {
    
    @property({type:Node})
    private bodyNode: Node = null;
    @property({type:Node})
    private legRoot: Node = null;
    @property({type:Node})
    private hatRoot: Node = null;
    @property({type:Node})
    private armsRoot: Node = null;
    @property({type:Node})
    private headNode: Node = null;

    private _shirtRenderers: MeshRenderer[] = null;
    private _legRenderers: MeshRenderer[] = null;
    private _skinRenderers: MeshRenderer[] = null;
    private _hatRenderers: MeshRenderer[] = null;

    onLoad() {
        this._shirtRenderers = [];
        this._shirtRenderers.push(this.bodyNode.getComponent(MeshRenderer));

        //console.log(`Avatar Display - On Load - Shirt Renderers: ${this._shirtRenderers.length}`);
        
        this._legRenderers = this.legRoot.getComponentsInChildren(MeshRenderer);
        //console.log(`Avatar Display - On Load - Leg Renderers: ${this._legRenderers.length}`);
        this._hatRenderers = this.hatRoot.getComponentsInChildren(MeshRenderer);
        //console.log(`Avatar Display - On Load - Hat Renderers: ${this._hatRenderers.length}`);

        this._skinRenderers = this.armsRoot.getComponentsInChildren(MeshRenderer);
        this._skinRenderers.push(this.headNode.getComponent(MeshRenderer));
        //console.log(`Avatar Display - On Load - Skin Renderers: ${this._skinRenderers.length}`);
    }

    public setHatEnabled(val: boolean) {
        this.hatRoot.active = val;
    }

    public setHat(enabled: boolean, color: string) {
        this.setHatEnabled(enabled);

        if(enabled) {
            this.colorRenderers(this._hatRenderers, color);
        }
    }

    public setSkinTone(color: string) {
        this.colorRenderers(this._skinRenderers, color);
    }

    public setShirtColor(color: string) {
        this.colorRenderers(this._shirtRenderers, color);
    }

    public setPantsColor(color: string) {
        this.colorRenderers(this._legRenderers, color);
    }

    public displayFromState(state: AvatarState) {
        this.setHat(state.hatChoice !== 0, state.hatColor);
        this.setSkinTone(state.skinColor);
        this.setShirtColor(state.shirtColor);
        this.setPantsColor(state.pantsColor);
    }

    private colorRenderers(renderers: MeshRenderer[], colorHex: string) {

        if(!renderers) {
            return;
        }

        let color: Color = new Color();

        if(color.fromHEX(colorHex)) {

            for(let i = 0; i < renderers.length; i++) {
                renderers[i].material.setProperty("albedo", color);
            }
        }
    }
}