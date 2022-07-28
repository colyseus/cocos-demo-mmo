
import { _decorator, Component, Node, Vec2, Vec3, Quat, systemEvent, SystemEventType, EventMouse, Camera } from 'cc';
import { EnvironmentController } from '../Managers/EnvironmentController';
const { ccclass, property } = _decorator;

import { MathHelpers } from '../Helpers/MathHelpers';
import { UIManager } from '../Managers/UIManager';

@ccclass('CameraController')
export class CameraController extends Component {
    
    public get Camera() {
        return this.camera;
    }

    @property({type:Camera})
    private camera: Camera = null;

    @property({type: Node})
    private target: Node = null;

    @property({type: Node})
    private cameraNode: Node = null;

    @property
    private followSpeed: number = 1.0;

    @property
    private zoomSpeed: number = 1.0;

    @property
    private minZoom: Vec2 = new Vec2();

    @property
    private maxZoom: Vec2 = new Vec2();

    @property
    private zoomMultiplier: number = 1.0;

    @property
    private rotateSpeed: number = 1.0;

    private _currentZoom: number = 0;
    private _desiredZoom: Vec3;
    private _cameraRot: number = 0;
    private _targetRotation: Quat;
    private _inExit: boolean = false;

    private tempVec: Vec3 = new Vec3();
    private tempQuat: Quat = new Quat();

    onLoad() {
        this._desiredZoom = new Vec3(0, this.minZoom.x, this.minZoom.y);
        let temp: Quat = new Quat();
        this._targetRotation = Quat.fromEuler(temp, 0, this._cameraRot, 0);
    }

    start() {
        // Subscribe to mouse down/up events
        systemEvent.on(SystemEventType.MOUSE_DOWN, this.handleCameraInput, this);
        systemEvent.on(SystemEventType.MOUSE_UP, this.handleCameraInput, this);

        // Subscribe to mouse scroll event
        systemEvent.on(SystemEventType.MOUSE_WHEEL, this.handleCameraInput, this);
    }

    public setFollow(target: Node) {
        
        this.target = target;
    }

    public enteredExit(node: Node, snap: boolean)
    {
        this._inExit = true;

        this.setFollow(node);

        this._desiredZoom = new Vec3(0, 0, 0);

        this._targetRotation = node.worldRotation;

        if (snap)
        {
            this.node.setWorldPosition(node.worldPosition);
            this.node.setWorldRotation(node.worldRotation);
            this.cameraNode.setPosition(this._desiredZoom);
        }
    }

    public leftExit()
    {
        this._desiredZoom = new Vec3(0, this.minZoom.x, this.minZoom.y);

        this._targetRotation = new Quat(EnvironmentController.Instance.PlayerObject.worldRotation);
        this.setFollow(EnvironmentController.Instance.PlayerObject);

        this._inExit = false;
    }

    lateUpdate(deltaTime: number)
    {
        // Camera rotation
        if (this.target && this.target.isValid)
            {
                //console.log(this.target);
                Vec3.lerp(this.tempVec, this.node.worldPosition, this.target.worldPosition, deltaTime * this.followSpeed);
                Quat.lerp(this.tempQuat, this.node.worldRotation, this._targetRotation, deltaTime * this.rotateSpeed * 10);
    
                this.node.setWorldPosition(this.tempVec);
                this.node.setWorldRotation(this.tempQuat);
            }
    
            // Camera zoom
            if (this.cameraNode && this.cameraNode.isValid)
            {
                Vec3.lerp(this.tempVec, this.cameraNode.position, this._desiredZoom, deltaTime * this.zoomSpeed);
    
                this.cameraNode.setPosition(this.tempVec);
            }
        
    }

    private handleCameraInput(event: EventMouse) {
        if(UIManager.Instance.movementPrevented() || this._inExit) {
            return;
        }

        let tempVec: Vec3 = new Vec3();
        let tempQuat: Quat = new Quat();

        switch(event.eventType) {
            case SystemEventType.MOUSE_DOWN:
                if(event.getButton() === EventMouse.BUTTON_RIGHT) {
                    
                    systemEvent.on(SystemEventType.MOUSE_MOVE, this.handleCameraInput, this);
                }
                break;
            case SystemEventType.MOUSE_UP:
                if(event.getButton() === EventMouse.BUTTON_RIGHT) {
                    
                    systemEvent.off(SystemEventType.MOUSE_MOVE, this.handleCameraInput, this);
                }
                break;
            case SystemEventType.MOUSE_MOVE:
                this._cameraRot += this.rotateSpeed * -event.movementX
                this._targetRotation = Quat.fromEuler(tempQuat, 0, this._cameraRot, 0);                
                break;
            case SystemEventType.MOUSE_WHEEL:
                this._currentZoom -= event.getScrollY() * this.zoomMultiplier;
                this._currentZoom = MathHelpers.clamp(this._currentZoom, 0, 1);
                this._desiredZoom = Vec3.lerp(tempVec, new Vec3(0, this.minZoom.x, this.minZoom.y), new Vec3(0, this.maxZoom.x, this.maxZoom.y), this._currentZoom);
                break;
        }
    }
}