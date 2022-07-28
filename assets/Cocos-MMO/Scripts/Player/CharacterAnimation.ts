
import { _decorator, Component, Node, Animation, AnimationState } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CharacterAnimation')
export class CharacterAnimation extends Component {
    
    @property({type:Animation})
    private animator: Animation = null;

    private _isWalking: boolean = false;

    private _idleAnim: string = "IdleAnim";
    private _walkAnim: string = "WalkAnim";

    start() {
        // Start playing the idle animation
        this.animator.play(this._idleAnim);

        this._isWalking = false;
    }

    public setWalkValue(value: number) {
        
        if(!this._isWalking && value > 0) {
            // Play the walk animation
            this.animator.crossFade(this._walkAnim);
    
            this._isWalking = true;
        }
        else if(this._isWalking && value <= 0) {
            // Play the idle animation
            this.animator.crossFade(this._idleAnim);
    
            this._isWalking = false;
        }
    }
}