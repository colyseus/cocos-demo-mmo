
export class Delay {
    /** Delay for a number of milliseconds */
    public static delay(delay: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, delay);
        });
    }
}