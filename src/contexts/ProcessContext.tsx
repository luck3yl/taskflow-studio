import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
    getProcessDefinitionsApi,
    getProcessDefinitionDetailApi,
    getProcessInstancesApi,
    startProcessInstanceApi,
    getProcessInstanceVariablesApi,
    deleteProcessInstanceApi,
    uploadDeployProcessApi,
    deployBuiltinProcessesApi,
    getProcessDefinitionXmlApi,
    type ProcessDefinitionDto,
    type ProcessDefinitionDetailDto,
    type ProcessInstanceDto,
    type ProcessVariable,
    type FormDataField,
} from '@/services/apis/processes';
import { useToast } from '@/components/ui/use-toast';

export type { ProcessDefinitionDto, ProcessDefinitionDetailDto, ProcessInstanceDto, ProcessVariable, FormDataField };

interface ProcessContextType {
    /** 流程定义列表 */
    definitions: ProcessDefinitionDto[];
    /** 流程实例列表 */
    instances: ProcessInstanceDto[];
    /** 是否正在加载 */
    loading: boolean;
    /** 刷新流程定义列表 */
    refreshDefinitions: () => Promise<void>;
    /** 刷新流程实例列表 */
    refreshInstances: (params?: { processDefinitionKey?: string; category?: string; keyword?: string }) => Promise<void>;
    /** 查询流程定义详情（含 formKey / formData） */
    getDefinitionDetail: (definitionId: string) => Promise<ProcessDefinitionDetailDto | undefined>;
    /** 启动流程实例 */
    startInstance: (processKey: string, variables?: Record<string, unknown>) => Promise<ProcessInstanceDto | undefined>;
    /** 获取流程实例变量 */
    getInstanceVariables: (instanceId: string) => Promise<ProcessVariable[]>;
    /** 终止流程实例 */
    deleteInstance: (instanceId: string) => Promise<void>;
    /** 上传并部署流程文件 */
    uploadAndDeploy: (file: File) => Promise<void>;
    /** 一键部署内置流程 */
    deployBuiltin: () => Promise<void>;
    /** 获取流程 XML（用于预览） */
    getProcessXml: (definitionId: string) => Promise<string | undefined>;
}

const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

export const ProcessProvider = ({ children }: { children: ReactNode }) => {
    const [definitions, setDefinitions] = useState<ProcessDefinitionDto[]>([]);
    const [instances, setInstances] = useState<ProcessInstanceDto[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const refreshDefinitions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getProcessDefinitionsApi();
            // Flowable 分页格式：{ data: [...], total, start, ... }
            const list = Array.isArray(response) ? response : (response as any)?.data ?? [];
            setDefinitions(list);
        } catch (err: any) {
            console.error('Failed to load process definitions', err);
            toast({
                title: '加载失败',
                description: err?.message || '无法获取流程定义列表',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const refreshInstances = useCallback(async (params?: { processDefinitionKey?: string; category?: string; keyword?: string }) => {
        setLoading(true);
        try {
            const response = await getProcessInstancesApi({
                processDefinitionKey: params?.processDefinitionKey,
                category: params?.category,
                keyword: params?.keyword,
                size: 100,
            });
            const list = Array.isArray(response) ? response : (response as any)?.data ?? [];
            setInstances(list);
        } catch (err: any) {
            console.error('Failed to load process instances', err);
            toast({
                title: '加载失败',
                description: err?.message || '无法获取流程实例列表',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const getDefinitionDetail = useCallback(async (definitionId: string): Promise<ProcessDefinitionDetailDto | undefined> => {
        try {
            return await getProcessDefinitionDetailApi(definitionId);
        } catch (err: any) {
            console.error('Failed to get process definition detail', err);
            toast({
                title: '获取失败',
                description: err?.message || '无法获取流程定义详情',
                variant: 'destructive',
            });
            return undefined;
        }
    }, [toast]);

    const startInstance = useCallback(async (processKey: string, variables?: Record<string, unknown>): Promise<ProcessInstanceDto | undefined> => {
        try {
            const instance = await startProcessInstanceApi({
                process_key: processKey,
                variables,
            });
            // 刷新实例列表
            await refreshInstances({ processDefinitionKey: processKey });
            return instance;
        } catch (err: any) {
            console.error('Failed to start process instance', err);
            toast({
                title: '启动失败',
                description: err?.message || '无法启动流程实例',
                variant: 'destructive',
            });
            return undefined;
        }
    }, [toast, refreshInstances]);

    const getInstanceVariables = useCallback(async (instanceId: string): Promise<ProcessVariable[]> => {
        try {
            const vars = await getProcessInstanceVariablesApi(instanceId);
            return Array.isArray(vars) ? vars : [];
        } catch (err: any) {
            console.error('Failed to get instance variables', err);
            return [];
        }
    }, []);

    const deleteInstance = useCallback(async (instanceId: string) => {
        try {
            await deleteProcessInstanceApi(instanceId);
            setInstances(prev => prev.filter(i => i.id !== instanceId));
            toast({ title: '已终止', description: '流程实例已终止' });
        } catch (err: any) {
            console.error('Failed to delete process instance', err);
            toast({
                title: '终止失败',
                description: err?.message || '无法终止流程实例',
                variant: 'destructive',
            });
        }
    }, [toast]);

    const uploadAndDeploy = useCallback(async (file: File) => {
        try {
            await uploadDeployProcessApi(file);
            toast({ title: '部署成功', description: `流程文件 ${file.name} 已上传并部署` });
            await refreshDefinitions();
        } catch (err: any) {
            console.error('Upload & deploy failed', err);
            toast({
                title: '部署失败',
                description: err?.message || '上传部署流程失败',
                variant: 'destructive',
            });
        }
    }, [toast, refreshDefinitions]);

    const deployBuiltin = useCallback(async () => {
        try {
            await deployBuiltinProcessesApi();
            toast({ title: '部署成功', description: '内置流程已部署' });
            await refreshDefinitions();
        } catch (err: any) {
            console.error('Deploy builtin failed', err);
            toast({
                title: '部署失败',
                description: err?.message || '一键部署内置流程失败',
                variant: 'destructive',
            });
        }
    }, [toast, refreshDefinitions]);

    const getProcessXml = useCallback(async (definitionId: string): Promise<string | undefined> => {
        try {
            const result = await getProcessDefinitionXmlApi(definitionId);
            return result?.bpmn20Xml;
        } catch (err: any) {
            console.error('Failed to get process XML', err);
            toast({
                title: '获取失败',
                description: err?.message || '无法获取流程 XML',
                variant: 'destructive',
            });
            return undefined;
        }
    }, [toast]);

    return (
        <ProcessContext.Provider
            value={{
                definitions,
                instances,
                loading,
                refreshDefinitions,
                refreshInstances,
                getDefinitionDetail,
                startInstance,
                getInstanceVariables,
                deleteInstance,
                uploadAndDeploy,
                deployBuiltin,
                getProcessXml,
            }}
        >
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
