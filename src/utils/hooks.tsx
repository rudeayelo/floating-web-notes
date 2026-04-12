export const useEnv = () => {
  const isDevEnv = import.meta.env.DEV || import.meta.env.MODE === "screenshot";
  const isProdEnv = import.meta.env.PROD;

  return { isDevEnv, isProdEnv };
};
