
import { _decorator, Component, Node, Quat } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UISpinner')
export class UISpinner extends Component {
    
    @property
    private spinSpeed: number = 5;
    @property({type:Node})
    private spinNode: Node = null;

    private _tempQuat: Quat = new Quat();

    update (deltaTime: number) {
        this.spinNode.rotate(Quat.fromEuler(this._tempQuat, 0, 0, deltaTime * this.spinSpeed));
    }
}

