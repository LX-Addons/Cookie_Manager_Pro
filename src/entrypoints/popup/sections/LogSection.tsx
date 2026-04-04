import { ClearLog } from "@/components/ClearLog";

interface LogSectionProps {
  onMessage: (text: string, isError?: boolean) => void;
}

export const LogSection = ({ onMessage }: LogSectionProps) => {
  return (
    <div className="tab-content" role="tabpanel" id="log-panel">
      <ClearLog onMessage={onMessage} />
    </div>
  );
};
