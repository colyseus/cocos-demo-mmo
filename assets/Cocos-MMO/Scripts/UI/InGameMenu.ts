
import { _decorator, Component, Node } from 'cc';
import type { AvatarState } from '../../../../Server/src/rooms/schema/AvatarState';
import { MMOManager } from '../Managers/MMOManager';
import { NetworkedEntityFactory } from '../Managers/NetworkedEntityFactory';
import { UIManager } from '../Managers/UIManager';
import { NetworkedEntity } from '../Player/NetworkedEntity';
import { AvatarCustomization } from './AvatarCustomization';
const { ccclass, property } = _decorator;

@ccclass('InGameMenu')
export class InGameMenu extends Component {
    
    @property({type:AvatarCustomization})
    public avatarCustomization: AvatarCustomization = null;

    start() {
        this.avatarCustomization.closeView(false);
    }

    public onButtonClose() {
        UIManager.Instance.toggleInGameMenu();
    }

    public onButtonMainMenu() {
        MMOManager.Instance.exitToMainMenu();
    }

    public onButtonCustomize() {
        let entity: NetworkedEntity = NetworkedEntityFactory.Instance.getMine();

        if(entity && entity.Avatar) {

            const avatarClone: AvatarState = JSON.parse(JSON.stringify(entity.Avatar)) as AvatarState;

            this.avatarCustomization.displayView(avatarClone, this.onCustomizationSave);
        }
    }

    private onCustomizationSave(avatarState: AvatarState) {
        MMOManager.netSend("avatarUpdate", [avatarState.skinColor, avatarState.shirtColor, avatarState.pantsColor, avatarState.hatColor, avatarState.hatChoice]);
    }
}