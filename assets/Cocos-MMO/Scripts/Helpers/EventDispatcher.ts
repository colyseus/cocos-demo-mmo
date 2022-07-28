

export class EventDispatcher<T = void> extends EventTarget {

    private _eventName: string;

    constructor(eventName: string) {
        super();

        this._eventName = eventName;
    }

    public invoke(eventData: T) {

        //console.log(`Event Dispatcher - Invoke Event - \"${this._eventName}\" with data: `, eventData);

        this.dispatchEvent(new CustomEvent(this._eventName, {detail: eventData}));
    }
}