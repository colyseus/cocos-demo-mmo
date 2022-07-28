
import { _decorator, Component, Node, Label } from 'cc';
import type { ChatMessage } from '../../../../Server/src/rooms/schema/RoomState';
import { Delay } from '../Helpers/Delay';
import { NetworkedEntityFactory } from '../Managers/NetworkedEntityFactory';
const { ccclass, property } = _decorator;

@ccclass('ChatMessageView')
export class ChatMessageView extends Component {
    
    @property({type: Label})
    private messageContents: Label = null;

    private _currentMessage: ChatMessage = null;

    public isMessage(proposedMessage: ChatMessage): boolean
    {
        if(this._currentMessage) {
            return proposedMessage.timestamp === this._currentMessage.timestamp;
        }

        return false;
    }

    public setMessage(message: ChatMessage) {
        
        this._currentMessage = message;
        this.messageContents.string =`${message.message}`;
        this.node.active = true;
    }

    public unsetMessage() {
        this._currentMessage = null;
        this.node.active = false;
    }
}