
import { _decorator, Component, Node, ParticleSystem, Vec3, Quat, director } from 'cc';
import { Delay } from '../../Helpers/Delay';
import { NetworkedEntity } from '../../Player/NetworkedEntity';
import { Interactable } from '../Interactable';
const { ccclass, property } = _decorator;

@ccclass('Teleporter')
export class Teleporter extends Interactable {
    
    @property({type:Node})
    private landingTeleporter: Node = null;
    @property({type:Node}) 
    private teleportRoot: Node = null;
    @property({type:Node})
    private teleportExit: Node = null;
    @property({type:ParticleSystem})
    private teleportEffect: ParticleSystem = null;

    private _landingTeleporter: Teleporter = null;
    private _usingEntity: NetworkedEntity = null;
    private _vecHelper: Vec3 = new Vec3();
    private _quatHelper: Quat = new Quat();

    onLoad() {
        super.onLoad();

        this._landingTeleporter = this.landingTeleporter.getComponent(Teleporter);
    }

    public playerInRange(entity: NetworkedEntity) {
        //Only display in range stuff if the local user is the one in range!
        if (entity.IsMine)
            super.playerInRange(entity);
    }

    public playerLeftRange(entity: NetworkedEntity) {
        //Only display in range stuff if the local user is the one in range!
        if (entity.IsMine)
            super.playerLeftRange(entity);
    }

    public onSuccessfulUse(entity: NetworkedEntity) {
        super.onSuccessfulUse(entity);

        this._usingEntity = entity;
        this._usingEntity.setIgnoreMovementSync(true);
        
        //Disable the player's controls
        this._usingEntity.setMovementEnabled(false);
        
        this.transferPlayer(true, () =>
        {
            this.moveUserToLandingPad();
        })
    }

    private async transferPlayer(intoTeleporter: boolean, onComplete: ()=>void) {
        if (!intoTeleporter)
        {
            this.teleportEffect.play();
            
            await Delay.delay((this.teleportEffect.duration / 2) * 1000);
        }

        let t: number = 0.0;
        let dur: number = 0.5;

        let exitPos: Vec3 = intoTeleporter ? new Vec3(this._usingEntity.node.worldPosition) : this.teleportExit.worldPosition;
        let exitRot: Quat = intoTeleporter ? new Quat(this._usingEntity.node.worldRotation) : this.teleportExit.worldRotation;

        while (t < dur)
        {
            this._usingEntity.node.setWorldPosition(Vec3.lerp(this._vecHelper, intoTeleporter ? exitPos : this.teleportRoot.worldPosition,
                intoTeleporter ? this.teleportRoot.worldPosition : exitPos, t / dur));

            this._usingEntity.node.setWorldRotation(Quat.lerp(this._quatHelper, intoTeleporter ? exitRot : this.teleportRoot.worldRotation,
                intoTeleporter ? this.teleportRoot.worldRotation : exitRot, t / dur));
            
            await Delay.delay(10);

            t += director.getDeltaTime();
        }

        if (intoTeleporter)
        {
            this.teleportEffect.play();
            Delay.delay((this.teleportEffect.duration / 2.0) * 1000);
            this._usingEntity.node.setWorldPosition(this._landingTeleporter.teleportRoot.worldPosition);
        }
        else
        {
            //Additional short delay            
            Delay.delay(500)
        }

        onComplete();

        if (intoTeleporter)
        {       
            Delay.delay(2000)
        }

        this.teleportEffect.stop();
    }

    /** Call "ExitTeleporter" on the "landingTeleporter" */
    private moveUserToLandingPad() {
        this._landingTeleporter.exitTeleporter(this._usingEntity);
    }

    /** Have an entity exit this teleporter, called by the teleporter the user entered */
    public exitTeleporter(entity: NetworkedEntity) {
        this._usingEntity = entity;

        this.transferPlayer(false, () =>
        {
            this._usingEntity.setIgnoreMovementSync(false);
            this._usingEntity.setMovementEnabled(true);
        })
    }
}