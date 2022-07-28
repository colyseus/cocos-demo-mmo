import { _decorator, Component, Node, Label, macro, Camera } from 'cc';
import { NetworkedEntity } from '../Player/NetworkedEntity';
import { ChatDisplay } from '../UI/ChatDisplay';
import { ChatInput } from '../UI/ChatInput';
import { InGameMenu } from '../UI/InGameMenu';
import { Input } from './Input';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
	private static _instance: UIManager;

	public static get Instance() {
		return this._instance;
	}

	private constructor() {
		super();

		if (UIManager._instance != null) {
			console.error(`UI Manager - Instance already exists!`);
			return;
		}

		UIManager._instance = this;
	}

	public get InGameMenuShowing(): boolean {
		return this.inGameMenu.node.activeInHierarchy;
	}

	@property({ type: Label })
	private gridLocation: Label = null;
	@property({ type: Label })
	private coinCount: Label = null;
	@property({ type: InGameMenu })
	private inGameMenu: InGameMenu = null;
	@property({ type: ChatInput })
	public chatInput: ChatInput = null;
	@property({ type: Camera })
	public camera: Camera = null;

	onDestroy() {
		if (UIManager._instance === this) {
			UIManager._instance = null;
		}
	}

	start() {
		this.toggleInGameMenu();
	}

	update(deltaTime: number) {
		if (Input.getKeyDown(macro.KEY.escape)) {
			this.toggleInGameMenu();
		}

		if (Input.getKeyDown(macro.KEY.grave) && !this.InGameMenuShowing) {
			this.chatInput.toggleChat();
		}
	}

	public movementPrevented(): boolean {
		return this.InGameMenuShowing || this.chatInput.hasFocus();
	}

	public updatePlayerInfo(entity: NetworkedEntity) {
		this.coinCount.string = `Coins: ${entity.Coins}`;
	}

	public updateGrid(grid: string) {
		this.gridLocation.string = grid;
	}

	public toggleChat() {
		this.chatInput.toggleChat();
	}

	public toggleInGameMenu() {
		this.inGameMenu.node.active = !this.inGameMenu.node.active;
		if (this.inGameMenu.node.active) {
			this.inGameMenu.avatarCustomization.closeView(false);
		}
	}
}
