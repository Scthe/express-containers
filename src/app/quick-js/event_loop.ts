type TimerId = number | NodeJS.Timeout;
type DrainCallback = () => void;

let NEXT_PERPETUAL_ID = 1;

/**
 * Sometimes the QuickJS script finishes, but there are still tasks for
 * it to execute. E.g. `setTimeout()`'s callback:
 *
 * 1. QuickJS VM executes `setTimeout()` instruction.
 * 2. Host schedules `setTimeout()` on it's own event loop.
 * 3. QuickJS VM finishes it script. It does not know about
 *    Host event loop, so thinks it's done.
 * 4. QuickJS VM closes down. It complains about not disposed stuff
 *    related to `setTimeout()`.
 * 5. Host executes `setTimeout()` callback and calls
 *    `quickJS_Context.callFunction()` after QuickJS VM tried to close.
 *
 * Solution: hold QuickJS VM pending Host's event loop.
 *
 * TODO [IGNORE] use `executePendingJobs()` with promises instead.
 */
export class EventLoop {
  private timeoutIds: TimerId[] = [];
  private intervalIds: TimerId[] = [];
  /** This is not really needed for our use case. Went a bit too far tried porting the original abstraction. */
  private perpetualsIds: number[] = [];

  private drainCallbacks: DrainCallback[] = [];
  /** Resolved when all tasks are done */
  // private readonly waitDonePromise: Promise<undefined>;
  /** Calling this function mean the event loop drained all tasks */
  // private resolveDone: () => void = undefined!;

  constructor() {
    // this.waitDonePromise = new Promise((res, _rej) => {
    // this.resolveDone = () => res(undefined);
    // });
  }

  markTimerDone = (type: 'timeout' | 'interval', id: TimerId) => {
    if (type === 'timeout') {
      this.timeoutIds = this.timeoutIds.filter((e) => e !== id);
    } else {
      this.intervalIds = this.intervalIds.filter((e) => e !== id);
    }

    this.resolveIfIsDone();
  };

  sigKill = () => {
    // eslint-disable-next-line no-console
    console.log(`--- EVENT LOOP: SIGKILL --- `);
    this.timeoutIds.forEach((tId) => this.markTimerDone('timeout', tId));
    this.intervalIds.forEach((tId) => this.markTimerDone('interval', tId));
    this.perpetualsIds = [];

    if (!this.isDone()) {
      throw new Error('EventLoop.sigkill() should have finished all outstanding tasks'); // prettier-ignore
    }
    this.resolveIfIsDone();
  };

  drain = () => {
    return new Promise((res, _rej) => {
      // resolve the promise once done
      this.addDrainCallback(() => res(undefined));
    });
  };

  addDrainCallback = (cb: DrainCallback) => {
    if (this.isDone()) {
      cb();
    } else {
      this.drainCallbacks.push(cb);
    }
  };

  private resolveIfIsDone() {
    if (this.isDone()) {
      const cbs = this.drainCallbacks;
      this.drainCallbacks = [];
      cbs.forEach((cb) => cb());
    }
  }

  private isDone() {
    return (
      this.timeoutIds.length === 0 &&
      this.intervalIds.length === 0 &&
      this.perpetualsIds.length === 0
    );
  }

  addTimeout = (fn: () => void, timer: number): number => {
    const timeoutId = setTimeout(() => {
      // console.log('setTimeout::inside', arguments);
      this.markTimerDone('timeout', timeoutId);

      fn();
    }, timer);

    this.timeoutIds.push(timeoutId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return timeoutId as any;
  };

  addPerpetual = (): number => {
    const id = NEXT_PERPETUAL_ID++;
    this.perpetualsIds.push(id);
    return id;
  };
}
