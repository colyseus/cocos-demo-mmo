import { Node, Vec3 } from "cc";

export class MathHelpers {
    public static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    public static round(value: number, decimalPlaces: number): number {
        const factor = Math.pow(10, decimalPlaces);
        return Math.round(value * factor) / factor;
    }

    public static nodeRight(node: Node): Vec3 {
        let temp: Vec3 = node.forward.negative();
        return temp.cross(Vec3.UP).normalize();
    }
}