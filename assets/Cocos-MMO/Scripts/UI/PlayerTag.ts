
import { _decorator, Component, Node, Prefab, Camera, Label, Vec2, Vec3, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerTag')
export class PlayerTag extends Component {
    
    @property({type:Label})
    private playerTag: Label = null;

    public setPlayerTag(tag: string) {
        this.playerTag.string = tag;
    }

    public updateTag(position: Vec3) {
        this.node.setPosition(position);
    }
}