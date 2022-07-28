import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ColyseusSettings')
export class ColyseusSettings extends Component {
	@property
	colyseusServerAddress: string = 'localhost';
	@property
	colyseusServerPort: number = 2567;
	@property
	useSecureProtocol: boolean = false;

	start() {}
}
