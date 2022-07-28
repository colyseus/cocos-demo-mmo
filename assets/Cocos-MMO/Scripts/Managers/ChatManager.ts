
import { _decorator, Component, Node } from 'cc';
import { ChatRoomState } from '../../../../Server/lib/rooms/schema/RoomState';
import type { MapSchema } from '../../../../Server/node_modules/@colyseus/schema/lib';
import type { ChatMessage, ChatQueue } from '../../../../Server/src/rooms/schema/RoomState';
import { Delay } from '../Helpers/Delay';
import { EventDispatcher } from '../Helpers/EventDispatcher';
import { NetworkedEntity } from '../Player/NetworkedEntity';
import { PlayerChatController } from '../UI/PlayerChatController';
import { NetworkedEntityFactory } from './NetworkedEntityFactory';
import { UIManager } from './UIManager';
const { ccclass, property } = _decorator;

@ccclass('ChatManager')
export class ChatManager extends Component {
    
    private static _instance: ChatManager;

    public static get Instance() {
        return this._instance;
    }

    private constructor() {
        super();

        if (ChatManager._instance != null) {

            console.error(`Chat Manager - Instance already exists!`);
            return;
        }

        ChatManager._instance = this;
    }

    public onQueueAdded: EventDispatcher<string> = new EventDispatcher<string>("onQueueAdded");
    public onQueueRemoved: EventDispatcher<string> = new EventDispatcher<string>("onQueueRemoved");

    @property
    public messageShowTime: number = 0;
    @property({type:PlayerChatController})
    private playerChatController: PlayerChatController = null;

    private _chatRoom: Colyseus.Room<ChatRoomState> = null;

    onDestroy() {
        this.leaveChatroom();

        if(ChatManager._instance === this) {
            ChatManager._instance = null;
        }
    }

    /** Hand the manager the current ChatRoom  */
    public async setRoom(room: Colyseus.Room<ChatRoomState>) {
        this._chatRoom = room;

        this.registerForMessages();

        while(!NetworkedEntityFactory.Instance.getMine()) {
            await Delay.delay(100);
        }

        this.connectIDs();
    }
    
    private registerForMessages() {
        if (this._chatRoom)
        {
            this._chatRoom.state.chatQueue.onAdd = (item: ChatQueue, key: string) => {
                
                item.chatMessages.onAdd = (item: ChatMessage, idx: number) => {
                    this.chatsUpdated(this._chatRoom.state);
                };

                item.chatMessages.onRemove = (item: ChatMessage, idx: number) => {
                    this.chatsUpdated(this._chatRoom.state);
                };

                this.onQueueAdded.invoke(key);
            };

            this._chatRoom.state.chatQueue.onRemove = (item: ChatQueue, key: string) => {
                
                this.onQueueRemoved.invoke(key);
            };

        }
    }

    private unregisterForMessages() {
        if (this._chatRoom && this._chatRoom.state)
        {
            this._chatRoom.state.chatQueue.forEach((item: ChatQueue) => {

                if(item) {
                    item.chatMessages.onAdd = null;
                    item.chatMessages.onRemove = null;
                }
            });
        }
    }

    //Chat room ID and MMO Room ID will be different, need to connect those values
    private connectIDs() {

        let entity: NetworkedEntity = NetworkedEntityFactory.Instance.getMine();
        if (entity && this._chatRoom)
        {
            entity.setChatId(this._chatRoom.sessionId);
        }
        else {
            console.error(`Chat Manager - ConnectIDs - Either No Entity or No Chat Room Yet!`);
        }
    }

    private chatsUpdated(state: ChatRoomState) {
        
        //We have at least 1 message
        if (state.chatQueue.size > 0)
        {
            this.handleMessages(state.chatQueue);
        }
    }

    private handleMessages(chatQueue: MapSchema<ChatQueue>) {

        chatQueue.forEach((queue, clientId) => {

            this.playerChatController.handMessages(clientId, queue);
        });

    }

    public sendChat(message: string) {
        this._chatRoom?.send("sendChat", {
            message
        });
    }

    public leaveChatroom() {
        UIManager.Instance.chatInput.clearText();
        this.unregisterForMessages();
        this.playerChatController.leftChatRoom();
        this._chatRoom?.leave(true);
    }
}