
import { _decorator, Component, Node } from 'cc';
import { UIManager } from '../Managers/UIManager';
const { ccclass, property } = _decorator;

@ccclass('FaceCamera')
export class FaceCamera extends Component {
    
    update(deltaTime: number) {
        this.node.lookAt(UIManager.Instance.camera.node.position);
    }
}