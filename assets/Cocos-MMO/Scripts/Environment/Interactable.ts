
import { _decorator, Component, Node, Label, Canvas } from 'cc';
import { DataChange } from '../../../../Server/node_modules/@colyseus/schema/lib';
import { InteractableState } from '../../../../Server/src/rooms/schema/RoomState';
import { EventDispatcher } from '../Helpers/EventDispatcher';
import { MMOManager } from '../Managers/MMOManager';
import { NetworkedEntityFactory } from '../Managers/NetworkedEntityFactory';
import { NetworkedEntity } from '../Player/NetworkedEntity';
import { InteractablesUIController } from '../UI/InteractablesUIController';
import { InteractableTrigger } from './InteractableTrigger';
const { ccclass, property } = _decorator;

@ccclass('Interactable')
export class Interactable extends Component {
    
    public onSuccessfulUseEvent: EventDispatcher = new EventDispatcher("onSuccessfulUse");

    /** This must be unique from all other interactables in the grid space, as this is how the interactable will know which schema it is linked to */
    @property
    protected itemID: string = "";
    /** When alerting the server of this interactable, some values will be initialized based on the serverType, namely cost and use durations */
    @property
    protected serverType: string = "DEFAULT";
    // @property({type:Canvas})
    // protected instructionCanvas: Canvas = null;
    /** Displayed when a player enters one of this object's InteractableTrigger colliders */
    @property
    protected instructions: string = "";
    /** The display of the above instructions */
    // @property({type:Label})
    // protected interactionInstructions: Label = null;
    /** For enabling/disabling the instructions */
    // @property({type:Node})
    // protected instructionRoot: Node = null;
    /** User's will press this key to initiate an interaction */
    @property
    public interactionKey: string = "x";


    /** Public ID getter */
    public get ID(): string {
        return this.itemID;
    }

    public get State(): InteractableState {
        return this._state;
    }

    public get Instruction(): string {
        return this.instructions;
    }

    /** Flag to tell local entities whether or not they can attempt to use this object */
    protected isInUse: boolean = false;

    /** Array of InteractableTrigger colliders that a user can enter to initialize an interaction with this object */
    protected triggers: InteractableTrigger[] = null;

    /** The schema state provided from the server */
    protected _state: InteractableState = null;

    onLoad() {

        this.triggers = this.node.getComponentsInChildren(InteractableTrigger);

        //Loop through the triggers and tell them who their owner is
        for(let i = 0; i < this.triggers.length; i++) {
            this.triggers[i].owner = this;
        }

    }

    protected start() {
        InteractablesUIController.Instance.registerInteractable(this);
    }

    /** Set "isInUse" when the "InteractableState" changes */
    public setInUse(inUse: boolean) {
        //Sanity check to make sure an object isn't double-used
        if (this.isInUse === inUse)
        {
            console.error(`Tried to set Interactable ${this.ID}'s isInUse to ${this.isInUse} when it already was!`);
        }

        this.isInUse = inUse;

        //Don't allow interaction when in use
        for (let i = 0; i < this.triggers.length; i++)
        {
            this.triggers[i].enabled = !this.isInUse;
        }
    }

    public inUse(){
        return this.isInUse;
    }

    /** Fired off by an "InteractableTrigger". Alerts the interactable that it has a "NetworkedEntity" within range. Also tells the entity that it is within range of an interactable */
    public playerInRange(entity: NetworkedEntity) {
        if(this.inUse()) {
            return;
        }

        entity.entityNearInteractable(this);
        this.displayInRangeMessage();
    }

    /** Fired off by an "InteractableTrigger". Alerts the interactable that a "NetworkedEntity" has exited it's range. Also tells the entity that it is no longer within range of an interactable */
    public playerLeftRange(entity: NetworkedEntity) {
        entity.entityNearInteractable(null);
        this.hideInRangeMessage();
    }

    /** Sent by a "NetworkedEntity" when they press the "interactionKey" while within range */
    public playerAttemptedUse(entity: NetworkedEntity) {
        if(this.isInUse) {
            return;
        }

        //Hide the interaction message
        this.hideInRangeMessage();
        
        //Tell the server that this entity is attempting to use this interactable
        MMOManager.Instance.sendObjectInteraction(this, entity);
    }

    /** Sent by the "EnvironmentController" after the server sends a "ObjectUseMessage" */
    public onSuccessfulUse(entity: NetworkedEntity) {
        this.onSuccessfulUseEvent.invoke();
    }

    protected displayInRangeMessage() {

        InteractablesUIController.Instance.toggleInstruction(this, true);
    }

    protected hideInRangeMessage() {
        InteractablesUIController.Instance.toggleInstruction(this, false);
    }

    /** Hand off the "InteractableState" from the server */
    public setState(state: InteractableState) {
        this._state = state;
        this._state.onChange = () => {this.onStateChange();};
        this.updateForState();
    }

    /** Clean-up delegates */
    onDestroy() {
        if(this._state) {
            this._state.onChange = null;
        }

        InteractablesUIController.Instance.unRegisterInteractable(this);
    }

    /** Event handler for state changes */
    protected onStateChange() {
        this.updateForState();
    }

    /** Arranges the object based off of it's current state */
    protected updateForState() {
        //The current in use status is not what the State indicates
        if(this.isInUse !== this.State.inUse) {
            if (this.isInUse && !this.State.inUse)
            {
                //Was previously in use but not anymore!
                this.onInteractableReset();
            }
            //Set the interactable's inUse status
            this.setInUse(this.State.inUse);
        }
    }

    /** Triggered When an interactable was previously in use but is no longer */
    protected onInteractableReset() {

    }

    /** Get the server type to initialize the server provided values */
    public getServerType() {
        
        return this.serverType || "DEFAULT";
    }
}