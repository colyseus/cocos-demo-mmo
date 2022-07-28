
import { _decorator, Component, Node, Vec3, Quat, CapsuleCollider } from 'cc';
const { ccclass, property } = _decorator;

import type { ChatQueue, NetworkedEntityState } from '../../../../Server/src/rooms/schema/RoomState';
import type { AvatarState } from '../../../../Server/src/rooms/schema/AvatarState';
import { EntityMovement } from './EntityMovement';
import { UIManager } from '../Managers/UIManager';
import { DataChange } from '../../../../extensions/colyseus-sdk/runtime/colyseus';
import { MathHelpers } from '../Helpers/MathHelpers';
import { NetworkedEntityChanges } from '../NetworkedEntityChanges';
import { MMOManager } from '../Managers/MMOManager';
import { ChatDisplay } from '../UI/ChatDisplay';
import { AvatarDisplay } from './AvatarDisplay';
import { CharacterAnimation } from './CharacterAnimation';
import { Interactable } from '../Environment/Interactable';

class EntityState {
    public timestamp: number = 0;
    public pos: Vec3 = new Vec3();
    public rot: Quat = new Quat();
}

@ccclass('NetworkedEntity')
export class NetworkedEntity extends Component {
    
    public get IsMine(): boolean {
        return this._isMine;
    }

    private set IsMine(value: boolean) {
        this._isMine = value;
    }

    public get Id(): string {
        return this._state.id;
    }

    public get ChatId(): string {
        return this._chatId;
    }

    public get StateChatId(): string {
        return this._state.chatID;
    }

    public get Coins(): number {
        return this._state ? this._state.coins : 0;
    }

    public get Avatar(): AvatarState {
        return this._state.avatar;
    }

    public get Username(): string {
        return this._state.username;
    }

    @property({type: EntityMovement})
    private movement: EntityMovement = null;

    @property
    private updateTimer: number = 0.5;

    @property({type:AvatarDisplay})
    private avatarModel: AvatarDisplay = null;

    @property
    public interpolationBackTimeMs: number = 200;
    @property
    public extrapolationLimitMs: number = 500;
    @property
    public positionLerpSpeed: number = 5;
    @property
    public rotationLerpSpeed: number = 5;
    @property({type:Node})
    public nameTagPos: Node = null;
    @property({type:CharacterAnimation})
    private characterAnimation: CharacterAnimation = null;
    
    // Clients store twenty states with "playback" information from the server. This
    // array contains the official state of this object at different times according to
    // the server.
    @property
    private proxyStates: EntityState[] = null;
    
    private _state: NetworkedEntityState = null;
    private _previousState: NetworkedEntityState = null;
    private _localUpdatedState: NetworkedEntityState = null;
    private _isMine: boolean = false;
    private _currentUpdateTime: number = 0;
    private _prevPos: Vec3 = new Vec3();
    private _currentSpeed: number = 0;
    private _walkVal: number = 0;
    private _ignoreMovementSynce: boolean = false;
    private _chatId: string = "";
    private _proxyStateCount: number;
    private _tempVec: Vec3 = new Vec3();
    private _tempQuat: Quat = new Quat();

    private entityCollider: CapsuleCollider = null;

    onLoad() {

        this.proxyStates = [];

        // Initialize with 20 proxy states
        for(let i = 0; i < 20; i++){
            this.proxyStates.push(new EntityState());
        }
    }

    start () {
        
        this.entityCollider = this.getComponent(CapsuleCollider);
    }

    update(deltaTime: number) {
        if(this.IsMine) {
            if(this._currentUpdateTime >= this.updateTimer) {
                this._currentUpdateTime = 0;
                this.syncServerWithView();
                this.setAnimationValues(deltaTime);
            }
            else {
                this._currentUpdateTime += deltaTime;
            }
        }
        else {
            // You are not the owner, so you have to converge the object's state toward the server's state.
            this.processViewSync(deltaTime);
            if(this._currentUpdateTime >= this.updateTimer) {
                this._currentUpdateTime = 0;
                this.setAnimationValues(deltaTime);
            }
            else {
                this._currentUpdateTime += deltaTime;
            }
        }
    }

