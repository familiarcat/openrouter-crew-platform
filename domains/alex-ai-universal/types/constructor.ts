export type Constructor<T = any> = new (...args: any[]) => T;
export const ConstructorEventSchema = {
  parse: (data: any) => data
};
