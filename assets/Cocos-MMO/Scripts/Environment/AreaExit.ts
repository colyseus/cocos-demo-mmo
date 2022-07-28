
import { _decorator, Component, Node, Vec2, Vec3, ITriggerEvent, BoxCollider } from 'cc';
import { EnvironmentController } from '../Managers/EnvironmentController';
import { NetworkedEntityFactory } from '../Managers/NetworkedEntityFactory';
import { NetworkedEntity } from '../Player/NetworkedEntity';
import { Area } from './Area';
import { EntryDoorTrigger } from './EntryDoorTrigger';
import { TransitionRoom } from './TransitionRoom';
const { ccclass, property } = _decorator;

@ccclass('AreaExit')
export class AreaExit extends Component {
    
    @property
    private exitGridChange: Vec2 = new Vec2();
    @property({type: TransitionRoom})
    public transitionRoom: TransitionRoom = null;
    @property({type: EntryDoorTrigger})
    private entryDoorTrigger: EntryDoorTrigger = null;

    private _owner: Area = null;
    private _exitCounter: number = 0;
    private _canExit: boolean = false;
    private _deltaTime: number = 0;
    private _playerInExit: boolean = false;

    public get GridChange() {
        return this.exitGridChange;
    }

    public start() {
        // Subscribe to the entry door trigger events
        this.entryDoorTrigger.playerEnteredDoorTrigger.addEventListener("playerEnteredDoorTrigger", (eventData: Event) => {this.onPlayerEnteredDoorTrigger(((eventData) as CustomEvent<NetworkedEntity>).detail);});
        this.entryDoorTrigger.playerExitedDoorTrigger.addEventListener("playerExitedDoorTrigger", (eventData: Event) => {this.onPlayerExitedDoorTrigger(((eventData) as CustomEvent<NetworkedEntity>).detail);});

        // Subscribe to the trigger events of the exit
        const collider = this.getComponent(BoxCollider);
        collider.on("onTriggerEnter", (eventData: ITriggerEvent) => {this.onTriggerEnter(eventData);}, this);
        collider.on("onTriggerStay", (eventData: ITriggerEvent) => {this.onTriggerStay(eventData);}, this);
        collider.on("onTriggerExit", (eventData: ITriggerEvent) => {this.onTriggerExit(eventData);}, this);
    }

    update(deltaTime: number){
        this._deltaTime = deltaTime;
    }

    public initialize(owner: Area) {
        this._owner = owner;
    }

    public toggleExit(canExit: boolean) {
        this._canExit = canExit;
    }

    public useExit() {
        let playerExitWorldPos: Vec3 = EnvironmentController.Instance.PlayerObject.position;

        playerExitWorldPos.z *= -1;
        playerExitWorldPos.x *= -1;

        this._owner.attemptExit(this.exitGridChange, playerExitWorldPos);
    }

    /** Gets the player's position local to the exit */
    public getExitPlayerLocalPosition(): Vec3 {

        let localPlayerPosition: Vec3 = new Vec3();
        
        // Hacky solution for an inverseTransformPoint like function
        let tempNode: Node = new Node("Pos Helper");
        tempNode.parent = this.transitionRoom.node;
        tempNode.setWorldPosition(EnvironmentController.Instance.PlayerObject.worldPosition);

        localPlayerPosition = tempNode.position;

        // Destroy the temp node, don't need it anymore
        tempNode.destroy();

        return localPlayerPosition;
    }

    /** Converts the position from the exit's local space to world space */
    public playerExitLocalPositionToWorldPosition(localPosition: Vec3): Vec3 {
        
        // Hacky solution for a TransformPoint like function
        let tempNode: Node = new Node("Pos Helper");
        tempNode.parent = this.transitionRoom.node;
        tempNode.setPosition(localPosition);

        const worldPos: Vec3 = tempNode.worldPosition;

        // Destroy the temp node, don't need it anymore
        tempNode.destroy();

        return worldPos;
    }
    
    private enableExitAfterPlayerLeave()
    {
        if(!this._owner) {
            return;
        }

        // Will allow all exits
        this._owner.toggleExit(true);
    }

    // Entry door trigger handlers
    //===========================================================
    private onPlayerEnteredDoorTrigger(entity: NetworkedEntity) {
        
        this.transitionRoom.openDoor(true, null);
    }
    
    private onPlayerExitedDoorTrigger(entity: NetworkedEntity) {

        if(this._playerInExit) {
            return;
        }

        this.transitionRoom.closeDoor(true, null);
    }
    //===========================================================

    // Exit Trigger Handlers
    //===========================================================
    onTriggerEnter(eventData: ITriggerEvent) {
        const networkedEntity: NetworkedEntity = eventData.otherCollider.node.getComponent(NetworkedEntity);

        if(networkedEntity) {
            if(networkedEntity.IsMine) {
                this._playerInExit = true;
                this._owner.currentPlayerExit = this;
                this._exitCounter = 0;
            }
            else {
                this.transitionRoom.openDoor(true, null);
            }
        }
    }

    onTriggerStay(eventData: ITriggerEvent) {
        const networkedEntity: NetworkedEntity = eventData.otherCollider.node.getComponent(NetworkedEntity);

        if(networkedEntity && networkedEntity.IsMine) {
           
            if(this._canExit && this._exitCounter < 3) {
                this._exitCounter += this._deltaTime;

                if(this._exitCounter >= 3) {
                    
                    this.transitionRoom.closeDoor(true, () => {
                        NetworkedEntityFactory.Instance.cameraController.enteredExit(this.transitionRoom.entryCameraTarget, false);

                        setTimeout(() => {this.useExit();}, 2000);
                    });
                }
            }
        }
    }

    onTriggerExit(eventData: ITriggerEvent) {
        const networkedEntity: NetworkedEntity = eventData.otherCollider.node.getComponent(NetworkedEntity);

        if(networkedEntity && networkedEntity.IsMine) {

            this._playerInExit = false;
            
            this._owner.currentPlayerExit = null;

            setTimeout(() => {this.enableExitAfterPlayerLeave();}, 1000);

            NetworkedEntityFactory.Instance.cameraController.leftExit();
        }
    }
    //===========================================================
}