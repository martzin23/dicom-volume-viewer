export default class FPSCounter {
    constructor(element, prefix = "", suffix = "", decimals = 0) {
        this.element = element;
        this.prefix = prefix;
        this.suffix = suffix;
        this.decimals = decimals;

        this.time_previous = performance.now();
        this.delta = 0.0;
        this.frames = 0;
    }

    update() {
        const time_now = performance.now();
        this.delta += time_now - this.time_previous;
        this.frames += 1;
        this.time_previous = time_now;
    }

    set() {
        const fps = (1000 / (this.delta / this.frames)).toFixed(this.decimals);
        this.delta = 0;
        this.frames = 0;
        if (!!this.element)
            this.element.innerText = this.prefix + fps + this.suffix;
    }

    get() {
        const fps = (1000 / (this.delta / this.frames)).toFixed(this.decimals);
        this.delta = 0;
        this.frames = 0;
        return fps;
    }
}