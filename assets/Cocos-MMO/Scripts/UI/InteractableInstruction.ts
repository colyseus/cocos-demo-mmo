
import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('InteractableInstruction')
export class InteractableInstruction extends Component {
    
    @property({type:Label})
    private instructionLabel: Label = null;

    public setInstruction(instruction: string) {
        this.instructionLabel.string = instruction;
    }
}