    /** Lerp this entity's position and rotation towards latest */
    private processViewSync(deltaTime: number) {
        if(this._ignoreMovementSynce) {
            //Don't lerp this object right now
            return;
        }
        
        // This is the target playback time of this body
        let interpolationTime: number = MMOManager.Instance.ServerTime - this.interpolationBackTimeMs;

        // Use interpolation if the target playback time is present in the buffer
        if (this.proxyStates[0].timestamp > interpolationTime)
        {
            // The longer the time since last update add a delta factor to the lerp speed to get there quicker
            let deltaFactor: number = (MMOManager.Instance.ServerTime > this.proxyStates[0].timestamp) ? (MMOManager.Instance.ServerTime - this.proxyStates[0].timestamp) * 0.2 : 0;

            this.node.setPosition(Vec3.distance(this.node.position, this.proxyStates[0].pos) < 5 ? Vec3.lerp(this._tempVec, this.node.position, this.proxyStates[0].pos, deltaTime * (this.positionLerpSpeed + deltaFactor)) : this.proxyStates[0].pos);

            this.node.setRotation(Quat.slerp(this._tempQuat, this.node.rotation, this.proxyStates[0].rot, deltaTime * (this.rotationLerpSpeed + deltaFactor)));
        }
        // Use extrapolation (If we did not get a packet in the last "X" ms and object had velocity)
        else
        {
            let latest: EntityState = this.proxyStates[0];

            let extrapolationLength: number = interpolationTime - latest.timestamp;
            // Don't extrapolate for more than 500 ms, you would need to do that carefully
            if (extrapolationLength < this.extrapolationLimitMs / 1000)
            {
                this.node.setPosition(latest.pos);
                this.node.setRotation(latest.rot);
            }
        }
    }

    public initialize(initialState: NetworkedEntityState, isPlayer: boolean = false) {
        console.log(`NetworkedEntity - Initialize`);
        
        if (this._state)
        {// Unsubscribe from existing state events
            this._state.onChange = null;
            this._state.avatar.onChange = null;
        }

        this._isMine = isPlayer;
        this._state = initialState;
        this._previousState = this._state;
        this.movement.enabled = isPlayer;
        this.movement.owner = this;
        this._state.onChange = (changes) => this.onStateChange(changes);
        this._state.avatar.onChange = (changes) => this.avatarOnChange(changes);

        this._prevPos = new Vec3(this.node.position.x, this.node.position.y, this.node.position.z);

        if (!this.IsMine)
        {
            this._chatId = initialState.chatID;
        }
        else
        {
            UIManager.Instance.updatePlayerInfo(this);
        }
    }

    private setAnimationValues(deltaTime: number)
    {
        //Update local speed reference
        if (this._prevPos !== this.node.position)
        {
            let dist: Vec3 = Vec3.subtract(this._tempVec, this.node.position, this._prevPos);
            
            this._currentSpeed = dist.length() / deltaTime;
            this._prevPos.set(this.node.position);
        }

        this._walkVal = this._currentSpeed / this.movement.moveSpeed;

        this.characterAnimation.setWalkValue(MathHelpers.clamp(this._walkVal, 0, 1));
    }

    public setChatId(chatId: string) {

        this._chatId = chatId;
        
        //Let the server know we have a ChatID now
        this.syncServerWithView();
    }

    private onStateChange(changes: DataChange[]) {
        //If not mine Sync
        if (!this._isMine)
        {
            this.syncViewWithServer();
        }
        else
        {
            let userInfoChanged: boolean = false;
            //Check for coin change
            changes.forEach((change) =>
            {
                if (change.field === "coins")
                {
                    userInfoChanged = true;
                }
            });

            if (userInfoChanged)
            {
                UIManager.Instance.updatePlayerInfo(this);
            }
        }
    }
    
