type TimerId = number | NodeJS.Timeout;

/**
 * Sometimes the QuickJS script finishes, but there are still tasks for
 * it to execute. E.g. `setTimeout()`'s callback:
 *
 * 1. QuickJS VM executes `setTimeout()` instruction.
 * 2. Browser VM schedules `setTimeout()` on it's own event loop.
 * 3. QuickJS VM finishes it script. It does not know about
 *    Browser VM event loop, so thinks it's done.
 * 4. QuickJS VM closes down. It complains about not disposed stuff
 *    related to `setTimeout()`.
 * 5. Browser VM executes `setTimeout()` callback and calls
 *    `quickJS_Context.callFunction()` after QuickJS VM tried to close.
 *
 * Solution: hold QuickJS VM pending Browser VM's event loop.
 *
 * TODO use `executePendingJobs()` with promises instead.
 */
export class EventLoop {
  private timeoutIds: TimerId[] = [];
  private intervalIds: TimerId[] = [];
  /** Resolved when all tasks are done */
  private readonly waitDonePromise: Promise<undefined>;
  /** Calling this function mean the event loop drained all tasks */
  private resolveDone: () => void = undefined!;

  constructor() {
    this.waitDonePromise = new Promise((res, _rej) => {
      this.resolveDone = () => res(undefined);
    });
  }

  markTimerDone = (type: 'timeout' | 'interval', id: TimerId) => {
    if (type === 'timeout') {
      this.timeoutIds = this.timeoutIds.filter((e) => e !== id);
    } else {
      this.intervalIds = this.intervalIds.filter((e) => e !== id);
    }

    this.resolveIfIsDone();
  };

  drain = () => this.waitDonePromise;

  private resolveIfIsDone() {
    if (this.isDone()) {
      this.resolveDone();
    }
  }

  private isDone() {
    return this.timeoutIds.length === 0 && this.intervalIds.length === 0;
  }

  addTimeout = (fn: () => void, timer: number): number => {
    const timeoutId = setTimeout(() => {
      // console.log('setTimeout::inside', arguments);
      this.markTimerDone('timeout', timeoutId);

      fn();
    }, timer);

    this.timeoutIds.push(timeoutId);

    return timeoutId as any;
  };
}
