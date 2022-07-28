import { _decorator, Vec2 } from 'cc';
import { SeatReservationData } from './SeatReservationData';

export class MovedToGridMessage {
    public newGridPosition: Vec2;
    public prevGridPosition: Vec2;
    public seatReservation: SeatReservationData;
}

export class ObjectUseMessage {
    public interactedObjectID: string;
    public interactingStateID: string; 
}