import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessDefinition, ProcessStatus } from '../types/process';
import { v4 as uuidv4 } from 'uuid';

interface ProcessContextType {
    processes: ProcessDefinition[];
    uploadProcess: (xmlContent: string, key: string, name: string) => void;
    deployProcess: (id: string) => void;
    suspendProcess: (id: string) => void;
    getProcessById: (id: string) => ProcessDefinition | undefined;
}

const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

// Mock initial data
const initialProcesses: ProcessDefinition[] = [
    {
        id: uuidv4(),
        key: 'LeaveApproval',
        name: '请假审批流程',
        version: 1,
        status: 'deployed',
        xmlContent: '<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_1"><bpmn:process id="LeaveApproval" name="请假审批流程" isExecutable="true"><bpmn:startEvent id="StartEvent_1"/></bpmn:process></bpmn:definitions>',
        deployTime: new Date(Date.now() - 86400000).toISOString(),
        creator: 'Admin',
        createTime: new Date(Date.now() - 86400000).toISOString(),
    }
];

export const ProcessProvider = ({ children }: { children: ReactNode }) => {
    const [processes, setProcesses] = useState<ProcessDefinition[]>(initialProcesses);

    const uploadProcess = (xmlContent: string, key: string, name: string) => {
        // Find the latest version for this key
        const existingProcesses = processes.filter(p => p.key === key);
        const latestVersion = existingProcesses.length > 0
            ? Math.max(...existingProcesses.map(p => p.version))
            : 0;

        const newProcess: ProcessDefinition = {
            id: uuidv4(),
            key,
            name,
            version: latestVersion + 1,
            status: 'undeployed',
            xmlContent,
            creator: 'Current User', // Mocked user
            createTime: new Date().toISOString()
        };

        setProcesses(prev => [newProcess, ...prev]);
    };

    const deployProcess = (id: string) => {
        setProcesses(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, status: 'deployed', deployTime: new Date().toISOString() };
            }
            return p;
        }));
    };

    const suspendProcess = (id: string) => {
        setProcesses(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, status: 'suspended' };
            }
            return p;
        }));
    };

    const getProcessById = (id: string) => {
        return processes.find(p => p.id === id);
    };

    return (
        <ProcessContext.Provider value={{ processes, uploadProcess, deployProcess, suspendProcess, getProcessById }}>
            {children}
        </ProcessContext.Provider>
    );
};

export const useProcess = () => {
    const context = useContext(ProcessContext);
    if (context === undefined) {
        throw new Error('useProcess must be used within a ProcessProvider');
    }
    return context;
};
