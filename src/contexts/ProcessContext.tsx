import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

const bpmnFiles = [
    { key: 'BudgetReport', name: '全预算报告审批流程', file: 'budget-report-demo.bpmn20.xml' },
    { key: 'LeaveApproval', name: '员工请假审批流程', file: 'leave-approval.bpmn20.xml' },
    { key: 'ManagerTask', name: '主管任务下发流程', file: 'manager-task-flow.bpmn20.xml' },
    { key: 'MultiLevelAssignment', name: '多级任务自动分配流程', file: 'multi-level-assignment-simple.bpmn20.xml' },
    { key: 'TaskAssignment', name: '任务分派示例', file: 'task-assignment-demo.bpmn20.xml' },
    { key: 'TaskClaim', name: '任务认领与抢单流程', file: 'task-claim-demo.bpmn20.xml' }
];

// Mock initial data based on real files
const initialProcesses: ProcessDefinition[] = bpmnFiles.map((file, index) => ({
    id: uuidv4(),
    key: file.key,
    name: file.name,
    version: 1,
    status: 'deployed',
    xmlContent: '', // Will be loaded via fetch
    fileName: file.file,
    deployTime: new Date(Date.now() - (86400000 * (index + 1))).toISOString(),
    creator: 'Admin',
    createTime: new Date(Date.now() - (86400000 * (index + 2))).toISOString(),
}));

export const ProcessProvider = ({ children }: { children: ReactNode }) => {
    const [processes, setProcesses] = useState<ProcessDefinition[]>(initialProcesses);

    useEffect(() => {
        const loadInitialXml = async () => {
            const updatedProcesses = await Promise.all(processes.map(async (p) => {
                if (!p.xmlContent && p.fileName) {
                    try {
                        const response = await fetch(`/data/bpmn/${p.fileName}`);
                        const xml = await response.text();
                        return { ...p, xmlContent: xml };
                    } catch (e) {
                        console.error(`Failed to load XML for ${p.fileName}`, e);
                    }
                }
                return p;
            }));
            setProcesses(updatedProcesses);
        };
        loadInitialXml();
    }, []);

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
