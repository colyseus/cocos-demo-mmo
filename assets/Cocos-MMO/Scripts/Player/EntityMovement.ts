
import { _decorator, Component, Node, Vec3, systemEvent, SystemEventType, EventKeyboard, macro, Quat, RigidBody } from 'cc';
import { Interactable } from '../Environment/Interactable';
import { MathHelpers } from '../Helpers/MathHelpers';
import { Input } from '../Managers/Input';
import { UIManager } from '../Managers/UIManager';
import { NetworkedEntity } from './NetworkedEntity';
const { ccclass, property } = _decorator;

@ccclass('EntityMovement')
export class EntityMovement extends Component {
    
    public get SprintSpeed() {
        return this.moveSpeed * 2;
    }

    @property({type: RigidBody})
    private rigidBody: RigidBody = null;

    @property
    public moveSpeed: number = 1;

    @property 
    private rotateSpeed: number = 1;

    @property
    private movementRotationSpeed: number = 1;

    public cameraNode: Node = null;

    public owner: NetworkedEntity = null;

    private _isSprinting: boolean = false;
    private _isForcingRotation: boolean = false;
    private _moveVec: Vec3 = new Vec3();
    private _rotationAngle: number = 0;
    private _tempQuat: Quat = new Quat();
    private _currentInteractable: Interactable = null;

    update(deltaTime: number) {
        // Don't accept input while user is typing in the chat box
        if(UIManager.Instance.movementPrevented()) {
            return;
        }

        this.handleInput(deltaTime);
    }

    // public setCurrentInteractable(interactable: Interactable)
    // {
    //     this._currentInteractable = interactable;
    // }

    private handleInput(deltaTime: number) {
        this._isSprinting = Input.getKey(macro.KEY.shift);

        if(Input.getKey(macro.KEY.q) || Input.getKey(macro.KEY.e)) {
            this._isForcingRotation = true;
            this._rotationAngle = (Input.getKey(macro.KEY.q) ? 1 : -1) * this.movementRotationSpeed;
            this.node.rotate(Quat.fromEuler(this._tempQuat, 0, this._rotationAngle * this.rotateSpeed, 0));
        }
        else {
            this._isForcingRotation = false;
        }

        
        if (Input.getKey(macro.KEY.a) || Input.getKey(macro.KEY.d) || Input.getKey(macro.KEY.w) || Input.getKey(macro.KEY.s))
        {
            let lateralVec: Vec3 = this.cameraNode != null ? MathHelpers.nodeRight(this.cameraNode) : MathHelpers.nodeRight(this.node);
            lateralVec.y = 0;
            
            let forwardVec: Vec3 = this.cameraNode != null ? this.cameraNode.forward.negative() : this.node.forward.negative();
            forwardVec.y = 0;

            if (!this._isForcingRotation)
            {
                //Attempt to rotate to face forward
                let desRot: Quat = Quat.fromViewUp(this._tempQuat, forwardVec, Vec3.UP);
                
                this.node.setRotation(Quat.lerp(this._tempQuat, this.node.rotation, desRot, this.movementRotationSpeed * deltaTime));
            }

            let verticalMov: number = Input.getKey(macro.KEY.w) ? 1 : Input.getKey(macro.KEY.s) ? -1 : 0 ;
            let horizontalMov: number = Input.getKey(macro.KEY.a) ? -1 : Input.getKey(macro.KEY.d) ? 1 : 0;

            this._moveVec = forwardVec.multiplyScalar(verticalMov * deltaTime).add(lateralVec.multiplyScalar(horizontalMov * deltaTime)).multiplyScalar(this._isSprinting ? this.SprintSpeed : this.moveSpeed);
                        
            this.rigidBody.setLinearVelocity(this._moveVec);
        }
        else {
            this.rigidBody.setLinearVelocity(Vec3.ZERO);
        }
        
        if (this._currentInteractable && this._currentInteractable.isValid)
        {
            if (Input.getKeyDown(Input.getInputKeyValue(this._currentInteractable.interactionKey)))
            {
                this._currentInteractable.playerAttemptedUse(this.owner);
            }
        }
    }

    public setCurrentInteractable(interactable: Interactable) {
        this._currentInteractable = interactable;
    }
}