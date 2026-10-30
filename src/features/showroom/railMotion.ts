/** Advance from the current rendered value; changing targets never resets the pose. */
export function dampRail(
  current: number,
  target: number,
  delta: number,
  reduced = false,
) {
  if (reduced || Math.abs(target - current) < 0.0005) return target;
  return (
    current + (target - current) * (1 - Math.exp(-Math.min(delta, 0.05) * 9))
  );
}

interface TimerScheduler {
  set: (callback: () => void, delay: number) => number;
  clear: (timer: number) => void;
}

/** Ignore brief gaps between the body, collar and hanger of the same garment. */
export function createRailHover(
  onChange: (index: number | null) => void,
  scheduler: TimerScheduler = {
    set: (callback, delay) => window.setTimeout(callback, delay),
    clear: (timer) => window.clearTimeout(timer),
  },
) {
  let active: number | null = null;
  let pending: number | null = null;
  let enterTimer: number | undefined;
  let leaveTimer: number | undefined;
  function cancelEnter() {
    if (enterTimer !== undefined) scheduler.clear(enterTimer);
    enterTimer = undefined;
    pending = null;
  }
  function cancelLeave() {
    if (leaveTimer !== undefined) scheduler.clear(leaveTimer);
    leaveTimer = undefined;
  }
  function change(index: number | null) {
    if (active === index) return;
    active = index;
    onChange(index);
  }
  return {
    enter(index: number) {
      cancelLeave();
      if (active === index) {
        cancelEnter();
        return;
      }
      if (pending === index) return;
      cancelEnter();
      pending = index;
      enterTimer = scheduler.set(() => {
        enterTimer = undefined;
        pending = null;
        cancelLeave();
        change(index);
      }, 65);
    },
    leave(index: number) {
      const leavingPending = pending === index;
      if (leavingPending) cancelEnter();
      if (active !== index && !leavingPending) return;
      cancelLeave();
      const leavingActive = active;
      leaveTimer = scheduler.set(() => {
        leaveTimer = undefined;
        if (active === leavingActive) change(null);
      }, 160);
    },
    reset() {
      cancelEnter();
      cancelLeave();
      change(null);
    },
    dispose() {
      cancelEnter();
      cancelLeave();
    },
  };
}
