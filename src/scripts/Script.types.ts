export interface ScriptType {
    id: number,
    events: {
        error: {
            error: any
        }
    }
}

export interface ScriptProps {
    id: number;
    name: string;
    icon: string;
    code: string;
    userId: number|null;
}
