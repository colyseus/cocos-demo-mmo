import { _decorator, Component, Node, Prefab, Camera, Vec3, Quat, instantiate, UITransform, UITransformComponent, Vec2 } from 'cc';
import type { NetworkedEntityState, RoomState } from '../../../../Server/src/rooms/schema/RoomState';
import { MMOManager } from '../Managers/MMOManager';
import { NetworkedEntityFactory } from '../Managers/NetworkedEntityFactory';
import { NetworkedEntity } from '../Player/NetworkedEntity';
import { PlayerTag } from './PlayerTag';
const { ccclass, property } = _decorator;

/**
 * Responsible for adding/removing player name tags.
 * Subscribes to the OnAdd and OnRemoved events of
 * the "networkedUsers" collection of the room state.
 */
@ccclass('PlayerNameTagController')
export class PlayerNameTagController extends Component {
	@property({ type: UITransformComponent })
	private playerTagRoot: UITransformComponent = null;
	@property({ type: Prefab })
	private nameTagPrefab: Prefab = null;
	@property({ type: Camera })
	private cam: Camera = null;

	private _room: Colyseus.Room<RoomState> = null;
	private _nameTags: Map<string, PlayerTag> = null;

	start() {
		if (!this._nameTags) {
			this._nameTags = new Map<string, PlayerTag>();
		}

		MMOManager.Instance.onRoomChanged.addEventListener('onRoomChanged', (eventData: Event) => {
			this.onRoomChanged((eventData as CustomEvent<Colyseus.Room<RoomState>>).detail);
		});
	}

	onDestroy() {
		MMOManager.Instance.onRoomChanged.removeEventListener('onRoomChanged', (eventData: Event) => {
			this.onRoomChanged((eventData as CustomEvent<Colyseus.Room<RoomState>>).detail);
		});
	}

	private registerHandlers() {
		MMOManager.Instance.onPlayerAdd.addEventListener('onPlayerAdd', (eventData: Event) => {
			this.onPlayerAdded((eventData as CustomEvent<NetworkedEntityState>).detail);
		});
		MMOManager.Instance.onPlayerRemove.addEventListener('onPlayerRemove', (eventData: Event) => {
			this.onPlayerRemoved((eventData as CustomEvent<NetworkedEntityState>).detail);
		});
	}

	private unRegisterHandlers() {
		MMOManager.Instance.onPlayerAdd.removeEventListener('onPlayerAdd', (eventData: Event) => {
			this.onPlayerAdded((eventData as CustomEvent<NetworkedEntityState>).detail);
		});
		MMOManager.Instance.onPlayerRemove.removeEventListener('onPlayerRemove', (eventData: Event) => {
			this.onPlayerRemoved((eventData as CustomEvent<NetworkedEntityState>).detail);
		});
	}

	private onRoomChanged(room: Colyseus.Room<RoomState>) {
		if (this._room) {
			this.unRegisterHandlers();
		}

		this.removeAllTags();

		this._room = room;

		this.registerHandlers();
	}

	/** Event handler for when a user is added to the room's collection of "networkedUsers" */
	private onPlayerAdded(playerState: NetworkedEntityState) {
		if (this.isEntityMine(playerState.id)) {
			return;
		}

		if (!this._nameTags) {
			this._nameTags = new Map<string, PlayerTag>();
		}

		if (this._nameTags.has(playerState.id) === false && this.nameTagPrefab) {
			let nameTag: PlayerTag = instantiate(this.nameTagPrefab).getComponent(PlayerTag);
			nameTag.node.setParent(this.playerTagRoot.node);
			nameTag.node.setPosition(new Vec3(-500, -500, 0));

			nameTag.name = `Player Tag - ${playerState.username}`;

			nameTag.setPlayerTag(playerState.username);

			this._nameTags.set(playerState.id, nameTag);
		}
	}

	private onPlayerRemoved(playerState: NetworkedEntityState) {
		if (this.isEntityMine(playerState.id)) {
			return;
		}

		if (this._nameTags.has(playerState.id)) {
			let nameTag: PlayerTag = this._nameTags.get(playerState.id);

			this._nameTags.delete(playerState.id);

			nameTag.node.destroy();
		}
	}

	lateUpdate(deltaTime: number) {
		this.updatePlayerTags();
	}

	private updatePlayerTags() {
		this._nameTags.forEach((tag: PlayerTag, playerId: string) => {
			let entity: NetworkedEntity = NetworkedEntityFactory.Instance.getEntityById(playerId);

			if (!entity || entity.isValid === false) {
				return;
			}

			// Convert the screen point to a local position within the tag root node
			let tagPos = this.cam.convertToUINode(entity.nameTagPos.worldPosition, this.playerTagRoot.node);

			tag.updateTag(tagPos);
		});
	}

	/** Checks if the given session Id matches the client's session Id */
	private isEntityMine(sessionId: string): boolean {
		return sessionId === MMOManager.Instance.Room.sessionId;
	}

	/** Destroys all existing name tag objects and clears the collection */
	private removeAllTags() {
		if (!this._nameTags) {
			return;
		}

		this._nameTags.forEach((item, key) => {
			item.destroy();
		});

		this._nameTags.clear();
	}
}
