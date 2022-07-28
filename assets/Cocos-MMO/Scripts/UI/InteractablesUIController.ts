
import { _decorator, Component, Node, Prefab, instantiate, Camera } from 'cc';
import { Interactable } from '../Environment/Interactable';
import { InteractableInstruction } from './InteractableInstruction';
const { ccclass, property } = _decorator;

@ccclass('InteractablesUIController')
export class InteractablesUIController extends Component {
    
    private static _instance: InteractablesUIController;

    public static get Instance() {
        return this._instance;
    }

    private constructor() {
        super();

        if (InteractablesUIController._instance != null) {

            return;
        }

        InteractablesUIController._instance = this;
    }

    @property({type:Prefab})
    private instructionPrefab: Prefab = null;
    @property({type:Node})
    private instructionRoot: Node = null;
    @property({type:Camera})
    private camera: Camera = null;

    private _interactableUI: Map<Interactable, Node> = null;

    onLoad() {
        this._interactableUI = new Map<Interactable, Node>();
    }

    onDestroy() {
        if(InteractablesUIController._instance === this) {
            InteractablesUIController._instance = null;
        }
    }

    lateUpdate() {
        this.updateInstructionTags();
    }

    public toggleInstruction(interactable: Interactable, show: boolean) {
        if(this._interactableUI.has(interactable)) {
            const node: Node = this._interactableUI.get(interactable);

            if(show) {
                this.updateInstructionTagPosition(interactable, node);
            }

            node.active = show;
        }
    }

    public registerInteractable(interactable: Interactable) {
        if(this._interactableUI.has(interactable) === false) {

            let display: InteractableInstruction = instantiate(this.instructionPrefab).getComponent(InteractableInstruction);

            display.setInstruction(interactable.Instruction);

            display.node.setParent(this.instructionRoot);

            display.node.active = false;

            this._interactableUI.set(interactable, display.node);
        }
    }

    public unRegisterInteractable(interactable: Interactable) {
        if(this._interactableUI.has(interactable)) {

            const node: Node = this._interactableUI.get(interactable);

            node.destroy();

            this._interactableUI.delete(interactable);
        }
    }

    private updateInstructionTags() {
        this._interactableUI.forEach((instructionNode, interactable) => {

            if(!instructionNode.active) {
                return;
            }

            this.updateInstructionTagPosition(interactable, instructionNode);
        });
    }

    private updateInstructionTagPosition(interactable: Interactable, instructionNode: Node) {
        
        // Convert the screen point to a local position within the tag root node
        const tagPos = this.camera.convertToUINode(interactable.node.worldPosition, this.instructionRoot);

        instructionNode.setPosition(tagPos);
    }
}