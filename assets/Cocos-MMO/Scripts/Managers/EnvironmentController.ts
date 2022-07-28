import { _decorator, Component, Node, Vec2, Vec3, resources, Prefab, instantiate } from 'cc';
import { NetworkedEntityState } from '../../../../Server/lib/rooms/schema/RoomState';
import type { InteractableState } from '../../../../Server/src/rooms/schema/RoomState';
const { ccclass, property } = _decorator;

import { Area } from '../Environment/Area';
import { AreaExit } from '../Environment/AreaExit';
import { Interactable } from '../Environment/Interactable';
import { Delay } from '../Helpers/Delay';
import { NetworkedEntity } from '../Player/NetworkedEntity';
import { NetworkedEntityFactory } from './NetworkedEntityFactory';
import { UIManager } from './UIManager';

@ccclass('EnvironmentController')
export class EnvironmentController extends Component {
    
    private static _instance: EnvironmentController;

    public static get Instance() {
        return this._instance;
    }

    private constructor() {
        super();

        if (EnvironmentController._instance != null) {

            console.error(`Environment Controller - Instance already exists!`);
            return;
        }

        EnvironmentController._instance = this;
    }

    public get LoadingArea(): boolean {
        return this._loadingArea;
    }

    private set LoadingArea(value: boolean) {
        this._loadingArea = value;
    }

    public get PlayerObject(): Node {
        return this._playerObject;
    }

    private set PlayerObject(value: Node) {
        this._playerObject = value;
    }
    
    public get CurrentArea(): Area {
        return this._currentArea;
    }

    private set CurrentArea(value: Area) {
        this._currentArea = value;
    }

    public get PreviousGrid(): Vec2 {
        return this._previousGrid;
    }

    private set PreviousGrid(value: Vec2) {
        this._previousGrid = value;
    }

    public get CurrentGrid(): Vec2 {
        return this._currentGrid;
    }

    private set CurrentGrid(value: Vec2) {
        this._currentGrid = value;
    }

    private _loadingArea: boolean = false;
    private _playerObject: Node = null;
    private _currentArea: Area = null;
    private _previousGrid: Vec2 = null;
    private _currentGrid: Vec2 = null;

    onDestroy() {
        if(EnvironmentController._instance === this) {
            EnvironmentController._instance = null;
        }
    }

    /**
     * Begins process of loading the grid area for the newGridPos.
     * If a current grid exists it will be unloaded.
     * @param prevPos The previous grid coordinates to transition from.
     * @param pos The grid coordinates to transition to.
     * @param immediatelyAllowExit Should exiting be immediately allowed once the grid area is loaded?
     */
    public async transitionArea(prevPos: Vec2, pos: Vec2, immediatelyAllowExit: boolean) {

        this.LoadingArea = true;

        this.CurrentGrid = pos;
        this.PreviousGrid = prevPos;

        let gridPrefab: Prefab = null;
        let error: boolean = false;

        let gridPath: string = `GridPositions/${pos.x}x${pos.y}`;

        resources.load(gridPath, Prefab, (err, prefab) => { 
            error = err ? true : false;
            gridPrefab = prefab;
        });

        while(!gridPrefab && !error) {
            await Delay.delay(100);
        }

        if(gridPrefab) {
            let currentPlayerExit: AreaExit = null;
            let playerPos: Vec3 = null;
            let areaPos: Vec3 = new Vec3();

            if(this.CurrentArea) {
                currentPlayerExit = this.CurrentArea.currentPlayerExit;
                if(currentPlayerExit) {

                    // Get the player's local position within the exit transition room
                    let playersLocalPosInExit: Vec3 = currentPlayerExit.getExitPlayerLocalPosition();

                    playersLocalPosInExit.x *= -1;
                    playersLocalPosInExit.z *= -1;
                    playerPos = playersLocalPosInExit;
                }
                else {
                    console.error("No Exit!");
                }

                let areaDiff: Vec2 = new Vec2();

                // Calculate the area difference
                Vec2.subtract(areaDiff, pos, prevPos);

                // Calculate the area position
                Vec3.add(areaPos, this.CurrentArea.node.position, new Vec3(this.CurrentArea.areaDimensions.x * areaDiff.x, 0, this.CurrentArea.areaDimensions.y * areaDiff.y));

                // Move the player object out from the current grid
                this.PlayerObject.parent = this.node;
                
                // Remove the current area object
                this.CurrentArea.node.destroy();
                this.CurrentArea = null;
            }

            // Instantiate the new area from the loaded prefab
            let area: Node = instantiate(gridPrefab);
            
            area.parent = (this.node);

            this.CurrentArea = area.getComponent(Area);
            this.CurrentArea.toggleExit(immediatelyAllowExit);
            area.setPosition(areaPos);

            if(playerPos) {

                this.placePlayer(this.PreviousGrid, this.CurrentGrid, playerPos, true);
            }
        }
        else {
            console.error(`No grid prefab found at GridPositions/${pos.x}x${pos.y}`);
        }

        UIManager.Instance.updateGrid(`${pos.x}x${pos.y}`);

        //await Delay.delay(100);

        this.LoadingArea = false;
    }

    public setPlayerObject(playerObject: Node, playerState: NetworkedEntityState) {
        this.PlayerObject = playerObject;

        this.placePlayer(this.PreviousGrid, this.CurrentGrid, new Vec3(playerState.xPos, playerState.yPos, playerState.zPos), false);
    }

    private async placePlayer(prevPos: Vec2, newGridPos: Vec2, playerPosition: Vec3, forGridTransition: boolean) {
        
        let entranceDif: Vec2 = new Vec2();

        Vec2.subtract(entranceDif, prevPos, newGridPos);

        let exit = this.CurrentArea.getExitByChange(entranceDif);

        if(forGridTransition && exit) {
            
            // Assumes that "playerPosition" is local relative to the transition room
            let worldPos: Vec3 = exit.playerExitLocalPositionToWorldPosition(playerPosition);
            
            this.PlayerObject.setWorldPosition(worldPos);
            
            // Snap the camera to the other side of the transition room
            NetworkedEntityFactory.Instance.cameraController.enteredExit(exit.transitionRoom.exitCameraTarget, true);
            
            setTimeout(() => {exit.transitionRoom.openDoor(true, null);}, 1000);
        }
        else {
            this.PlayerObject.position = playerPosition;
        }

        let playerWorldPos = this.PlayerObject.worldPosition;
        this.PlayerObject.parent = this.CurrentArea.node;
        this.PlayerObject.setWorldPosition(playerWorldPos);
    }

    public objectUsed(state: InteractableState, usingEntity: NetworkedEntity) {
        if(this.CurrentArea) {
            let interactable: Interactable = this.CurrentArea.getInteractableByState(state);
            if(interactable) {
                interactable.onSuccessfulUse(usingEntity);
            }
        }
    }
}