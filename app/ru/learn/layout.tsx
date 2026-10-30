import { ProgressSync } from "../../../components/ProgressSync";

export default function LearnLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <ProgressSync />
      {children}
    </>
  );
}