    private avatarOnChange(changes: DataChange[]) {
        this.updateAvatar();
    }

    public updateAvatar()
    {
        if(this.avatarModel)
            this.avatarModel.displayFromState(this._state.avatar);
    }

    /** Send this entity's position and rotation values to the server to be synced with all other clients. */
    private syncServerWithView()
    {
        this._previousState = JSON.parse(JSON.stringify(this._state));

        //Copy Transform to State (round position to fix floating point issues with state compare)
        this._state.xPos = MathHelpers.round(this.node.position.x, 4);
        this._state.yPos = MathHelpers.round(this.node.position.y, 4);
        this._state.zPos = MathHelpers.round(this.node.position.z, 4);

        this._state.xRot = this.node.rotation.x;
        this._state.yRot = this.node.rotation.y;
        this._state.zRot = this.node.rotation.z;
        this._state.wRot = this.node.rotation.w;
        
        if (this._state.chatID !== this._chatId)
        {
            this._state.chatID = this._chatId;
        }

        // No need to update again if last sent state == current view modified state
        if (this._localUpdatedState)
        {
            let changesLocal: NetworkedEntityChanges[] = NetworkedEntityChanges.compare(this._localUpdatedState, this._state);
            if (changesLocal.length == 0 || (changesLocal.length == 1 && changesLocal[0].Name == "timestamp"))
            {
                return;
            }
        }

        let changes: NetworkedEntityChanges[] = NetworkedEntityChanges.compare(this._previousState, this._state);

        //Transform has been update locally, push changes
        if (changes.length > 0)
        {
            //Create Change Set Array for NetSend
            let changeSet: any[] = new Array<any>((changes.length * 2) + 1);
            changeSet[0] = this._state.id;
            let saveIndex: number = 1;
            for (let i: number = 0; i < changes.length; i++)
            {
                changeSet[saveIndex] = changes[i].Name;
                changeSet[saveIndex + 1] = changes[i].NewValue;
                saveIndex += 2;
            }
            this._localUpdatedState = JSON.parse(JSON.stringify(this._state));

            MMOManager.netSend("entityUpdate", changeSet);
        }
    }

    /** Synchronize this entity with the current position and rotation values from the state */
    private syncViewWithServer()
    {
        // Network player, receive data
        let pos: Vec3 = new Vec3(this._state.xPos, this._state.yPos, this._state.zPos);
        let rot: Quat = new Quat(this._state.xRot, this._state.yRot, this._state.zRot, this._state.wRot);

        // Shift the buffer sideways, deleting state 20
        for (let i: number = this.proxyStates.length - 1; i >= 1; i--)
        {
            this.proxyStates[i] = this.proxyStates[i - 1];
        }

        // Record current state in slot 0
        let newState: EntityState = new EntityState(); //Make sure timestamp is in ms
        newState.timestamp = this._state.timestamp;
        newState.pos = pos;
        newState.rot = rot;
        this.proxyStates[0] = newState;

        // Update used slot count, however never exceed the buffer size
        // Slots aren't actually freed so this just makes sure the buffer is
        // filled up and that uninitalized slots aren't used.
        this._proxyStateCount = Math.min(this._proxyStateCount + 1, this.proxyStates.length);

        // Check if states are in order
        if (this.proxyStates[0].timestamp < this.proxyStates[1].timestamp)
        {
            console.warn(`Timestamp inconsistent: ${this.proxyStates[0].timestamp} should be greater than ${this.proxyStates[1].timestamp}`);
        }

        this._chatId = this._state.chatID;
    }

    public entityNearInteractable(interactable: Interactable) {
        this.movement.setCurrentInteractable(interactable);
    }

    public setMovementEnabled(val: boolean) {
        if (this.IsMine) {
            this.movement.enabled = val;
        }
    }

    public setIgnoreMovementSync(ignore: boolean) {
        this._ignoreMovementSynce = ignore;
    }
}
