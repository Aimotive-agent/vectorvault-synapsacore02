import React, { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import vectorVaultService from '../../services/vectorVaultService';
import { KnowledgeBase } from './types';

interface VectorBaseSelectorProps {
  selectedKbId: string;
  onSelectKb: (kbId: string) => void;
  className?: string;
}

const VectorBaseSelector: React.FC<VectorBaseSelectorProps> = ({ 
  selectedKbId, 
  onSelectKb,
  className = "" 
}) => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectKb = async (kbId: string) => {
    try {
      // Update the active KB in the service
      await vectorVaultService.setActiveKnowledgeBase(kbId);
      onSelectKb(kbId);
    } catch (error) {
      console.error('Error setting active knowledge base:', error);
    }
    setIsOpen(false);
  };

  // Load knowledge bases on component mount and refresh periodically
  useEffect(() => {
    const loadKnowledgeBases = async () => {
      setIsLoading(true);
      try {
        console.log('VectorBaseSelector: Loading knowledge bases from service...');
        const kbs = await vectorVaultService.getKnowledgeBases();
        console.log('VectorBaseSelector: Loaded knowledge bases:', kbs);
        
        if (kbs.length > 0) {
          setKnowledgeBases(kbs);
          
          // If there's an active KB set in the service but not in our component,
          // update the selected KB
          const activeKbId = await vectorVaultService.getActiveKnowledgeBaseId();
          console.log('VectorBaseSelector: Active knowledge base ID:', activeKbId);
          
          if (activeKbId && !selectedKbId) {
            console.log('VectorBaseSelector: Setting active knowledge base:', activeKbId);
            onSelectKb(activeKbId);
          } else if (kbs.length > 0 && !selectedKbId && !activeKbId) {
            // If no active KB is set but we have KBs, select the first one
            console.log('VectorBaseSelector: No active KB, selecting first available:', kbs[0].id);
            await vectorVaultService.setActiveKnowledgeBase(kbs[0].id);
            onSelectKb(kbs[0].id);
          }
        } else {
          console.warn('VectorBaseSelector: No knowledge bases found');
        }
      } catch (error) {
        console.error('Error loading knowledge bases:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial load
    loadKnowledgeBases();
    
    // Set up periodic refresh to catch any changes from other components
    const refreshInterval = setInterval(loadKnowledgeBases, 5000);
    
    return () => clearInterval(refreshInterval);
  }, [onSelectKb]);
  
  // Get the selected knowledge base name
  const selectedKbName = selectedKbId 
    ? knowledgeBases.find(kb => kb.id === selectedKbId)?.name || 'Unknown'
    : 'Select Vector Base';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Database className="w-4 h-4 text-slate-400" />
      <select 
        value={selectedKbId}
        onChange={(e) => handleSelectKb(e.target.value)}
        className="bg-slate-800 border border-slate-700 rounded-md py-1.5 px-3 text-sm font-medium text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        aria-label="Select a vector base"
      >
        <option value="">No vector base selected</option>
        {knowledgeBases.length > 0 ? (
          knowledgeBases.map(kb => (
            <option key={kb.id} value={kb.id}>{kb.name}</option>
          ))
        ) : (
          <option disabled>No vector bases available</option>
        )}
      </select>
    </div>
  );
};

export default VectorBaseSelector;
