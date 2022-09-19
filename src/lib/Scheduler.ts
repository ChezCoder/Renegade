export class WaitFor {
    readonly test: () => boolean;
    public process: Function;
    
    constructor(test: () => boolean, process?: Function) {
        this.test = test;
        this.process = process || (function () {});
        this.tick();
    }

    private tick() {
        if (this.test())
            return this.process();
        setTimeout(this.tick.bind(this));
    }
}

export class WaitForPromise<T> extends WaitFor {
    private done: boolean = false;

    constructor(promise: Promise<T>) {
        super(() => this.done);

        const self = this;

        promise.then(function() {
            self.done = true;
        }).catch(function() {
            self.done = true;
        });
    }
}

export class WaitForMillis extends WaitFor {
    readonly millis: number;

    constructor(millis: number = 1, process?: Function) {
        const now = Date.now() + millis;
        super(() => (Date.now() >= now), process);
        this.millis = millis;
    }
}

export class WaitForSeconds extends WaitForMillis {
    constructor(seconds: number = 1, process?: Function | (() => void)) {
        super(seconds * 1000, process);
    }
}

export namespace Routine {
    function continueGeneratorTask(task: Generator<WaitFor | void, any, any>) {
        const result = task.next();
        const continueTask = () => continueGeneratorTask(task);
        
        if (result.done) return;
        
        if (result.value instanceof WaitFor)
            result.value.process = continueTask;
        else
            new WaitForMillis(1, continueTask);
    }

    export async function startTask(process: () => Generator<WaitFor | void, any, any>) {
        const task = process();
        continueGeneratorTask(task);
    }
}