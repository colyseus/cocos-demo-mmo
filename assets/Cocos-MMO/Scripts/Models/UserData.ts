import { Vec2 } from "cc";

export class UserData {
    public id: string;
    public progress: string = "0,0";
    public prevGrid: string = "0,0";

    constructor(obj: Partial<UserData>) {
        Object.assign(this, obj);
    }

    public gridAsVector2(getCurrentGrid: boolean = true): Vec2 {

        let coords: string[] = getCurrentGrid ? this.progress.split(',') : this.prevGrid.split(',');

        if (coords && coords.length > 1) {

            let xVal: number = Number(coords[0]);
            let yVal: number = Number(coords[1]);

            if (isNaN(xVal)) {
                console.error(`Error parsing x value for grid from ${coords[0]}`);

                xVal = 0;
            }

            if (isNaN(yVal)) {
                console.error(`Error parsing y value for grid from ${coords[1]}`);

                yVal = 0;
            }

            return new Vec2(xVal, yVal);
        }

        return Vec2.ZERO;
    }
}