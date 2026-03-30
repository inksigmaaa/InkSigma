export let isShuttingDown = false;
export let isStartupComplete = false;

export const setShuttingDown = (value: boolean) => {
  isShuttingDown = value;
};

export const setStartupComplete = (value: boolean) => {
  isStartupComplete = value;
};

export const getLifecycleState = () => ({
  isShuttingDown,
  isStartupComplete,
});
