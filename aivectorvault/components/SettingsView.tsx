
import React from 'react';

const SettingsSection: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-800 rounded-lg shadow-lg">
        <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
        <div className="md:col-span-2 space-y-4">
            {children}
        </div>
    </div>
);

const SettingsInput: React.FC<{ label: string; id: string; type: string; value: string | number; disabled?: boolean }> = ({ label, id, type, value, disabled }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">{label}</label>
        <input 
            type={type} 
            id={id}
            defaultValue={value}
            disabled={disabled}
            className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-800 disabled:text-slate-500" 
        />
    </div>
);

const SettingsSelect: React.FC<{ label: string; id: string; children: React.ReactNode }> = ({ label, id, children }) => (
     <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">{label}</label>
        <select id={id} className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            {children}
        </select>
    </div>
);


const SettingsView: React.FC = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white">Settings</h2>

      <SettingsSection title="Vector Processing" description="Configure how your documents are chunked and embedded.">
        <SettingsSelect label="Embedding Model" id="embedding-model">
            <option>OpenAI text-embedding-ada-002</option>
            <option>Cohere embed-english-v2.0</option>
            <option>Local SentenceTransformer</option>
        </SettingsSelect>
        <SettingsInput label="Chunk Size (tokens)" id="chunk-size" type="number" value="1024" />
        <SettingsInput label="Chunk Overlap (tokens)" id="chunk-overlap" type="number" value="200" />
      </SettingsSection>

      <SettingsSection title="Storage & Billing" description="Manage your storage quota and billing information.">
        <div>
            <label className="block text-sm font-medium text-slate-300">Storage Quota</label>
            <div className="mt-1 w-full bg-slate-700 rounded-full h-4">
                <div className="bg-indigo-600 h-4 rounded-full" style={{width: "27%"}}></div>
            </div>
            <p className="text-xs text-slate-400 mt-1 text-right">2.7 GB of 10 GB used</p>
        </div>
        <button className="w-full md:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Manage Subscription
        </button>
      </SettingsSection>
      
      <SettingsSection title="Data Management" description="Export or import your entire knowledge base.">
        <div className="flex space-x-4">
            <button className="w-full md:w-auto px-4 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600">
                Export Knowledge Base
            </button>
            <button className="w-full md:w-auto px-4 py-2 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-200 bg-slate-700 hover:bg-slate-600">
                Import Knowledge Base
            </button>
        </div>
      </SettingsSection>

    </div>
  );
};

export default SettingsView;
