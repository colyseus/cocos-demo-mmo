
export class NetworkedEntityChanges {
    // Name of property we're comparing
    public get Name(): string { 
        return this._name;
    }

    private set Name(value: string) {
        this._name = value;
    }

    // The old value of the property
    public get OldValue(): any {
        return this._oldValue;
    }

    private set OldValue(value: any) {
        this._oldValue = value;
    }

    // The new value of the property
    public get NewValue() { 
        return this._newValue;
    }

    private set NewValue(value: any) {
        this._newValue = value;
    }

    private _name: string;
    private _oldValue: any;
    private _newValue: any;

    constructor (name: string, oldValue: any, newValue: any)
    {
        this.Name = name;
        this.OldValue = oldValue;
        this.NewValue = newValue;
    }

    public static compare(oldObject: any, newObject: any): NetworkedEntityChanges[]
    {
        // Get the properties of the NetworkedEntityState using the oldObject. Every property of the schema is given a value by default and should be collected by this operation.
        let properties: string[] = Object.getOwnPropertyNames(oldObject);
        let result: NetworkedEntityChanges[] = [];

        properties.forEach((property, index) => {

            if(property !== "avatar") {

                let oldValue: any = oldObject[property];
                let newValue: any = newObject[property];
    
                if ((oldValue === newValue) === false)
                {
                    let changes: NetworkedEntityChanges = new NetworkedEntityChanges(property, oldValue, newValue);
                    //console.log(`Pushing change for \"${property}\" where old = ${oldValue} and New = ${newValue}`);
                    result.push(changes);
                }
            }

        });

        return result;
    }
}