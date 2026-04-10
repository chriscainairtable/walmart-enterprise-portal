'use client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PasscodeGate = require('./PasscodeGate').default;

export default function PasscodeGateWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PasscodeGate appName="Walmart Enterprise Platform" passcode="airtable">
      {children}
    </PasscodeGate>
  );
}
