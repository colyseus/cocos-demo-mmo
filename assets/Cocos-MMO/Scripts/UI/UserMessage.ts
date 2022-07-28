
import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UserMessage')
export class UserMessage extends Component {
    
    @property({type: Label})
    private message: Label = null;
}