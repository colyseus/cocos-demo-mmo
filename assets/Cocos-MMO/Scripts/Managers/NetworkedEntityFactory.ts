
import { _decorator, Component, Node, Vec3, Vec2, instantiate, Prefab, director, Quat, RigidBody } from 'cc';
const { ccclass, property } = _decorator;

import { ChatQueue, NetworkedEntityState } from '../../../../Server/src/rooms/schema/RoomState';
import { CameraController } from '../Player/CameraController';
import { EntityMovement } from '../Player/EntityMovement';
import { NetworkedEntity } from '../Player/NetworkedEntity';
import { EnvironmentController } from './EnvironmentController';

@ccclass('NetworkedEntityFactory')
export class NetworkedEntityFactory extends Component {
    
    private static _instance: NetworkedEntityFactory;

    public static get Instance() {

        if(!this._instance) {
            console.error(`No NetworkedEntityFactory in scene!`);
        }

        return this._instance;
    }

    private constructor() {
        super();

        if (NetworkedEntityFactory._instance != null) {

            console.error(`Networked Entity Factory - Instance already exists!`);
            return;
        }

        NetworkedEntityFactory._instance = this;
    }

    @property({type: CameraController})
    public cameraController: CameraController = null;
    @property({type: Prefab})
    private entityPrefab: Prefab  = null;

    @property({type:Map})
    private entities: Map<string, NetworkedEntity> = null;

    private _ourEntityId: string = "";

    onLoad() {
        this.entities = new Map<string, NetworkedEntity>();
    }

    onDestroy() {
        if(NetworkedEntityFactory._instance === this) {
            NetworkedEntityFactory._instance = null;
        }
    }

    /**
     * Instantiates a new player object setting its position and rotation as it is in the state. 
     * @param state The state for the player entity.
     * @param isPlayer Will this entity belong to this client?
     */
    public spawnEntity(state: NetworkedEntityState, isPlayer: boolean = false) {
        let position: Vec3 = new Vec3(state.xPos, state.yPos, state.zPos);
        let rot: Quat =  new Quat(state.xRot, state.yRot, state.zRot, 1.0);

        // Spawn the entity while also making it a child object of the grid area
        let newEntity: Node = instantiate(this.entityPrefab);
        
        newEntity.parent = EnvironmentController.Instance.CurrentArea.node;
        newEntity.setPosition(position);
        newEntity.setRotation(rot);

        let entity: NetworkedEntity = newEntity.getComponent(NetworkedEntity);
        entity.initialize(state, isPlayer);
        this.entities.set(state.id, entity);

        if (isPlayer)
        {
            this._ourEntityId = state.id;

            this.setCameraTarget(newEntity);
            EnvironmentController.Instance.setPlayerObject(newEntity, state);
            newEntity.getComponent(EntityMovement).cameraNode = this.cameraController.node;
            newEntity.getComponent(RigidBody).isKinematic = false;
        }
    }

    public setCameraTarget(target: Node) {
        this.cameraController.setFollow(target);
    }

    /**
     * Updates this client's entity with the new state.
     * @param state The state to update this client's entity with.
     */
    public updateOurEntity(state: NetworkedEntityState): boolean {

        if (this.entities.has(this._ourEntityId))
        {
            let entity: NetworkedEntity = this.entities.get(this._ourEntityId);
            this.entities.delete(this._ourEntityId);

            entity.initialize(state, true);

            this._ourEntityId = state.id;

            this.entities.set(this._ourEntityId, entity);

            return true;
        }

        console.error(`Missing our entity? - \"${this._ourEntityId}\"`);

        return false;
    }

    public removeEntity(sessionId: string){
        if (this.entities.has(sessionId))
        {
            let entity: NetworkedEntity = this.entities.get(sessionId);
            this.entities.delete(sessionId);
            
            entity.node.destroy();
        }
    }

    public getUsernameFromChatId(chatId: string): string {
        
        let username: string = null;

        this.entities.forEach((entity, sessionId) => {
            
            if(!username && entity.StateChatId === chatId) {
                
                username = entity.Username;
            }
        });

        if(!username) {
            console.error(`No entity found for chatId: ${chatId}`);
        }

        return username || "N/A"; 
    }

    public getNetworkedEntityByChatId(chatId: string): NetworkedEntity {
        let entity: NetworkedEntity = null;

        this.entities.forEach((ent, sessionId) => {
            
            if(ent.StateChatId === chatId) {
                
                entity = ent;
            }
        });

        return entity; 
    }

    /** Returns the NetworkedEntity belonging to this client. */
    public getMine(): NetworkedEntity {

        let ourEntity: NetworkedEntity = null;

        this.entities.forEach((entity, sessionId) => {
            
            if(!ourEntity && entity.IsMine) {
                
                ourEntity = entity;
            }
        });

        if(!ourEntity) {
            console.error(`No entity found for user!`);
        }

        return ourEntity; 
    }

    /**
     * Returns the NetworkedEntity belonging to the given session Id if one exists.
     * @param sessionId The session Id of the client of the NetworkedEntity we want.
     * @returns 
     */
    public getEntityById(sessionId: string) {
        if(this.entities.has(sessionId)) {
            return this.entities.get(sessionId);
        }

        return null;
    }

    /**
     * Clears the collection of controlled NetworkedEntitys and destroys all the linked player game objects.
     * @param excluedOurs If true the NetworkedEntity and player game object belonging to this client will not be removed and destroyed.
     */
    public removeAllEntities(excludeOurs: boolean) {

        let toRemove: string[] = [];

        // Destroy the entity object and add its key to the list to remove the entity entry from the map
        this.entities.forEach((entity, sessionId) => {
            if(entity.IsMine === false || excludeOurs === false) {
                
                toRemove.push(sessionId);

                entity.destroy();
            }
        });

        // Remove entries from the map
        for(let i = 0; i < toRemove.length; i++) {
            this.entities.delete(toRemove[i]);
        }
    }

}
