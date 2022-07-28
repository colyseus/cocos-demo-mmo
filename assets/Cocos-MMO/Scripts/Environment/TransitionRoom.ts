
import { _decorator, Component, Node, Animation, AnimationState } from 'cc';
import { MathHelpers } from '../Helpers/MathHelpers';
import { TransitionRoomDoorAnimationListener } from './TransitionRoomDoorAnimationListener';
const { ccclass, property } = _decorator;

@ccclass('TransitionRoom')
export class TransitionRoom extends Component {
    
    @property({type: Animation})
    private entryDoorAnimator: Animation = null;
    // @property
    // private exitDoorAnimator: Animator = null;
    @property({type: TransitionRoomDoorAnimationListener})
    private doorAnimListener: TransitionRoomDoorAnimationListener = null;
    @property
    private doorAnimSpeed: number = 1;
    @property({type: Node})
    public entryCameraTarget: Node = null;
    @property({type: Node})
    public exitCameraTarget: Node = null;

    private _openDoorAnimName: string = "door-open";
    private _closeDoorAnimName: string = "door-close";
    private _openDoorAnimState: AnimationState = null;
    private _closeDoorAnimState: AnimationState = null;

    private _onComplete: Function;

    private _entryDoorOpening: boolean = false;

    start() {
        this.doorAnimListener.onAnimationComplete.addEventListener("onTransitionRoomDoorAnimComplete", () => {this.doorAnimationCompleted();});
    }

    public openDoor(isEntry: boolean, onComplete: () => void) {
        if(isEntry) {
            let time: number = 0;
            if(this._openDoorAnimState || this._entryDoorOpening) {
                console.log("Transition Room - Open Door - door already opening, do nothing");
                return;
            }
            else if(this._closeDoorAnimState) {

                // Get the current time of the closing animation
                time = MathHelpers.clamp(1 - this._closeDoorAnimState.time, 0, 1);

                // Stop the close animation and start the open animation from the correct time position
                this.entryDoorAnimator.stop();
                
                console.log(`Transition Room - Open Door - door was closing; cancel and start opening from time ${time}`);
            }

            this.entryDoorAnimator.play(this._openDoorAnimName);

            // Get the animation state 
            this._openDoorAnimState = this.entryDoorAnimator.getState(this._openDoorAnimName);

            // Set playback speed
            this._openDoorAnimState.speed = this.doorAnimSpeed;

            // Set the current time of the animation
            this._openDoorAnimState.setTime(time);

            this._onComplete = onComplete;
            this._entryDoorOpening = true;
        }
        else {
            
            
        }
    }

    public closeDoor(isEntry: boolean, onComplete: () => void) {
        if(isEntry) {
            let time: number = 0;
            if(this._closeDoorAnimState || this._entryDoorOpening === false) {
                console.log("Transition Room - Close Door - door already closing, do nothing");
                return;
            }
            else if(this._openDoorAnimState) {
                // Get the current time of the open animation
                time = MathHelpers.clamp(1 - this._openDoorAnimState.time, 0, 1);

                // Stop the open animation and start the close animation from the correct time position
                this.entryDoorAnimator.stop();

                console.log(`Transition Room - Close Door - door was opening; cancel and start closing from time ${time}`);
            }

            this.entryDoorAnimator.play(this._closeDoorAnimName);

            // Get the animation state 
            this._closeDoorAnimState = this.entryDoorAnimator.getState(this._closeDoorAnimName);

            // Set playback speed
            this._closeDoorAnimState.speed = this.doorAnimSpeed;

            // Set the current time of the animation
            this._closeDoorAnimState.setTime(time);

            this._onComplete = onComplete;
            this._entryDoorOpening = false;
        }
        else {
            
            
        }
    }

    private doorAnimationCompleted() {
        
        console.log(`Transition Room - Door animation completed`);

        // Clear any existing animation states
        this._openDoorAnimState = this._closeDoorAnimState = null;

        if(this._onComplete){
            this._onComplete();
        }
    }
}