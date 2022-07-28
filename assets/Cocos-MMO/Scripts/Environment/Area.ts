
import { _decorator, Component, Node, Vec2, Vec3 } from 'cc';
import { InteractableState } from '../../../../Server/src/rooms/schema/RoomState';
import { MMOManager } from '../Managers/MMOManager';
import { AreaExit } from './AreaExit';
import { Interactable } from './Interactable';
const { ccclass, property } = _decorator;

@ccclass('Area')
export class Area extends Component {
    
    @property({type:Vec2})
    private gridPosition: Vec2 = new Vec2();
    @property({type:Vec2})
    public areaDimensions: Vec2 = new Vec2(100, 100)
    @property({type: AreaExit})
    private exits: AreaExit[] = [];
    @property({type: AreaExit})
    public currentPlayerExit: AreaExit = null;

    private _interactables: Interactable[] = null;

    onLoad() {
        for(let i = 0; i < this.exits.length; i++) {
            this.exits[i].initialize(this);
        }

        this._interactables = this.getComponentsInChildren(Interactable);
    }

    /**
     * Sends a message to the room on the server that a grid transition has been initiated by this client.
     * @param gridChange The grid change delta to be applied to the current grid coordinates.
     * @param trasitionPosition The position the client entity should be set to at the end of the transition.
     */
    public attemptExit(gridChange: Vec2, trasitionPosition: Vec3) {
        MMOManager.netSend("transitionArea", [
            gridChange,
            trasitionPosition
        ]
        );
    }

    /**
     * Toggle whether grid exits can initiate an area transition
     * @param canExit 
     */
    public toggleExit(canExit: boolean) {
        for(let i:number = 0; i < this.exits.length; i++) {
            this.exits[i].toggleExit(canExit);
        }
    }

    /**
     * Get the Area's exit based off of the change that it would provide
     * @param change 
     */
    public getExitByChange(change: Vec2): AreaExit {

        for(let i:number = 0; i < this.exits.length; i++) {
            
            if(this.exits[i].GridChange.x === change.x && this.exits[i].GridChange.y === change.y) {
                return this.exits[i];
            }
        }

        console.error(`${this.node.name} - Failed to Get Exit By Change (${change.x}, ${change.y})`);

        return null;
    }

    /** Sent by the server to associate an "InteractableState" with it's representation in the grid space */
    public getInteractableByState(state: InteractableState): Interactable {

        let interactable: Interactable = null;

        this._interactables.forEach((inter) => {
            if(!interactable && inter.ID === state.id) {

                if(!inter.State) {
                    inter.setState(state);
                }
                
                interactable = inter;
            }
        }); 

        return interactable;
    }

}