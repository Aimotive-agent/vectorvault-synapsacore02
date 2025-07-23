import { AISettingsCard } from '@/components/mcp/AISettingsCard';
import { useAISettings } from '@/hooks/useAISettings';

const SettingsPage = () => {
  const { settings, saveSettings, setSettings } = useAISettings();

  const handleSettingsChange = (newSettings: Partial<typeof settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  return (
    <div className="h-full">
      <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
      <p className="text-gray-400 mb-6">Configure your AI and application settings.</p>
      <AISettingsCard 
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onLog={() => {}} // No-op for now, can be implemented later
      />
    </div>
  );
};

export default SettingsPage;
