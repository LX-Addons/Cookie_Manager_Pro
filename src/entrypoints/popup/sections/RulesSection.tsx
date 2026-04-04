import { DomainManager } from "@/components/DomainManager";
import type { Settings as SettingsType } from "@/types";
import { ModeType } from "@/types";

interface RulesSectionProps {
  settings: SettingsType;
  currentDomain: string;
  onMessage: (text: string, isError?: boolean) => void;
  handleClearBlacklist: () => void;
}

export const RulesSection = ({
  settings,
  currentDomain,
  onMessage,
  handleClearBlacklist,
}: RulesSectionProps) => {
  return (
    <div className="tab-content" role="tabpanel" id="rules-panel">
      <DomainManager
        type={settings.mode === ModeType.WHITELIST ? "whitelist" : "blacklist"}
        currentDomain={currentDomain}
        onMessage={onMessage}
        onClearBlacklist={settings.mode === ModeType.BLACKLIST ? handleClearBlacklist : undefined}
      />
    </div>
  );
};
