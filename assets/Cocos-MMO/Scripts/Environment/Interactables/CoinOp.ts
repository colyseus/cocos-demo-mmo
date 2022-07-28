
import { _decorator, Component, Node, Animation, Vec3, Quat, director } from 'cc';
import { Delay } from '../../Helpers/Delay';
import { NetworkedEntity } from '../../Player/NetworkedEntity';
import { Interactable } from '../Interactable';
const { ccclass, property } = _decorator;

@ccclass('CoinOp')
export class CoinOp extends Interactable {
    
    @property({type:Node})
    private playerRoot: Node = null;
    @property({type:Animation})
    private rockingAnimator: Animation = null;

    private _ridingEntity: NetworkedEntity = null;
    private _originalParentNode: Node = null;
    private _originalEntityPos: Vec3 = null;
    private _originalEntityRot: Quat = null;
    private _vecHelper: Vec3 = new Vec3();
    private _quatHelper: Quat = new Quat();

    public playerInRange(entity: NetworkedEntity) {
        
        // Only display in range stuff if the local user is the one in range!
        if(entity.IsMine){
            super.playerInRange(entity);
        }
    }

    public playerLeftRange(entity: NetworkedEntity) {
        // Only display in range stuff if the local user is the one in range!
        if (entity.IsMine)
            super.playerLeftRange(entity);
    }

    public onSuccessfulUse(entity: NetworkedEntity) {
        super.onSuccessfulUse(entity);

        //Snap player into root, begin "riding"
        this._ridingEntity = entity;
        this._ridingEntity.setIgnoreMovementSync(true);
        this._originalParentNode = this._ridingEntity.node.parent;
        this._originalEntityPos = new Vec3(this._ridingEntity.node.worldPosition);
        this._originalEntityRot = new Quat(this._ridingEntity.node.worldRotation);

        //Disable the player's controls
        this._ridingEntity.setMovementEnabled(false);

        this.transferPlayer(true, () =>
        {
            this.rockingAnimator.play();
        })
    }

    /** Transition the player either on to or off of the seat */
    private async transferPlayer(ontoSeat: boolean, onComplete: ()=>void) {
        let t: number = 0.0;
        let dur: number = 0.5;

        while (t < dur)
        {
            this._ridingEntity.node.setWorldPosition(Vec3.lerp(this._vecHelper, ontoSeat ? this._originalEntityPos : this.playerRoot.worldPosition,
                ontoSeat ? this.playerRoot.worldPosition : this._originalEntityPos, t / dur));

            this._ridingEntity.node.setWorldRotation(Quat.lerp(this._quatHelper, ontoSeat ? this._originalEntityRot : this.playerRoot.worldRotation,
                ontoSeat ? this.playerRoot.worldRotation : this._originalEntityRot, t / dur));

            await Delay.delay(10);

            t += director.getDeltaTime();
        }

        this._ridingEntity.node.setParent(ontoSeat ? this.playerRoot : this._originalParentNode);
        this._ridingEntity.node.setWorldPosition(ontoSeat ? this.playerRoot.worldPosition : this._originalEntityPos);
        this._ridingEntity.node.setWorldRotation(ontoSeat ? this.playerRoot.worldRotation : this._originalEntityRot);

        //Additional short delay
        await Delay.delay(500);

        onComplete();
    }

    protected onInteractableReset() {
        super.onInteractableReset();

        //Stop animating and move the player off of the seat
        this.rockingAnimator.stop();

        this.transferPlayer(false, () =>
        {
            //Restore the user's controls
            this._ridingEntity.setIgnoreMovementSync(false);
            this._ridingEntity.setMovementEnabled(true);
        })
    }
}