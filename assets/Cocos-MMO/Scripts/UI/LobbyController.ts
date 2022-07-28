import { _decorator, Component, Node, Button, director } from 'cc';
import { Delay } from '../Helpers/Delay';
import { MMOManager } from '../Managers/MMOManager';
import { MMOPlayerPrefs } from '../MMOPlayerPrefs';
import { RequestResponse } from '../Models/RequestResponse';
import { CreateUserMenu } from './CreateUserMenu';
import { ServerSetupMenu } from './ServerSetupMenu';
const { ccclass, property } = _decorator;

@ccclass('LobbyController')
export class LobbyController extends Component {
	@property({ type: Node })
	private connectingCover: Node = null;
	@property({ type: CreateUserMenu })
	private createUserMenu: CreateUserMenu = null;
	@property({ type: ServerSetupMenu })
	private serverMenu: ServerSetupMenu = null;
	@property
	private gameSceneName: string = 'ExampleScene';
	@property({ type: Button })
	private beginButton: Button = null;
	@property({ type: Node })
	private beginBtnSpinner: Node = null;

	onLoad() {
		// Set a handler for when user auth is successful and it's time to load the next scene.
		this.createUserMenu.consumeSeatReservationHandler = (requestResponse) => {
			this.loadNextSceneAndConsumeSeatRes(requestResponse);
		};

		this.connectingCover.active = false;
	}

	async start() {
		while (!MMOManager.Instance.IsReady) {
			await Delay.delay(100);
		}

		this.connectingCover.active = false;
		this.createUserMenu.node.active = false;
		this.serverMenu.node.active = true;
	}

	public onButtonEvent_Begin() {
		MMOManager.Instance.ColyseusServerAddress = this.serverMenu.ServerURL;
		MMOManager.Instance.ColyseusServerPort = Number(this.serverMenu.ServerPort);
		MMOManager.Instance.ColyseusUseSecure = this.serverMenu.UseSecure;

		MMOManager.Instance.initializeClient();

		this.beginButton.interactable = false;
		this.beginBtnSpinner.active = true;

		if (MMOPlayerPrefs.accountExists) {
			this.createUserMenu.logUserIn(MMOPlayerPrefs.email, MMOPlayerPrefs.password, (error) => {
				// in case of quick-login error, take user to log in view
				this.serverMenu.node.active = false;
				this.createUserMenu.enableView(true);
				this.createUserMenu.updateErrorText(error);

				this.beginButton.interactable = true;
				this.beginBtnSpinner.active = false;
			});
		} else {
			this.serverMenu.node.active = false;
			this.createUserMenu.enableView(false);
		}
	}

	public loadNextSceneAndConsumeSeatRes(requestResponse: RequestResponse) {
		if (requestResponse) {
			this.connectingCover.active = true;

			director.loadScene(this.gameSceneName, () => {
				MMOManager.Instance.loadGridAndConsumeSeatReservation(requestResponse);
			});
		} else {
			console.error('Missing response object!');
		}
	}
}
