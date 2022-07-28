
import { _decorator, Component, Node, EditBox, Button } from 'cc';
import { ChatManager } from '../Managers/ChatManager';
const { ccclass, property } = _decorator;

@ccclass('ChatInput')
export class ChatInput extends Component {
    
    @property({type: EditBox})
    private chatInput: EditBox = null;
    @property({type: Button})
    private sendButton: Button = null;

    public toggleChat() {
        this.node.active = !this.node.active;
        if(this.node.active) {

            setTimeout(() => {this.chatInput.focus();}, 100);
        }
        else {
            this.clearText();
        }
    }

    public inputFieldChanged() {
        this.sendButton.interactable = this.chatInput.string.length > 0;
    }

    public onSend() {

        if(this.chatInput.string.length > 0) {
            ChatManager.Instance.sendChat(this.chatInput.string);
            this.clearText();
        }
    }

    public clearText() {
        this.chatInput.string = "";
    }

    public hasFocus(): boolean {
        return this.chatInput.isFocused();
    }

    public focus() {
        this.chatInput.focus();
    }
}