export const useEnv = () => {
  const isDevEnv = import.meta.env.DEV;
  const isProdEnv = import.meta.env.PROD;

  return { isDevEnv, isProdEnv };
};
