// react-native-randombytes ships without TypeScript types. Only the synchronous
// form used by writeToCard.ts is declared here.
declare module 'react-native-randombytes' {
  export function randomBytes(size: number): {
    toString(encoding: 'hex'): string;
  };
}
