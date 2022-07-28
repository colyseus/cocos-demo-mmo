
import { _decorator, Component, Node, BoxCollider, ITriggerEvent } from 'cc';
import { EventDispatcher } from '../Helpers/EventDispatcher';
import { NetworkedEntity } from '../Player/NetworkedEntity';
const { ccclass, property } = _decorator;

@ccclass('EntryDoorTrigger')
export class EntryDoorTrigger extends Component {
    
    public playerEnteredDoorTrigger: EventDispatcher<NetworkedEntity>;
    public playerExitedDoorTrigger: EventDispatcher<NetworkedEntity>;

    public get TriggerOccupied(): boolean {
        return this._triggerOccupied;
    }

    private set TriggerOccupied(value: boolean) {
        this._triggerOccupied = value;
    }

    private _triggerOccupied: boolean = false;

    /** Collection to keep track of entities that have recently passed through this trigger */
    private _entityEnterLog: Map<string, Map<boolean, number>> = new Map<string, Map<boolean, number>>();

    onLoad() {
        this.playerEnteredDoorTrigger = new EventDispatcher<NetworkedEntity>("playerEnteredDoorTrigger");
        this.playerExitedDoorTrigger = new EventDispatcher<NetworkedEntity>("playerExitedDoorTrigger");
    }

    start() {
        const collider = this.getComponent(BoxCollider);

        collider.on("onTriggerEnter", (eventData: ITriggerEvent) => {this.onTriggerEnter(eventData);}, this);
        collider.on("onTriggerExit", (eventData: ITriggerEvent) => {this.onTriggerExit(eventData);}, this);
    }

    update(deltaTime: number) {
        let keys = this._entityEnterLog.keys();

        const mapCount: number = this._entityEnterLog.size;

        for(let i = 0; i < mapCount; i++) {
            const key: string = keys.next().value;

            if(this._entityEnterLog.get(key).has(false)) {
                
                // Remove log if it has expired after x seconds since the entity has left the trigger
                if(this._entityEnterLog.get(key).get(false) - this._entityEnterLog.get(key).get(true) > 0 &&
                Date.now() - this._entityEnterLog.get(key).get(false) >= 5000) {
                    this._entityEnterLog.delete(key);
                }
            }
        }
    }

    public hasEntityPassedThrough(entity: NetworkedEntity): boolean {
        return this._entityEnterLog.has(entity.Id);
    }

    private logEntity(entity: NetworkedEntity, entered: boolean) {
        if(this._entityEnterLog.has(entity.Id)) {
            this._entityEnterLog.get(entity.Id).set(entered, Date.now());
        }
        else {
            let newMap = new Map<boolean, number>();
            newMap.set(entered, Date.now())

            this._entityEnterLog.set(entity.Id, newMap);
        }
    }

    // Trigger Event Handlers
    //==================================================================
    onTriggerEnter(eventData: ITriggerEvent) {
        
        const networkedEntity: NetworkedEntity = eventData.otherCollider.node.getComponent(NetworkedEntity);

        if(networkedEntity) {
            this.logEntity(networkedEntity, true);

            this.playerEnteredDoorTrigger.invoke(networkedEntity);
        }
    }

    onTriggerExit(eventData: ITriggerEvent) {

        const networkedEntity: NetworkedEntity = eventData.otherCollider.node.getComponent(NetworkedEntity);

        if(networkedEntity) {
            this.logEntity(networkedEntity, false);

            this.playerExitedDoorTrigger.invoke(networkedEntity);
        }
    }
    //==================================================================
}