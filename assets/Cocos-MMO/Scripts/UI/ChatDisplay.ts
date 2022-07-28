import { _decorator, Component, Node, instantiate, Prefab, ScrollView, Vec3 } from 'cc';
import type { ChatMessage, ChatQueue } from '../../../../Server/src/rooms/schema/RoomState';
import { NetworkedEntity } from '../Player/NetworkedEntity';
import { ChatInput } from './ChatInput';
import { ChatMessageView } from './ChatMessageView';
import { FaceCamera } from './FaceCamera';
const { ccclass, property } = _decorator;

@ccclass('ChatDisplay')
export class ChatDisplay extends Component {
	@property({ type: Prefab })
	private chatViewPrefab: Prefab = null;
	@property({ type: Node })
	private listRoot: Node = null;
	@property
	public maxDisplay: number = 1;
	// @property({type: ChatInput})
	// public chatInput: ChatInput = null;
	// @property({type: ScrollView})
	// private scrollView: ScrollView = null;

	private _messages: ChatMessage[] = [];
	private _spawnedViews: ChatMessageView[] = [];
	private _viewsOnDisplay: ChatMessageView[] = [];
	private _tempChatView: ChatMessageView = null;
	private _chatEntity: NetworkedEntity = null;

	public get Entity(): NetworkedEntity {
		return this._chatEntity;
	}

	// public toggleChat() {
	//     this.node.active = !this.node.active;

	//     if(this.node.active) {

	//         this.scrollView.scrollToBottom();

	//         setTimeout(() => {this.chatInput.focus();}, 100);
	//     }
	//     else {
	//         this.chatInput.clearText();
	//     }
	// }

	public setEntity(entity: NetworkedEntity) {
		this._chatEntity = entity;
	}

	public handMessages(queue: ChatQueue) {
		let compareList: ChatMessage[] = [];
		queue.chatMessages.forEach((message, idx, arr) => {
			compareList.push(message);
		});

		// Sort the messages by their timestamp
		compareList.sort(this.messageSort);

		if (this._messages != compareList) {
			this._messages = compareList;
			this.handleNewMessages();
		}
	}

	public handMessagesList(newList: ChatMessage[]) {
		if (this._messages != newList) {
			this._messages = newList;
			this.handleNewMessages();
		}
	}

	private handleNewMessages() {
		let viewsStillInUse: ChatMessageView[] = [];

		if (this._messages.length > this.maxDisplay) {
			let overCount: number = this._messages.length - this.maxDisplay;

			this._messages.splice(0, overCount);
		}

		let count: number = Math.min(this.maxDisplay, this._messages.length);

		for (let i = count - 1; i >= 0; i--) {
			//  _tempChatView is assigned in "messageDisplaying"
			if (this.messageDisplaying(this._messages[i])) {
				viewsStillInUse.push(this._tempChatView);
			} else {
				this._viewsOnDisplay.push(this._tempChatView);
				viewsStillInUse.push(this._tempChatView);
			}

			this._tempChatView.node.setSiblingIndex(count - i);
		}

		let viewsToRemove: ChatMessageView[] = [];
		this._viewsOnDisplay.forEach((oldView, idx, arr) => {
			if (!viewsStillInUse.includes(oldView)) {
				//We aren't still using this view, discard it
				oldView.unsetMessage();
				viewsToRemove.push(oldView);
			}
		});

		viewsToRemove.forEach((oldView, idx, arr) => {
			let index: number = this._viewsOnDisplay.indexOf(oldView);
			this._viewsOnDisplay.splice(index, 1);
		});
	}

	private messageDisplaying(message: ChatMessage): boolean {
		for (let i = 0; i < this._viewsOnDisplay.length; ++i) {
			if (this._viewsOnDisplay[i].isMessage(message)) {
				this._tempChatView = this._viewsOnDisplay[i];
				return true;
			}
		}

		this._tempChatView = this.spawnOrRecycleView();

		this._tempChatView.setMessage(message);
		return false;
	}

	private spawnOrRecycleView(): ChatMessageView {
		let view: ChatMessageView = null;
		for (let i = 0; i < this._spawnedViews.length; ++i) {
			if (!this._spawnedViews[i].node.active) {
				view = this._spawnedViews[i];
			}
		}

		if (!view) {
			let newObject: Node = instantiate(this.chatViewPrefab);
			newObject.parent = this.listRoot;
			view = newObject.getComponent(ChatMessageView);
			this._spawnedViews.push(view);
		}
		return view;
	}

	/** Compares timestamps between two Chat Messages */
	private messageSort(x: ChatMessage, y: ChatMessage): number {
		return x.timestamp - y.timestamp;
	}

	public clearMessages() {
		let childCount: number = this.listRoot.children.length;

		for (let i = childCount - 1; i >= 0; i--) {
			this.listRoot.children[i].destroy();
		}

		this._messages = [];
		this._spawnedViews = [];
		this._viewsOnDisplay = [];
		this._tempChatView = null;
	}

	public updatePos(position: Vec3) {
		this.node.setPosition(position);
	}
}
