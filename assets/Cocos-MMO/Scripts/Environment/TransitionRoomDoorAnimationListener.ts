
import { _decorator, Component, Node } from 'cc';
import { EventDispatcher } from '../Helpers/EventDispatcher';
const { ccclass, property } = _decorator;

@ccclass('TransitionRoomDoorAnimationListener')
export class TransitionRoomDoorAnimationListener extends Component {
    
    public onAnimationComplete: EventDispatcher = null;

    onLoad() {
        this.onAnimationComplete = new EventDispatcher("onTransitionRoomDoorAnimComplete");
    }

    public onDoorAnimationComplete() {
        //console.log(`${this.node.name} - Transition Room Door Animation Listener - Animation Completed!`);

        this.onAnimationComplete.invoke();
    }
}
