import React, { useState } from 'react';
import { Database, Check } from 'lucide-react';
import { vectorVaultService } from '../../services/vectorVaultService';

interface SaveToVaultButtonProps {
  content: string;
  selectedKbId: string;
  className?: string;
}

const SaveToVaultButton: React.FC<SaveToVaultButtonProps> = ({ 
  content, 
  selectedKbId,
  className = "" 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const handleSaveToVault = async () => {
    if (!selectedKbId || !content.trim() || isSaving) return;
    
    setIsSaving(true);
    
    try {
      // Use the service to save the AI message to the vault
      // Each save creates a new document with a unique timestamp in the title
      const savedDoc = await vectorVaultService.saveAIMessageToVault(content, selectedKbId, {
        source: 'SynapseCore Chat',
        type: 'ai_response',
        saveCount: savedCount + 1
      });
      
      console.log('Successfully saved to vault:', savedDoc);
      setSavedCount(prev => prev + 1);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000); // Reset after 3 seconds
    } catch (error) {
      console.error('Error saving to vault:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSaveToVault}
        disabled={!selectedKbId || isSaving || isSaved}
        className={`p-1.5 rounded-md transition-colors ${
          isSaved 
            ? 'bg-success text-white' 
            : selectedKbId 
              ? 'bg-navy hover:bg-navy-deep text-white' 
              : 'bg-line text-muted-foreground cursor-not-allowed'
        } ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {isSaved ? (
          <Check className="w-4 h-4" />
        ) : (
          <Database className="w-4 h-4" />
        )}
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-navy-deep text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          {!selectedKbId 
            ? 'Select a vector base first' 
            : isSaved 
              ? 'Saved to vault!' 
              : 'Save to vector vault'}
        </div>
      )}
    </div>
  );
};

export default SaveToVaultButton;
