export default class Timer {
    protected startTime: number;
    protected endTime: number;

    constructor(start = true) {
        if(start) {
            this.start();
        }
    }

    start() {
        if(this.startTime) return;
        this.startTime = Date.now();
    }

    end() {
        if(this.endTime) return;
        this.endTime = Date.now();

        return this.toString();
    }

    toString() {
        if(!this.endTime || !this.startTime) return '[Timer]';
        return (this.endTime - this.startTime) + 'ms';
    }
}