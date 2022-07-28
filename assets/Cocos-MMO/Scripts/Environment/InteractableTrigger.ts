
import { _decorator, Component, Node, BoxCollider, ITriggerEvent } from 'cc';
import { NetworkedEntity } from '../Player/NetworkedEntity';
import { Interactable } from './Interactable';
const { ccclass, property } = _decorator;

@ccclass('InteractableTrigger')
export class InteractableTrigger extends Component {
    
    @property({type:Interactable})
    public owner: Interactable = null;

    start() {
        const collider = this.getComponent(BoxCollider);

        collider.on("onTriggerEnter", (eventData: ITriggerEvent) => {this.onTriggerEnter(eventData);}, this);
        collider.on("onTriggerExit", (eventData: ITriggerEvent) => {this.onTriggerExit(eventData);}, this);
    }

    private onTriggerEnter(eventData: ITriggerEvent) {
        console.log(`Interactable Trigger - Enter: ${this.node.name}`);
        const networkedEntity: NetworkedEntity = eventData.otherCollider.node.getComponent(NetworkedEntity);
        if(networkedEntity) {
            this.owner.playerInRange(networkedEntity);
        }
    }

    private onTriggerExit(eventData: ITriggerEvent) {
        console.log(`Interactable Trigger - Exit: ${this.node.name}`);
        const networkedEntity: NetworkedEntity = eventData.otherCollider.node.getComponent(NetworkedEntity);
        if(networkedEntity) {
            this.owner.playerLeftRange(networkedEntity);
        }
    }
}
