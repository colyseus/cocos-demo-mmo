import { _decorator, Component, Node, EditBox, Button, Toggle, Label } from 'cc';
import { MMOManager } from '../Managers/MMOManager';
import { MMOPlayerPrefs } from '../MMOPlayerPrefs';
const { ccclass, property } = _decorator;

@ccclass('ServerSetupMenu')
export class ServerSetupMenu extends Component {
	public get ServerURL(): string {
		return this.serverURLInput.string;
	}

	public get ServerPort(): string {
		return this.serverPortInput.string;
	}

	public get UseSecure(): boolean {
		return this.secureToggle.isChecked;
	}

	@property({ type: EditBox })
	private serverURLInput: EditBox = null;
	@property({ type: EditBox })
	private serverPortInput: EditBox = null;
	@property({ type: Toggle })
	private secureToggle: Toggle = null;
	@property({ type: Button })
	private logOutButton: Button = null;
	@property({ type: Label })
	private logOutText: Label = null;

	start() {
		this.serverURLInput.string = MMOManager.Instance.ColyseusServerAddress;
		this.serverPortInput.string = `${MMOManager.Instance.ColyseusServerPort}`;
		this.secureToggle.isChecked = MMOManager.Instance.ColyseusUseSecure;

		this.setUpLogOut();
	}

	public onButtonEvent_LogOutExisting() {
		MMOPlayerPrefs.Clear();

		this.setUpLogOut();
	}

	private setUpLogOut() {
		this.logOutButton.node.active = !MMOPlayerPrefs.email === false && !MMOPlayerPrefs.password === false;
		this.logOutText.string = `Log Out ${MMOPlayerPrefs.email}`;
	}
}
