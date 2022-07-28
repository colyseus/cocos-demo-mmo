import { _decorator, Component, Node, UITransformComponent, Prefab, Camera, instantiate, Vec3 } from 'cc';
import { ChatQueue } from '../../../../Server/lib/rooms/schema/RoomState';
import { ChatRoomState, NetworkedEntityState, RoomState } from '../../../../Server/src/rooms/schema/RoomState';
import { Delay } from '../Helpers/Delay';
import { ChatManager } from '../Managers/ChatManager';
import { MMOManager } from '../Managers/MMOManager';
import { NetworkedEntityFactory } from '../Managers/NetworkedEntityFactory';
import { NetworkedEntity } from '../Player/NetworkedEntity';
import { ChatDisplay } from './ChatDisplay';
import { PlayerTag } from './PlayerTag';
const { ccclass, property } = _decorator;

@ccclass('PlayerChatController')
export class PlayerChatController extends Component {
	@property({ type: UITransformComponent })
	private chatDisplayRoot: UITransformComponent = null;
	@property({ type: Prefab })
	private chatDisplayPrefab: Prefab = null;
	@property({ type: Camera })
	private cam: Camera = null;

	private _chats: Map<string, ChatDisplay> = null;

	start() {
		this._chats = new Map<string, ChatDisplay>();

		this.onQueueAdded = this.onQueueAdded.bind(this);
		this.onQueueRemoved = this.onQueueRemoved.bind(this);

		this.registerHandlers();
	}

	onDestroy() {
		this.unRegisterHandlers();
	}

	private registerHandlers() {
		ChatManager.Instance.onQueueAdded.addEventListener('onQueueAdded', this.onQueueAdded);
		ChatManager.Instance.onQueueRemoved.addEventListener('onQueueRemoved', this.onQueueRemoved);
	}

	private unRegisterHandlers() {
		if (!ChatManager.Instance) {
			return;
		}

		ChatManager.Instance.onQueueAdded.removeEventListener('onQueueAdded', this.onQueueAdded);
		ChatManager.Instance.onQueueRemoved.removeEventListener('onQueueRemoved', this.onQueueRemoved);
	}

	private async onQueueAdded(eventData: Event) {
		const playerChatId: string = (eventData as CustomEvent<string>).detail;

		let entity: NetworkedEntity = null;
		do {
			entity = NetworkedEntityFactory.Instance.getNetworkedEntityByChatId(playerChatId);
			await Delay.delay(10);
		} while (!entity);

		if (this._chats.has(playerChatId) === false) {
			let chatDisplay: ChatDisplay = instantiate(this.chatDisplayPrefab).getComponent(ChatDisplay);
			chatDisplay.node.setParent(this.chatDisplayRoot.node);
			chatDisplay.node.setPosition(new Vec3(-500, -500, 0));

			chatDisplay.setEntity(entity);

			this._chats.set(playerChatId, chatDisplay);
		}
	}

	private onQueueRemoved(eventData: Event) {
		const playerChatId: string = (eventData as CustomEvent<string>).detail;

		if (this._chats.has(playerChatId)) {
			let chatDisplay: ChatDisplay = this._chats.get(playerChatId);

			this._chats.delete(playerChatId);

			chatDisplay.node.destroy();
		}
	}

	lateUpdate(deltaTime: number) {
		this.updatePlayerChats();
	}

	private updatePlayerChats() {
		this._chats.forEach((chatDisplay: ChatDisplay, playerChatId: string) => {
			if (!chatDisplay.Entity || chatDisplay.Entity.isValid === false) {
				return;
			}

			// Convert the screen point to a local position within the chat root node
			let chatPos = this.cam.convertToUINode(chatDisplay.Entity.nameTagPos.worldPosition, this.chatDisplayRoot.node);

			chatDisplay.updatePos(chatPos);
		});
	}

	/** Destroys all existing chat display objects and clears the collection */
	private removeAllChats() {
		if (!this._chats) {
			return;
		}

		this._chats.forEach((chat, key) => {
			chat.node.destroy();
		});

		this._chats.clear();
	}

	public handMessages(chatId: string, queue: ChatQueue) {
		if (this._chats.has(chatId)) {
			const chatDisplay: ChatDisplay = this._chats.get(chatId);
			chatDisplay.handMessages(queue);
		} else {
			console.error(`Player Chat Controller - Cannot hand messages - No chat display for chat Id: \"${chatId}\"`);
		}
	}

	public leftChatRoom() {
		this.removeAllChats();
	}
}
