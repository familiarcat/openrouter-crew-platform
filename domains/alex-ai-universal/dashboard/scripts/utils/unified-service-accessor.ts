export const getUnifiedServiceAccessor = (name: string) => {
  console.log(`Service ${name} accessed`);
  return {};
};
export const getService = getUnifiedServiceAccessor;
